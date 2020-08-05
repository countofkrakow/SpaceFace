from UGATIT import UGATIT
import os

images_bucket = 'spaceface-images'

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
