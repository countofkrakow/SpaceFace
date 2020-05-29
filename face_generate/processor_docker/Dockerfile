FROM tensorflow/tensorflow:1.12.3-gpu-py3

# Install python 3.6
RUN add-apt-repository ppa:deadsnakes/ppa
RUN apt-get update
RUN apt-get install python3.6 python3.6-dev -y
RUN apt-get update
RUN apt-get install -y build-essential apt-utils
RUN ln -s $(which python3.6) /usr/local/bin/python
RUN python3 -m pip --no-cache-dir install --upgrade \
    pip \
    setuptools

# install cv2
RUN apt-get update
RUN apt-get -y upgrade
RUN apt-get install build-essential
RUN apt-get install cmake git libgtk2.0-dev pkg-config libavcodec-dev libavformat-dev libswscale-dev
RUN apt-get install python-dev python-numpy libtbb2 libtbb-dev libjpeg-dev libpng-dev libtiff-dev libjasper-dev libdc1394-22-dev
RUN apt-get install libavcodec-dev libavformat-dev libswscale-dev libv4l-dev
RUN apt-get install libxvidcore-dev libx264-dev
RUN apt-get install libgtk-3-dev
RUN apt-get install libatlas-base-dev gfortran pylint
RUN apt-get install python3.6-dev

COPY . /app
WORKDIR /app

RUN pip3 install -r processor_docker/requirements.txt

WORKDIR interfacegan

CMD ["python3.6", "processor.py"]
