from main import get_parser, show_all_variables
import tensorflow as tf
from UGATIT import UGATIT
from PIL import Image
from utils import upload_image, download_image
from IPython.display import Image
import os
import glob

# Stylegan2 dependencies
import dnnlib
import dnnlib.tflib as tflib
import requests
import projector
import run_projector
import pickle
import training
from training import dataset
from training import misc
import dataset_tool

images_bucket = 'spaceface-images'
img_path = "/proj/img/"
record_path = "/proj/record/"
#stylegan_model_pkl = "anime_stylegan_model.pkl"
stylegan_model_pkl = 'FFHQ512-CartoonsAlignedHQ31v3.pkl'

del_record = os.path.join(record_path, '-r10.tfrecords')

def project_real_images(dataset_name, data_dir, num_images, num_snapshots, model_pkl, steps=1000):

    stream = open(model_pkl, 'rb')

    tflib.init_tf()
    with stream:
        G, D, Gs = pickle.load(stream, encoding='latin1')

    proj = projector.Projector()
    proj.set_network(Gs)
    proj.num_steps = steps

    print('Loading images from "%s"...' % dataset_name)
    dataset_obj = training.dataset.load_dataset(data_dir=data_dir, tfrecord_dir=dataset_name, max_label_size=0, verbose=True, repeat=False, shuffle_mb=0)
    print(dataset_obj.shape)
    print(Gs.output_shape)
    assert dataset_obj.shape == Gs.output_shape[1:]

    for image_idx in range(num_images):
        print('Projecting image %d/%d ...' % (image_idx, num_images))
        images, _labels = dataset_obj.get_minibatch_np(1)
        images = training.misc.adjust_dynamic_range(images, [0, 255], [-1, 1])
        run_projector.project_image(proj, targets=images, png_prefix=dnnlib.make_run_dir_path(f'{img_path}image%04d-' % image_idx), num_snapshots=num_snapshots)

def selfie2anime():
    img_id = os.environ['id']
    result_id = os.environ['result']
    

    parser = get_parser()
    args = parser.parse_args("--phase test".split())

    with tf.Session(config=tf.ConfigProto(allow_soft_placement=True)) as sess:
        #sess.reuse_variables()
        gan = UGATIT(sess, args)

        # build graph
        gan.build_model()

        # download target img
        download_path = os.path.join(img_path, img_id)

        download_image(images_bucket, img_id, dest=download_path)
        dataset_tool.create_from_images(record_path, img_path, True)
        # os.remove(del_record)
        
        img = gan.infer(download_path)

        image_url = upload_image(img, result_id)

    return download_path, img

if __name__ == '__main__':
    num_steps = 1000
    if 'steps' in os.environ:
        num_steps = int(os.environ['steps'])

    input_img, s2a_img = selfie2anime()
    project_real_images("record","/proj",1,10, stylegan_model_pkl, num_steps)

    result_fname = f'image0000-step{num_steps}.png'

    for x in os.listdir('/proj/img'):
        fname = os.path.basename(x)
        image_url = upload_image(f'/proj/img/{x}', "animeresult", fname)
        print(fname)

    image_url = upload_image(f'/proj/img/{result_fname}', "animeresult", 'result.png')
    