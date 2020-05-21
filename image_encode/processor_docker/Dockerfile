FROM tensorflow/tensorflow:1.15.2-gpu-py3

RUN apt-get update && apt-get -y install cmake protobuf-compiler wget
RUN apt-get install -y libsm6 libxext6 libxrender-dev
COPY processor_docker/requirements.txt .
RUN pip3 install -r requirements.txt

# Pre-download the models. Warning, the way its done the downloads are cached,
# so if you change model you need to clear docker build cache.
RUN wget https://build-artifacts-1.s3-us-west-2.amazonaws.com/karras2019stylegan-ffhq-1024x1024.pkl
RUN wget https://build-artifacts-1.s3-us-west-2.amazonaws.com/shape_predictor_68_face_landmarks.dat.bz2

COPY . .
USER root
RUN mkdir /raw /aligned /data /mask /generated /latent

CMD ["python", "processor.py"]
