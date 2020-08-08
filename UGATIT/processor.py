from main import get_parser, show_all_variables
import tensorflow as tf
from UGATIT import UGATIT
from PIL import Image
from utils import upload_image, download_image
from IPython.display import Image
import os
_ = tf.contrib

images_bucket = 'spaceface-images'

def main():
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
        download_image(images_bucket, img_id)

        img  = gan.infer(img_id)

        image_url = upload_image(img, result_id)

if __name__ == '__main__':
    main()
