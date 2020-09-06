import matplotlib
matplotlib.use('Agg')
import os, sys
import cv2
import imageio
import numpy as np
from skimage.transform import resize
import yaml
from tqdm import tqdm
import boto3
from skimage import img_as_ubyte
import torch
from sync_batchnorm import DataParallelWithCallback
from modules.generator import OcclusionAwareGenerator
from modules.keypoint_detector import KPDetector
from animate import normalize_kp
from scipy.spatial import ConvexHull
from demo import make_animation
from faced import FaceDetector
import moviepy.editor as moviepy

cfg_path = 'config/vox-adv-256.yaml'
model_path = 'vox-adv-cpk.pth.tar'

# This is the size of images before sending them to the neural networks.
PROCESSING_IMAGE_SIZE = (256, 256)

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


def fix_aspect_ratio(width, height, desired_aspect_ratio):
  if (height * desired_aspect_ratio > width):
    return (int(height * desired_aspect_ratio), height)
  return (width, int(width / desired_aspect_ratio))


def clip(x, minX, maxX):
  return min(max(x, minX), maxX)

def constrain_new_crop(prev_crop, new_crop, unit):
  # Makes sure the new crop does is not too far from the old one.
  return [int(clip(prev_crop[i] * 0.95 + new_crop[i] * 0.05, prev_crop[i] - unit, prev_crop[i] + unit)) for i in range(4)]


def prepare_frame(frame, face_detector, previous_crop, desired_aspect, crop_scale=1.5):
  # Crops & formats the frame to the right size for processing. Returns the crop.
  (height, width) = frame.shape[0:2]

  bboxes = face_detector.predict(frame)
  current_crop = previous_crop
  if len(bboxes) > 0:
    x, y, w, h, _ = max(bboxes, key=lambda x: x[4])
    w, h = fix_aspect_ratio(w, h, desired_aspect)

    x -= int(w * crop_scale / 2)
    y -= int(h * crop_scale / 2)
    w = int(w * crop_scale)
    h = int(h * crop_scale)

    new_crop = [max(x, 0), max(y, 0),
                min(width, x + w + 1),
                min(height, y + h + 1)]

    if current_crop:
      # Smooth the new crop.
      # TODO: This logic messes up aspect ratio. It should not.
      current_crop = constrain_new_crop(current_crop, new_crop, min(width, height) / 100)
    else:
      current_crop = new_crop

  if current_crop is None:
    print("No face in video yet, skipping frame.")
    return None, None

  cropped_frame = frame[current_crop[1]:current_crop[3], current_crop[0]:current_crop[2]]
  scaled_frame = resize(cropped_frame, PROCESSING_IMAGE_SIZE)[..., :3]

  return scaled_frame, current_crop


if __name__ == '__main__':
    SRC_VIDEO = os.environ['VIDEO_FILE']
    SRC_IMG = os.environ['IMAGE_FILE']
    DESTINATION_VIDEO = os.environ['RESULT_FILE']

    SRC_BUCKET = os.environ['INPUT_BUCKET']
    OUT_BUCKET = os.environ['OUTPUT_BUCKET']


    # This many frames will be processed at once:
    FRAME_BATCH_SIZE = int(os.environ['FRAME_BATCH_SIZE']) # 200 is ~3 GB of RAM

    RESULT_VIDEO = 'temp_output.mp4'

    s3 = boto3.client('s3')
    s3.download_file(SRC_BUCKET, SRC_IMG, SRC_IMG)
    s3.download_file(SRC_BUCKET, SRC_VIDEO, SRC_VIDEO)

    face_detector = FaceDetector()
    previous_crop = None

    generator, kp_detector = load_checkpoints(config_path=cfg_path, checkpoint_path=model_path)

    source_image = imageio.imread(SRC_IMG)
    (source_height, source_width) = source_image.shape[0:2]
    source_image = resize(source_image, PROCESSING_IMAGE_SIZE)[..., :3]

    video_reader = imageio.get_reader(SRC_VIDEO)
    fps = int(video_reader.get_meta_data()['fps'])
    temp_video_file = "no_sound_" + RESULT_VIDEO
    video_writer = imageio.get_writer(temp_video_file, fps=fps)

    # Debug only:
    # cropped_input_writer = imageio.get_writer('cropped_' + RESULT_VIDEO, fps=fps)

    frames_left = len(video_reader) - 5 # - 5 is a hack - sometimes ffmpeg can't read the last frames for some reason.
    print("Num frames: " + str(frames_left))
    frames_skipped = 0

    while frames_left > 0:
      frames = []
      for _ in range(min(FRAME_BATCH_SIZE, frames_left)):
        frame, previous_crop = prepare_frame(video_reader.get_next_data(), face_detector, previous_crop, source_width / source_height)
        frames_left -= 1
        if frame is None:
          # This is the case where we don't see a face at the start of a video. We just skip those frames.
          frames_skipped += 1
          continue
        # Debug only:
        # cropped_input_writer.append_data(frame)
        frames.append(frame)

      if len(frames) > 0:
        animated_image = make_animation(source_image, frames, generator, kp_detector, relative=True)
        for animated_frame in animated_image:
          video_writer.append_data(img_as_ubyte(animated_frame))

    video_reader.close()
    video_writer.close()
    # Debug only:
    # cropped_input_writer.close()

    # Add sound:
    animated_video = moviepy.VideoFileClip(temp_video_file)
    original_video = moviepy.VideoFileClip(SRC_VIDEO)

    if original_video.audio is not None:
      animated_video = animated_video.set_audio(original_video.audio.subclip(frames_skipped / fps))
    animated_video.write_videofile(RESULT_VIDEO)

    s3.upload_file(RESULT_VIDEO, OUT_BUCKET, DESTINATION_VIDEO)
