import os
import pickle
import numpy as np
import cv2
import tensorflow as tf
import PIL.Image
from PIL import ImageFilter
from encoder.generator_model import Generator
from encoder.perceptual_model import PerceptualModel, load_images
import dnnlib
import dnnlib.tflib as tflib
import uuid
from tqdm import tqdm
from flask import Flask, flash, request, redirect, url_for
import sys
import bz2
import boto3
from keras.utils import get_file
from keras.models import load_model
from ffhq_dataset.face_alignment import image_align
from ffhq_dataset.landmarks_detector import LandmarksDetector

LANDMARKS_MODEL_URL = 'http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2'
MODEL_URL = 'https://drive.google.com/uc?id=1MEGjdvVpUsu1jB4zrXZN7Y4kBBOzizDQ'
RAW_IMAGES_DIR = 'raw'
ALIGNED_IMAGES_DIR = 'aligned'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}


app = Flask(__name__)

args = {
    'bucket_name': 'latents',
    'data_dir': 'data',
    'mask_dir': 'mask',
    'generated_images_dir': 'generated',
    'latent_dir': 'latent',
    'video_dir': 'video',
    'load_last': '',
    'dlatent_avg': '',
    'model_url': 'https://drive.google.com/uc?id=1MEGjdvVpUsu1jB4zrXZN7Y4kBBOzizDQ',
    'model_res': 1024,
    'batch_size': 1,
    'optimizer': 'adam',
    'image_size': 256,
    'resnet_image_size': 256,
    'lr': 0.02,
    'decay_rate': 0.95,
    'iterations': 1000,
    'decay_steps': 6,
    'early_stopping': True,
    'early_stopping_threshold': 0.03,
    'early_stopping_patience': 10,
    'load_effnet': 'data/finetuned_effnet.h5',
    'load_resnet': 'data/finetuned_resnet.h5',
    'use_preprocess_input': True,
    'use_best_loss': True,
    'average_best_loss': 0.5,
    'sharpen_input': True,
    'use_vgg_loss': 0.4,
    'use_vgg_layer': 9,
    'use_pixel_loss': 1.5,
    'use_mssim_loss': 200,
    'use_lpips_loss': 0,
    'use_l1_penalty': 0.3,
    'use_discriminator_loss': 0,
    'use_adaptive_loss': False,
    'randomize_noise': True,
    'tile_dlatents': False,
    'clipping_threshold': 2.0,
    'load_mask': False,
    'face_mask': True,
    'use_grabcut': True,
    'scale_mask': 1.4,
    'composite_mask': True,
    'composite_blur': 8,
    'video_dir': 'video',
    'output_video': False,
    'video_codec': 'MJPG',
    'video_frame_rate': 24,
    'video_size': 512,
    'video_skip': 1,
    'cache_dir': 'cache'
}

def unpack_bz2(src_path):
    data = bz2.BZ2File(src_path).read()
    dst_path = src_path[:-4]
    with open(dst_path, 'wb') as fp:
        fp.write(data)
    return dst_path

def align_images(img_name, out_path):
    landmarks_model_path = unpack_bz2(get_file('shape_predictor_68_face_landmarks.dat.bz2', LANDMARKS_MODEL_URL, cache_subdir=args['cache_dir']))
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
                file_name = os.path.basename(img_name)
                out_path = os.path.realpath(out_path)
                aligned_face_path = os.path.join(out_path, file_name)
                print(file_name)
                print("juice")
                print(aligned_face_path)
                image_align(img_name, aligned_face_path, face_landmarks, output_size=args['model_res'], x_scale=1, y_scale=1, em_scale=0.1, alpha=False)
                print('Wrote result %s' % aligned_face_path)
            except:
                print("Exception in face alignment!")
        return aligned_face_path
    except:
        print("Exception in landmark detection!")

def optimize_latents(file):
    print("file: "+file)
    os.makedirs(args['data_dir'], exist_ok=True)
    os.makedirs(args['mask_dir'], exist_ok=True)
    os.makedirs(args['generated_images_dir'], exist_ok=True)
    os.makedirs(args['latent_dir'], exist_ok=True)
    os.makedirs(args['video_dir'], exist_ok=True)

    # Initialize generator and perceptual model
    tflib.init_tf()
    with dnnlib.util.open_url(args['model_url'], cache_dir=args['cache_dir']) as f:
        generator_network, discriminator_network, Gs_network = pickle.load(f)

    generator = Generator(Gs_network, args['batch_size'], clipping_threshold=args['clipping_threshold'], tiled_dlatent=args['tile_dlatents'], model_res=args['model_res'], randomize_noise=args['randomize_noise'])

    perceptual_model = PerceptualModel(args, perc_model=None, batch_size=args['batch_size'])
    perceptual_model.build_perceptual_model(generator, discriminator_network)

    ff_model = None

    name = os.path.basename(file)
    if args['output_video']:
        video_out = cv2.VideoWriter(os.path.join(args['video_dir'], f'{name}.avi'),cv2.VideoWriter_fourcc(*args['video_codec']), args['video_frame_rate'], (args['video_size'],args['video_size']))

    images_batch = [file]
    names = [os.path.splitext(os.path.basename(x))[0] for x in images_batch]
    print(images_batch)
    perceptual_model.set_reference_images(images_batch)

    dlatents = None
    if (args['load_last'] != ''): # load previous dlatents for initialization
        dl = np.expand_dims(np.load(os.path.join(args['load_last'], f'{name}.npy')),axis=0)
        if (dlatents is None):
            dlatents = dl
        else:
            dlatents = np.vstack((dlatents,dl))
    else:
        if (ff_model is None):
            if os.path.exists(args['load_resnet']):
                from keras.applications.resnet50 import preprocess_input
                print("Loading ResNet Model:")
                ff_model = load_model(args['load_resnet'])

        if (ff_model is not None): # predict initial dlatents with ResNet model
            if (args['use_preprocess_input']):
                dlatents = ff_model.predict(preprocess_input(load_images(images_batch,image_size=args['resnet_image_size'])))
            else:
                dlatents = ff_model.predict(load_images(images_batch,image_size=args['resnet_image_size']))
    if dlatents is not None:
        generator.set_dlatents(dlatents)
    op = perceptual_model.optimize(generator.dlatent_variable, iterations=args['iterations'], use_optimizer=args['optimizer'])
    pbar = tqdm(op, leave=False, total=args['iterations'])
    vid_count = 0
    best_loss = None
    best_dlatent = None
    avg_loss_count = 0
    if args['early_stopping']:
        avg_loss = prev_loss = None
    for loss_dict in pbar:
        if args['early_stopping']: # early stopping feature
            if prev_loss is not None:
                if avg_loss is not None:
                    avg_loss = 0.5 * avg_loss + (prev_loss - loss_dict["loss"])
                    if avg_loss < args['early_stopping_threshold']: # count while under threshold; else reset
                        avg_loss_count += 1
                    else:
                        avg_loss_count = 0
                    if avg_loss_count > args['early_stopping_patience']: # stop once threshold is reached
                        print("")
                        break
                else:
                    avg_loss = prev_loss - loss_dict["loss"]
        pbar.set_description(" ".join(images_batch) + ": " + "; ".join(["{} {:.4f}".format(k, v) for k, v in loss_dict.items()]))
        if best_loss is None or loss_dict["loss"] < best_loss:
            if best_dlatent is None or args['average_best_loss'] <= 0.00000001:
                best_dlatent = generator.get_dlatents()
            else:
                best_dlatent = 0.25 * best_dlatent + 0.75 * generator.get_dlatents()
            if args['use_best_loss']:
                generator.set_dlatents(best_dlatent)
            best_loss = loss_dict["loss"]
        if args['output_video'] and (vid_count % args['video_skip'] == 0):
          batch_frames = generator.generate_images()
          for i, name in enumerate(names):
            video_frame = PIL.Image.fromarray(batch_frames[i], 'RGB').resize((args['video_size'],args['video_size']),PIL.Image.LANCZOS)
            video_out.write(cv2.cvtColor(np.array(video_frame).astype('uint8'), cv2.COLOR_RGB2BGR))
        generator.stochastic_clip_dlatents()
        prev_loss = loss_dict["loss"]
    if not args['use_best_loss']:
        best_loss = prev_loss
    print(" ".join(names), " Loss {:.4f}".format(best_loss))

    if args['output_video']:
        video_out.release()

    # Generate images from found dlatents and save them
    if args['use_best_loss']:
        generator.set_dlatents(best_dlatent)
    generated_images = generator.generate_images()
    generated_dlatents = generator.get_dlatents()

    for img_array, dlatent, img_path, img_name in zip(generated_images, generated_dlatents, images_batch, names):
        mask_img = None
        if args['composite_mask'] and (args['load_mask'] or args['face_mask']):
            _, im_name = os.path.split(img_path)
            mask_img = os.path.join(args['mask_dir'], f'{im_name}')
        if args['composite_mask'] and mask_img is not None and os.path.isfile(mask_img):
            orig_img = PIL.Image.open(img_path).convert('RGB')
            width, height = orig_img.size
            imask = PIL.Image.open(mask_img).convert('L').resize((width, height))
            imask = imask.filter(ImageFilter.GaussianBlur(args['composite_blur']))
            mask = np.array(imask)/255
            mask = np.expand_dims(mask,axis=-1)
            print(mask)
            print(img_array)
            print(orig_img)
            img_array = mask*np.array(img_array) + (1.0-mask)*np.array(orig_img)
            img_array = img_array.astype(np.uint8)
            #img_array = np.where(mask, np.array(img_array), orig_img)
        img = PIL.Image.fromarray(img_array, 'RGB')
        img.save(os.path.join(args['generated_images_dir'], f'{img_name}.png'), 'PNG')
        np.save(os.path.join(args['latent_dir'], f'{img_name}.npy'), dlatent)
    generator.reset_dlatents()

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
            filename = str(uuid.uuid1())
            file_path = os.path.join(os.path.realpath('raw'), filename)
            file.save(file_path)

            aligned_path = align_images(file_path, ALIGNED_IMAGES_DIR)
            print(aligned_path is None)
            optimize_latents(aligned_path)

            # drop latents to s3
            s3 = boto3.client('s3')
            latent_fname = f'{filename}.npy'
            s3.upload_file(f'latent/{latent_fname}', args['bucket_name'], latent_fname)

            return filename
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
    app.run(port=80, host='0.0.0.0')
