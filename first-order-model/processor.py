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
from demo import make_animation

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

def crop_video(path, driving_video, face_detector, crop_scale=3):

    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS) # float
    width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)   # float
    height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT) # float
    cap.release()

    best_r = 0
    best_frame = None
    x, y, w, h = 0, 0, 0, 0
    for frame in driving_video:
        bboxes = face_detector.predict(frame)
        if len(bboxes) > 0:
            _x, _y, _w, _h, r = max(bboxes, key=lambda x: x[4])
            if r > best_r:
                best_r = r
                best_frame = frame
                x, y, w, h = _x, _y, _w, _h

    new_x = x - crop_scale * w // 2
    new_y = y - crop_scale * w // 2
    start_x = int(max(new_x, 0))
    start_y = int(max(new_y, 0))
    end_x = int(min(width - 1, start_x + crop_scale * w))
    end_y = int(min(height - 1, start_y + crop_scale * w))
    cropped_video = [frame[start_y:end_y, start_x:end_x] for frame in driving_video]
    return cropped_video


def find_best_frame(source, driving, face_detector, cpu=False):
    def normalize_kp(kp):
        kp = kp - kp.mean(axis=0, keepdims=True)
        area = ConvexHull(kp[:, :2]).volume
        area = np.sqrt(area)
        kp[:, :2] = kp[:, :2] / area
        return kp

    # todo REPLACE FACE_ALIGNMENT
    bboxes, idx = [], 0
    while len(bboxes) < 0:
        frame = driving[idx]
        bboxes = face_detector.predict(frame)
        idx += 1
        x, y, w, h, _ = max(bboxes, key=lambda x: x[4])

    kp_source = fa.get_landmarks(255 * source)

    # TODO check for none
    kp_source = kp_source[0]
    kp_source = normalize_kp(kp_source)
    norm  = float('inf')
    frame_num = 0
    for i, image in tqdm(enumerate(driving)):
        kp_driving = fa.get_landmarks(255 * image)[0]
        kp_driving = normalize_kp(kp_driving)
        new_norm = (np.abs(kp_source - kp_driving) ** 2).sum()
        if new_norm < norm:
            norm = new_norm
            frame_num = i
    return frame_num

if __name__ == '__main__':
    # filename
    SRC_VIDEO = os.environ['video']

    # filename
    SRC_IMG = os.environ['img']

    # id
    RESULT_VIDEO = os.environ['result']
    CROP_VIDEO = f'crop_{RESULT_VIDEO}'
    OUT_BUCKET = 'spaceface-out'
    SRC_BUCKET = 'spaceface-images'

    crop_scale = 2.5

    s3 = boto3.client('s3')
    s3.download_file(SRC_BUCKET, SRC_IMG, SRC_IMG)
    s3.download_file(SRC_BUCKET, SRC_VIDEO, SRC_VIDEO)

    source_image = imageio.imread(SRC_IMG)
    reader = imageio.get_reader(SRC_VIDEO)
    fps = int(reader.get_meta_data()['fps'])
    driving_video = []
    try:
        for im in reader:
            driving_video.append(im)
    except RuntimeError:
        pass
    reader.close()

    fd = FaceDetector()
    driving_video = crop_video(SRC_VIDEO, driving_video, fd)

    # Resize input
    source_image = resize(source_image, (256, 256))[..., :3]
    driving_video = [resize(frame, (256, 256))[..., :3] for frame in driving_video]

    generator, kp_detector = load_checkpoints(config_path=cfg_path, checkpoint_path=model_path)

    predictions = make_animation(source_image, driving_video, generator, kp_detector, relative=True)

    imageio.mimsave(RESULT_VIDEO, [img_as_ubyte(frame) for frame in predictions], fps=fps)

    writer = imageio.get_writer(CROP_VIDEO, fps=fps)
    for img in driving_video:
        writer.append_data(img)

    writer.close()
    s3.upload_file(CROP_VIDEO, OUT_BUCKET, CROP_VIDEO)
    s3.upload_file(RESULT_VIDEO, OUT_BUCKET, RESULT_VIDEO)
