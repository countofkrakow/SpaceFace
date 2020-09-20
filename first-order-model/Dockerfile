FROM nvcr.io/nvidia/cuda:10.0-cudnn7-runtime-ubuntu18.04

RUN DEBIAN_FRONTEND=noninteractive apt-get -qq update \
  && DEBIAN_FRONTEND=noninteractive apt-get -qqy install python3-pip ffmpeg git less nano libsm6 libxext6 libxrender-dev \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip3 install \
  --upgrade setuptools \
  https://download.pytorch.org/whl/cu100/torch-1.0.0-cp36-cp36m-linux_x86_64.whl \
  -r requirements.txt

RUN chmod 777 /tmp
RUN apt-get update
RUN apt-get install -y curl
RUN mkdir /app
RUN curl -o /app/vox-adv-cpk.pth.tar https://spaceface-build-inputs.s3-us-west-2.amazonaws.com/first_order_model/vox-adv-cpk.pth.tar

COPY faced /app/faced
WORKDIR /app/faced
RUN python3 setup.py install

COPY . /app
WORKDIR /app

CMD ["python3", "processor.py"]
