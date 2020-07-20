import matplotlib
matplotlib.use('Agg')
import os, sys
import cv2
import yaml
from tqdm import tqdm
import boto3
import imageio
import numpy as np
from skimage.transform import resize
from skimage import img_as_ubyte
import torch
from sync_batchnorm import DataParallelWithCallback
from modules.generator import OcclusionAwareGenerator
from modules.keypoint_detector import KPDetector
from animate import normalize_kp
from scipy.spatial import ConvexHull
from faced import FaceDetector
from pykalman import KalmanFilter

log_dir = 'log'
cfg_path = 'config/vox-adv-256.yaml'
model_path = 'vox-adv-cpk.pth.tar'

def load_checkpoints(config_path, checkpoint_path):

    with open(config_path) as f:
        config = yaml.load(f)

    generator = OcclusionAwareGenerator(**config['model_params']['generator_params'],
                                        **config['model_params']['common_params'])
    generator.cuda()

    kp_detector = KPDetector(**config['model_params']['kp_detector_params'],
                             **config['model_params']['common_params'])
    kp_detector.cuda()

    checkpoint = torch.load(checkpoint_path)

    generator.load_state_dict(checkpoint['generator'])
    kp_detector.load_state_dict(checkpoint['kp_detector'])

    generator = DataParallelWithCallback(generator)
    kp_detector = DataParallelWithCallback(kp_detector)

    generator.eval()
    kp_detector.eval()

    return generator, kp_detector

def make_animation(source_image, driving_video, generator, kp_detector):
    with torch.no_grad():
        predictions = []
        source = torch.tensor(source_image[np.newaxis].astype(np.float32)).permute(0, 3, 1, 2)
        source = source.cuda()
        driving = torch.tensor(np.array(driving_video)[np.newaxis].astype(np.float32)).permute(0, 4, 1, 2, 3)
        kp_source = kp_detector(source)
        kp_driving_initial = kp_detector(driving[:, :, 0])

        for frame_idx in tqdm(range(driving.shape[2])):
            driving_frame = driving[:, :, frame_idx]
            driving_frame = driving_frame.cuda()
            kp_driving = kp_detector(driving_frame)
            kp_norm = normalize_kp(kp_source=kp_source, kp_driving=kp_driving,
                                   kp_driving_initial=kp_driving_initial, use_relative_movement=True,
                                   use_relative_jacobian=True, adapt_movement_scale=True)
            out = generator(source, kp_source=kp_source, kp_driving=kp_norm)

            predictions.append(np.transpose(out['prediction'].data.cpu().numpy(), [0, 2, 3, 1])[0])
    return predictions

def crop_video(path):
    face_detector = FaceDetector()

    cap = cv2.VideoCapture(path)

    width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)   # float
    height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT) # float
    fps = cap.get(cv2.CAP_PROP_FPS) # float

    fourcc = cv2.VideoWriter_fourcc(*'MJPG')
    out = cv2.VideoWriter("output.avi",fourcc, fps, (int(width), int(height)))

    bbox_video = []
    ret, frame = cap.read()
    while ret:
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        bboxes = face_detector.predict(rgb_frame, 0.9)
        if len(bboxes) != 0:
            main_face = max(bboxes, key=lambda x: x[4])
            bbox_video.append([main_face[0], main_face[1], main_face[2], main_face[3]])

            print("Bounding boxes:")
            print(bboxes)
            print(f"main face: {main_face}")
        else:
            print("No bounding boxes found")
            # TODO enlarge bounding box
            bbox_video.append([0, 0, 0, 0])

        ret, frame = cap.read()


    # When everything done, release the capture
    cap.release()
    kf = KalmanFilter(initial_state_mean=0, n_dim_obs=4)
    smoothed = kf.em(bbox_video).smooth(bbox_video)
    smoothed = [[smoothed[i][j] for j in range(len(smoothed[0]))] for i in range(len(smoothed))]
    print("bboxes")
    print(bbox_video)
    print("smoothed")
    print(smoothed)
    print("done")

if __name__ == '__main__':
    SRC_IMG = os.environ['img']
    SRC_VIDEO = os.environ['video']
    RESULT_VIDEO = 'result.mp4'
    OUT_BUCKET = 'spaceface-out'
    crop_args = {
        'image_shape': (256, 256),
        'increase': 0.1,
        'iou_with_initial': 0.25,
        'inp': SRC_VIDEO,
        'min_frames': 150,
        'cpu': True
    }

    with open(cfg_path) as f:
        cfg = yaml.load(f)
    os.makedirs(log_dir, exist_ok=True)

    # load source image and video
    # TODO change to cv2 imread
    source_image = imageio.imread(SRC_IMG)
    reader = imageio.get_reader(SRC_VIDEO)
    fps = reader.get_meta_data()['fps']
    driving_video = []
    try:
        for im in reader:
            driving_video.append(im)
    except RuntimeError:
        pass
    reader.close()

    crop_video(SRC_VIDEO)

    # Resize input
    source_image = resize(source_image, (256, 256))[..., :3]
    driving_video = [resize(frame, (256, 256))[..., :3] for frame in aligned_video]
    print("c")
    generator, kp_detector = load_checkpoints(config_path=cfg_path, checkpoint_path=model_path)
    print("b")
    predictions = make_animation(source_image, driving_video, generator, kp_detector)
    print("a")
    s3 = boto3.client('s3')
    imageio.mimsave(RESULT_VIDEO, [img_as_ubyte(frame) for frame in predictions], fps=fps)
    s3.upload_file(RESULT_VIDEO, OUT_BUCKET, RESULT_VIDEO)
