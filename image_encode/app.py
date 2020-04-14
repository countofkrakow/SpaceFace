import os
import pickle
import numpy as np
import cv2
import tensorflow as tf
import PIL.Image
from encoder.generator_model import Generator
from encoder.perceptual_model import PerceptualModel
import dnnlib
import dnnlib.tflib as tflib
import uuid
from flask import Flask, flash, request, redirect, url_for
from werkzeug.utils import secure_filename
import sys
import bz2
from keras.utils import get_file
from ffhq_dataset.face_alignment import image_align
from ffhq_dataset.landmarks_detector import LandmarksDetector
import multiprocessing

LANDMARKS_MODEL_URL = 'http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2'
RAW_IMAGES_DIR = 'raw'
ALIGNED_IMAGES_DIR = 'aligned'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
img_size = 512

app = Flask(__name__)

def unpack_bz2(src_path):
    data = bz2.BZ2File(src_path).read()
    dst_path = src_path[:-4]
    with open(dst_path, 'wb') as fp:
        fp.write(data)
    return dst_path

def align_images(img_name, out_path):
    landmarks_model_path = unpack_bz2(get_file('shape_predictor_68_face_landmarks.dat.bz2', LANDMARKS_MODEL_URL, cache_subdir='cache'))
    landmarks_detector = LandmarksDetector(landmarks_model_path)
    print('Aligning %s ...' % img_name)
    try:
        print('Getting landmarks...')
        relative_path = os.path.realpath(img_name)
        print("relative path: " + relative_path)
        landmarks = [i for i in landmarks_detector.get_landmarks(relative_path)]
        print(landmarks)
        for i, face_landmarks in enumerate(landmarks_detector.get_landmarks(img_name), start=1):
            print("me")
            try:
                print('Starting face alignment...')
                print("the: ")
                print(face_landmarks)
                print(img_name)
                file_name = os.path.split(img_name)[0]
                out_path = os.path.realpath(out_path)
                aligned_face_path = os.path.join(out_path, file_name)
                print("juice")
                print(aligned_face_path)
                image_align(img_name, aligned_face_path, face_landmarks, output_size=512, x_scale=1, y_scale=1, em_scale=0.1, alpha=False)
                print('Wrote result %s' % aligned_face_path)
            except:
                print("Exception in face alignment!")
    except:
        print("Exception in landmark detection!")

def optimize_latents(pm, gm, file, iterations, lr):
    # Optimize (only) dlatents by minimizing perceptual loss between reference and generated images in feature space

    pm.set_reference_images([file])
    op = pm.optimize(gm.dlatent_variable, iterations, learning_rate=lr)
    for i, loss in enumerate(op):
        print(f'({i})loss: {loss}')

    # Generate images from found dlatents and save them
    generated_images = gm.generate_images()
    generated_dlatents = gm.get_dlatents()

    img = PIL.Image.fromarray(generated_images[0], 'RGB')
    latent = generated_dlatents[0]

    gm.reset_dlatents()

    return img, latent

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/encode', methods=['POST', 'GET'])
def encode_image():
    if request.method == 'POST':
        # check if the post request has the file part
        if not request.files:
            return 'no file found'
        file = request.files['file']
        # if user does not select file, browser also
        # submit an empty part without filename
        if file.filename == '':
            flash('No selected file')
            return redirect(request.url)
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join('testo', filename)
            file.save(file_path)

            url = 'https://drive.google.com/uc?id=1MEGjdvVpUsu1jB4zrXZN7Y4kBBOzizDQ' # karras2019stylegan-ffhq-1024x1024.pkl
            tflib.init_tf()
            with dnnlib.util.open_url(url, cache_dir='cache') as f:
                _G, _D, Gs = pickle.load(f)

            generator = Generator(Gs, 1)
            perceptual_model = PerceptualModel(img_size)

            perceptual_model.build_perceptual_model(generator.generated_image)
            img, latent = optimize_latents(perceptual_model, generator, file_path, 5, 0.01)
            fname = str(uuid.uuid1())
            align_images(file_path, 'aligned')
            np.save(fname, latent)
            return {"latent": latent.tolist()}
            return 'hell no!'
    return '''
    <!doctype html>
    <title>Upload new File</title>
    <h1>Upload new File</h1>
    <form method=post enctype=multipart/form-data>
      <input type=file name=file>
      <input type=submit value=Upload>
    </form>
    '''

if __name__ == '__main__':
    app.run()
