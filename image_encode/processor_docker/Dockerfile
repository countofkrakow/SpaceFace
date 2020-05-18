FROM tensorflow/tensorflow:1.15.2-gpu-py3


RUN apt-get update && apt-get -y install cmake protobuf-compiler
RUN apt-get install -y libsm6 libxext6 libxrender-dev
COPY processor_docker/requirements.txt .
RUN pip3 install -r requirements.txt

COPY . /
WORKDIR "."
CMD ["python3", "processor.py"]
