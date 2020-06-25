import os
import cv2
import numpy as np
from tqdm import tqdm
import uuid
import json
import sys
import time
import boto3
from models.model_settings import MODEL_POOL
from io import BytesIO
from models.stylegan_generator import StyleGANGenerator
from utils.logger import setup_logger
from utils.manipulator import linear_interpolate
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

RESULTS_BUCKET = 'spaceface-out'

def setup():
    global logger
    global model
    global boundaries
    global cfg
    global kwargs
    cfg = {
        'output_dir': 'results',
        'model_name': 'stylegan_ffhq',
    }
    logger = setup_logger(logger_name='generate_data')
    model = StyleGANGenerator(cfg['model_name'], logger)
    kwargs = {'latent_space_type': 'Wp'}
    boundaries = {
        'age': 'boundaries/stylegan_ffhq_age_w_boundary.npy',
        'gender': 'boundaries/stylegan_ffhq_gender_w_boundary.npy',
        'pose': 'boundaries/stylegan_ffhq_pose_w_boundary.npy',
        'smile': 'boundaries/stylegan_ffhq_smile_w_boundary.npy',
        'glasses': 'boundaries/stylegan_ffhq_eyeglasses_w_boundary.npy'
    }

def fetch_args():
    if 'TYPE' not in os.environ:
        print("Boundary type not found in environment")
        return None

    b_type = os.environ['TYPE']
    min = os.environ['MIN']
    max = os.environ['MAX']
    steps = os.environ['STEPS']
    id = os.environ['ID']
    result_id = os.environ['RESULT_ID']
    return {
        'type': b_type,
        'min': int(min),
        'max': int(max),
        'steps': int(steps),
        'id': id,
        'result_id': result_id
    }

def edit_image(args):
    b = args['type']

    if b not in boundaries:
        return "Invalid boundary"

    boundary_path = boundaries[b]


    if not os.path.isfile(boundary_path):
        raise ValueError(f'Boundary `{boundary_path}` does not exist!')

    boundary = np.load(boundary_path)
    id = args['id']
    logger.info('Preparing latent codes.')
    fname = f'{id}.npy'
    latent_code_path = f'latents/{fname}'
    if os.path.isfile(latent_code_path):
        logger.info(f'  Load latent codes from `{latent_code_path}`.')

    else:
        logger.info(f'  No latent codes found. Querying S3...')
        s3 = boto3.client('s3')
        s3.download_file('latents', fname, latent_code_path)

    latent_codes = np.load(latent_code_path)
    latent_codes = model.preprocess(latent_codes, **kwargs)

    total_num = latent_codes.shape[0]

    logger.info(f'Editing {total_num} samples.')

    memory_file = BytesIO()
    zipfile_name = f"{id}.zip"
    with ZipFile(memory_file, 'w') as zf:
        for i, sample_id in enumerate(tqdm(range(total_num), leave=False)):
            interpolations = linear_interpolate(latent_codes[sample_id:sample_id + 1],
                                              boundary,
                                              start_distance=args['min'],
                                              end_distance=args['max'],
                                              steps=args['steps'])
            interpolation_id = 0
            for interpolations_batch in model.get_batch_inputs(interpolations):
                outputs = model.easy_synthesize(interpolations_batch, **kwargs)
                for img in outputs['image']:
                    imname = f'{interpolation_id}.png'
                    formatted_img_bytes = cv2.imencode('.png', cv2.cvtColor(img, cv2.COLOR_RGB2BGR))[1].tobytes()
                    memory_file_img = BytesIO(formatted_img_bytes)
                    # memory_file_img.seek(0)
                    s3.upload_fileobj(memory_file_img, RESULTS_BUCKET, os.path.join(args['result_id'], imname))
                    # print(formatted_img)
                    data = ZipInfo(imname)
                    data.date_time = time.localtime(time.time())[:6]
                    data.compress_type = ZIP_DEFLATED
                    # zf.writestr(data, formatted_img)
                    interpolation_id += 1

    memory_file.seek(0)
    assert interpolation_id == args['steps']
    logger.debug(f'  Finished sample {sample_id:3d}.')
    logger.info(f'Successfully edited {total_num} samples.')
    # send file object to s3
    s3.upload_fileobj(memory_file, RESULTS_BUCKET, args['result_id'])
    print(f'finished uploading file {str(args["result_id"])}')

def run():
    args = fetch_args()
    if args is not None:
        edit_image(args)

if __name__ == '__main__':
    setup()
    run()
