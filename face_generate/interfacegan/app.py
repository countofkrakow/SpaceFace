import os.path
import cv2
import numpy as np
from tqdm import tqdm

from models.model_settings import MODEL_POOL
from models.stylegan_generator import StyleGANGenerator
from utils.logger import setup_logger
from utils.manipulator import linear_interpolate
from flask import Flask, flash, request, redirect, url_for
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
img_size = 512

app = Flask(__name__)

cfg = {
    'output_dir': 'results',
    'model_name': 'stylegan_ffhq',
}

boundaries = {
    'age': 'SpaceFace/face_generate/interfacegan/boundaries/stylegan_ffhq_age_w_boundary.npy',
    'gender': 'SpaceFace/face_generate/interfacegan/boundaries/stylegan_ffhq_gender_w_boundary.npy',
    'pose': 'SpaceFace/face_generate/interfacegan/boundaries/stylegan_ffhq_pose_w_boundary.npy',
    'smile': 'SpaceFace/face_generate/interfacegan/boundaries/stylegan_ffhq_smile_w_boundary.npy',
    'glasses': 'SpaceFace/face_generate/interfacegan/boundaries/stylegan_ffhq_eyeglasses_w_boundary.npy'
}

example_req_body = {
    'type': 'age',
    'min': -1,
    'max': 1,
    'steps': 10
}

def setup():
    global logger
    global model
    logger = setup_logger(cfg['output_dir'], logger_name='generate_data')
    model = StyleGANGenerator(cfg['model_name'], logger)


def manipulate(boundary, min, max, steps):
    logger.info(f'Preparing boundary.')

@app.route('/edit/<uuid:id>', methods=['POST'])
def edit_image(id):
    print (request.is_json)
    content = request.get_json()

    print (content)
    if 'type' not in content:
        return 'Valid type not found'

    b = content['type']

    if b not in boundaries:
        return "Invalid boundary"

    boundary_path = boundaries[b]


    if not os.path.isfile(boundary_path):
      raise ValueError(f'Boundary `{boundary_path}` does not exist!')

    boundary = np.load(boundary_path)

    logger.info(f'Preparing latent codes.')
    if os.path.isfile(args.input_latent_codes_path):
      logger.info(f'  Load latent codes from `{args.input_latent_codes_path}`.')
      latent_codes = np.load(args.input_latent_codes_path)
      latent_codes = model.preprocess(latent_codes, **kwargs)
    else:
      logger.info(f'  Sample latent codes randomly.')
      latent_codes = model.easy_sample(args.num, **kwargs)
    np.save(os.path.join(args.output_dir, 'latent_codes.npy'), latent_codes)
    total_num = latent_codes.shape[0]

    logger.info(f'Editing {total_num} samples.')
    for sample_id in tqdm(range(total_num), leave=False):
      interpolations = linear_interpolate(latent_codes[sample_id:sample_id + 1],
                                          boundary,
                                          start_distance=args.start_distance,
                                          end_distance=args.end_distance,
                                          steps=args.steps)
      interpolation_id = 0
      for interpolations_batch in model.get_batch_inputs(interpolations):
        if gan_type == 'pggan':
          outputs = model.easy_synthesize(interpolations_batch)
        elif gan_type == 'stylegan':
          outputs = model.easy_synthesize(interpolations_batch, **kwargs)
        for image in outputs['image']:
          save_path = os.path.join(args.output_dir,
                                   f'{sample_id:03d}_{interpolation_id:03d}.jpg')
          cv2.imwrite(save_path, image[:, :, ::-1])
          interpolation_id += 1
      assert interpolation_id == args.steps
      logger.debug(f'  Finished sample {sample_id:3d}.')
    logger.info(f'Successfully edited {total_num} samples.')


if __name__ == '__main__':
    setup()
    app.run()
