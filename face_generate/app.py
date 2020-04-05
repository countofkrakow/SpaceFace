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


@app.route('/encode', methods=['POST'])
def encode_image():


if __name__ == '__main__':
    app.run()
