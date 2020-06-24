args = {
    'bucket_name': 'latents',
    'data_dir': 'data',
    'mask_dir': 'mask',
    'generated_images_dir': 'generated',
    'latent_dir': 'latent',
    'video_dir': 'video',
    'load_last': '',
    'dlatent_avg': '',
    'model_dir': 'cache/karras2019stylegan-ffhq-1024x1024.pkl',
    'model_res': 1024,
    'batch_size': 6,
    'optimizer': 'adam',
    'image_size': 256,
    'resnet_image_size': 256,
    'lr': 0.02,
    'decay_rate': 0.95,
    'iterations': 100,
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
    'load_mask': True,
    'face_mask': True,
    'use_grabcut': True,
    'scale_mask': 1.4,
    'composite_mask': True,
    'composite_blur': 8,
    'output_video': False,
    'video_codec': 'MJPG',
    'video_frame_rate': 24,
    'video_size': 512,
    'video_skip': 1,
    'cache_dir': 'cache'
}

import os
import pickle
import numpy as np
import cv2
import tensorflow as tf
from PIL import ImageFilter, Image
from encoder.generator_model import Generator
from encoder.perceptual_model import PerceptualModel, load_images
import dnnlib
import dnnlib.tflib as tfl
import uuid
from tqdm import tqdm
import sys
import bz2
import boto3
from keras.utils import get_file
from keras.models import load_model
from ffhq_dataset.face_alignment import image_align
from ffhq_dataset.landmarks_detector import LandmarksDetector
from io import BytesIO
from requests_toolbelt.multipart import decoder
import base64
from keras.applications.resnet50 import preprocess_input
import json

LANDMARKS_MODEL_URL = 'https://build-artifacts-1.s3-us-west-2.amazonaws.com/shape_predictor_68_face_landmarks.dat.bz2'
RAW_IMAGES_DIR = 'raw'
ALIGNED_IMAGES_DIR = 'aligned'
LATENT_BUCKET = 'latents'
IMAGES_BUCKET = 'spaceface-images'
GENERATED_BUCKET = 'spaceface-generated'
QUEUE_URL = 'https://sqs.us-west-2.amazonaws.com/454494063118/encoderQ'
NUM_BATCHES = 10


def unpack_bz2(src_path):
    data = bz2.BZ2File(src_path).read()
    dst_path = src_path[:-4]
    with open(dst_path, 'wb') as fp:
        fp.write(data)
    return dst_path

def align_images(img_name, landmarks_detector):
    print('Aligning %s ...' % img_name)
    try:
        aligned_face_path = None
        print('Getting landmarks...')
        raw_img_path = os.path.join(RAW_IMAGES_DIR, img_name)
        fn = face_img_name = '%s_%02d.png' % (os.path.splitext(img_name)[0], 1)
        if os.path.isfile(fn):
            return None
        print(f'raw_img_path: {raw_img_path}')
        landmarks = list(landmarks_detector.get_landmarks(raw_img_path))
        if len(landmarks) == 0:
            print("No landmarks detected..... \nExiting.....")
            return None
        for i, face_landmarks in enumerate(landmarks, start=1):
            print("me")
            try:
                face_img_name = '%s_%02d.png' % (os.path.splitext(img_name)[0], i)
                aligned_face_path = os.path.join(ALIGNED_IMAGES_DIR, face_img_name)
                image_align(raw_img_path, aligned_face_path, face_landmarks, output_size=args['model_res'], x_scale=1, y_scale=1, em_scale=0.1, alpha=False)
                print('Wrote result %s' % aligned_face_path)
            except:
                print("Exception in face alignment!")
        print(f'aligned_face_path: {os.listdir(ALIGNED_IMAGES_DIR)}')
        print(f'raw_face_path: {os.listdir(RAW_IMAGES_DIR)}')
        return aligned_face_path
    except Exception as inst:
        print(type(inst))    # the exception instance
        print(inst.args)     # arguments stored in .args
        print(inst)
        print("Exception in landmark detection!")

def optimize_latents(images_batch, latent_paths, ff_model, generator, perceptual_model, s3):
    if args['output_video']:
        pass
        # TODO add video
        # video_out = cv2.VideoWriter(os.path.join(args['video_dir'], f'{name}.avi'),cv2.VideoWriter_fourcc(*args['video_codec']), args['video_frame_rate'], (args['video_size'],args['video_size']))

    names = [os.path.splitext(os.path.basename(x))[0] for x in images_batch]
    print(images_batch)
    perceptual_model.set_reference_images(images_batch)

    dlatents = None

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
        generator.stochastic_clip_dlatents()
        prev_loss = loss_dict["loss"]
    if not args['use_best_loss']:
        best_loss = prev_loss
    print(" ".join(names), " Loss {:.4f}".format(best_loss))

    # Generate images from found dlatents and save them
    if args['use_best_loss']:
        generator.set_dlatents(best_dlatent)
    generated_images = generator.generate_images()
    generated_dlatents = generator.get_dlatents()

    for img_array, dlatent, img_path, img_name, latent_path in zip(generated_images, generated_dlatents, images_batch, names, latent_paths):
        mask_img = None
        if args['composite_mask'] and (args['load_mask'] or args['face_mask']):
            _, im_name = os.path.split(img_path)
            mask_img = os.path.join(args['mask_dir'], f'{im_name}')
        if args['composite_mask'] and mask_img is not None and os.path.isfile(mask_img):
            orig_img = Image.open(img_path).convert('RGB')
            width, height = orig_img.size
            imask = Image.open(mask_img).convert('L').resize((width, height))
            imask = imask.filter(ImageFilter.GaussianBlur(args['composite_blur']))
            mask = np.array(imask)/255
            mask = np.expand_dims(mask,axis=-1)
            print(mask)
            print(img_array)
            print(orig_img)
            img_array = mask*np.array(img_array) + (1.0-mask)*np.array(orig_img)
            img_array = img_array.astype(np.uint8)
            img_array = np.where(mask, np.array(img_array), orig_img)
        img = Image.fromarray(img_array, 'RGB')

        # TODO upload generated img
        img_fname = f'{img_name[:-3]}.png'
        imname = os.path.join(args['generated_images_dir'], img_fname)
        img.save(imname, 'PNG')
        s3.upload_file(imname, GENERATED_BUCKET, img_fname)
        np.save(latent_path, dlatent)
    generator.reset_dlatents()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_image_batch(bs, sqs, s3):
    img_fnames = []
    latent_fnames = []
    handles = []
    queue_empty = False
    for i in range(bs):
        response = sqs.receive_message(
            QueueUrl=QUEUE_URL,
            WaitTimeSeconds=10
        )
        if 'Messages' not in response:
            queue_empty = True
            break
        message = response['Messages'][0]
        handle = message['ReceiptHandle']
        body = json.loads(message['Body'])
        fileId = body['filename']
        file_path = os.path.join(RAW_IMAGES_DIR, fileId)
        print(f'file path: {file_path}')

        # download image itself
        s3.download_file(IMAGES_BUCKET, fileId, file_path)
        img = Image.open(file_path)
        latent_fname = f'{os.path.splitext(fileId)[0]}.npy'
        latent_fnames.append(latent_fname)
        img_fnames.append(file_path)
        handles.append(handle)

    return img_fnames, handles, latent_fnames, queue_empty

def init_dependencies():
    tfl.init_tf()
    landmarks_model_path = unpack_bz2(get_file('shape_predictor_68_face_landmarks.dat.bz2', LANDMARKS_MODEL_URL, cache_subdir='cache'))
    landmarks_detector = LandmarksDetector(landmarks_model_path)
    if os.path.exists(args['load_resnet']):
        print("Loading ResNet Model:")
        ff_model = load_model(args['load_resnet'])


    with open(args['model_dir'], 'rb') as f:
        generator_network, discriminator_network, Gs_network = pickle.load(f)

    generator = Generator(Gs_network, args['batch_size'], clipping_threshold=args['clipping_threshold'], tiled_dlatent=args['tile_dlatents'], model_res=args['model_res'], randomize_noise=args['randomize_noise'])

    perceptual_model = PerceptualModel(args, perc_model=None, batch_size=args['batch_size'])
    perceptual_model.build_perceptual_model(generator, discriminator_network)
    return landmarks_detector, ff_model, generator, perceptual_model

def run():
    print("Waking from sleep")

    s3 = boto3.client('s3')
    sqs = boto3.client('sqs')

    images, handles, latents, _ = get_image_batch(args['batch_size'], sqs, s3)

    if len(images) == 0:
        print("No requests found in queue...\nExiting...")
        quit()

    landmarks_detector, ff_model, generator, perceptual_model = init_dependencies()
    queue_empty = False
    while not queue_empty:

        aligned_batch = []
        latent_batch = []
        latent_fnames = []
        latent_handles = []
        for file_path, latent_fname, handle in zip(images, latents, handles):
            print(f'latent_fname: {latent_fname}')
            head, tail = os.path.split(file_path)
            fname = tail.split('/')[-1]
            print(f'fname: {fname}')
            aligned_path = align_images(fname, landmarks_detector)
            if aligned_path is None:
                print("Deleting Faulty message from queue")
                sqs.delete_message(QueueUrl=QUEUE_URL, ReceiptHandle=handle)
                continue

            latent_path = os.path.join(args['latent_dir'], latent_fname)
            latent_fnames.append(latent_fname)
            aligned_batch.append(aligned_path)
            latent_batch.append(latent_path)
            latent_handles.append(handle)

        if len(aligned_batch) > 0:
            # images_batch, latent_paths, ff_model, generator, perceptual_model
            optimize_latents(aligned_batch, latent_batch, ff_model, generator, perceptual_model, s3)
            for latent_path, latent_fname in zip(latent_batch, latent_fnames):
                s3.upload_file(latent_path, LATENT_BUCKET, latent_fname)

        for h in handles:
            sqs.delete_message(QueueUrl=QUEUE_URL, ReceiptHandle=h)

        images, handles, latents, queue_empty = get_image_batch(args['batch_size'], sqs, s3)

if __name__ == '__main__':
    run()
