import os.path
import cv2
import numpy as np
from tqdm import tqdm
import json
import sys
import time
from models.model_settings import MODEL_POOL
from io import BytesIO
from models.stylegan_generator import StyleGANGenerator
from utils.logger import setup_logger
from utils.manipulator import linear_interpolate
from flask import Flask, flash, request, redirect, url_for, send_file
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
img_size = 512

app = Flask(__name__)

example_req_body = {
    'type': 'age',
    'min': -1,
    'max': 1,
    'steps': 10
}

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

def manipulate(boundary, min, max, steps):
    logger.info(f'Preparing boundary.')

@app.route('/edit/<id>', methods=['POST', 'GET'])
def edit_image(id):
    #print (request.is_json)
    content = {
    	"type":"age",
    	"min":-1,
    	"max":1,
    	"steps":5
    }
    print(content)

    if not content or 'type' not in content:
        return 'Valid type not found'

    print(content)
    b = content['type']

    if b not in boundaries:
        return "Invalid boundary"

    boundary_path = boundaries[b]


    if not os.path.isfile(boundary_path):
      raise ValueError(f'Boundary `{boundary_path}` does not exist!')

    boundary = np.load(boundary_path)

    logger.info(f'Preparing latent codes.')
    latent_code_path = f'latents/{id}.npy'
    if os.path.isfile(latent_code_path):
      logger.info(f'  Load latent codes from `{latent_code_path}`.')
      latent_codes = np.load(latent_code_path)
      latent_codes = model.preprocess(latent_codes, **kwargs)
    else:
      logger.info(f'  No latent codes found. Error')

    total_num = latent_codes.shape[0]

    logger.info(f'Editing {total_num} samples.')

    memory_file = BytesIO()
    zipfile_name = f"{id}.zip"
    with ZipFile(memory_file, 'w') as zf:
        for i, sample_id in enumerate(tqdm(range(total_num), leave=False)):
            interpolations = linear_interpolate(latent_codes[sample_id:sample_id + 1],
                                              boundary,
                                              start_distance=content['min'],
                                              end_distance=content['max'],
                                              steps=content['steps'])
            interpolation_id = 0
            for interpolations_batch in model.get_batch_inputs(interpolations):
                outputs = model.easy_synthesize(interpolations_batch, **kwargs)
                for j, img in enumerate(outputs['image']):
                    imname = f'{i}_{j}'
                    formatted_img = cv2.imencode('.png', cv2.cvtColor(img, cv2.COLOR_RGB2BGR))[1].tobytes()
                    print(formatted_img)
                    data = ZipInfo(imname)
                    data.date_time = time.localtime(time.time())[:6]
                    data.compress_type = ZIP_DEFLATED
                    zf.writestr(data, formatted_img)
                    interpolation_id += 1

    memory_file.seek(0)
    assert interpolation_id == content['steps']
    logger.debug(f'  Finished sample {sample_id:3d}.')
    logger.info(f'Successfully edited {total_num} samples.')
    return send_file(memory_file, attachment_filename=zipfile_name, as_attachment=True, mimetype='application/zip')

if __name__ == '__main__':
    setup()
    app.run()
