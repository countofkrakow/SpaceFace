FROM tensorflow/tensorflow:1.15.2-gpu-py3

RUN apt-get update && apt-get -y install cmake protobuf-compiler
RUN apt-get install -y libsm6 libxext6 libxrender-dev
COPY processor_docker/requirements.txt .
RUN pip3 install -r requirements.txt

COPY . /
USER root
RUN mkdir -p /raw
RUN mkdir -p /aligned
RUN mkdir -p /data
RUN mkdir -p /mask
RUN mkdir -p /generated
RUN mkdir -p /latent
WORKDIR "."

CMD ["python", "processor.py"]
