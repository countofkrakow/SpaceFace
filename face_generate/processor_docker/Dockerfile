FROM nvidia/cuda:9.2-base-ubuntu16.04

RUN apt-get update && \
        apt-get install -y software-properties-common && \
        add-apt-repository ppa:deadsnakes/ppa && \
        apt-get update -y  && \
        apt-get install -y build-essential python3.6 python3.6-dev python3-pip && \
        apt-get install -y git  && \
        # update pip
        python3.6 -m pip install pip --upgrade && \
        python3.6 -m pip install wheel

RUN apt-get install -y libsm6 libxext6 libxrender-dev

RUN pip3 install torch==1.5.0+cu92 torchvision==0.6.0+cu92 -f https://download.pytorch.org/whl/torch_stable.html
COPY . /app
WORKDIR /app
RUN pip3 install -r processor_docker/requirements.txt
WORKDIR interfacegan

CMD ["python3.6", "processor.py"]
