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
from flask import Flask, flash, request, redirect, url_for
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
img_size = 512

app = Flask(__name__)

def optimize_latents(pm, gm, file, iterations, lr):
    # Optimize (only) dlatents by minimizing perceptual loss between reference and generated images in feature space

    pm.set_reference_images([file])
    op = pm.optimize(gm.dlatent_variable, iterations, learning_rate=lr)
    for i, loss in enumerate(op):
        print(f'{i}-loss: {loss}')

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
            img, latent = optimize_latents(perceptual_model, generator, file_path, 5000, 0.01)
            return {"latent": latent.tolist()}
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
