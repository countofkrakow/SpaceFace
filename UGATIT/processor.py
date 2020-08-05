from UGATIT import UGATIT
import os
import tensorflow as tf

images_bucket = 'spaceface-images'

args = {
    "phase": "train",
    "checkpoint_dir": 0,
    "result_dir": 0,
    "log_dir": 0,
    "dataset": 0,
    "augment_flag": 0,
    "epoch": 0,
    "iteration": 0,
    "decay_flag": 0,
    "decay_epoch": 0,
    "gan_type": 0,
    "batch_size": 0,
    "print_freq": 0,
    "save_freq": 0,
    "lr": 0,
    "ch": 0,
    "adv_weight": 0,
    "cycle_weight": 0,
    "identity_weight": 0,
    "cam_weight": 0,
    "GP_ld": 0,
    "smoothing": 0,
    "n_res": 0,
    "n_dis": 0,
    "n_critic": 0,
    "sn": 0,
    "img_size": 0,
    "img_ch": 0,
    "sample_dir": 0,
    "model_dir": 0

}

def main():
    img_id = os.environ['id']
    result_id = os.environ['result']

    with tf.Session(config=tf.ConfigProto(allow_soft_placement=True)) as sess:
        gan = UGATIT(sess, args)
        gan.build_model()
        gan.test_endpoint_init()
        image = download_image(images_bucket, img_id)
        crop_img = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        crop_img = cv2.resize(crop_img, dsize=(256, 256))
        anime_img = gan.test_endpoint(crop_img)
        image_url = upload_image(anime_img, result_id)
    print(f'input id: {img_id}')
    print(f'result id: {result_id}')

if __name__ == '__main__':
    main()
