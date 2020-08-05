FROM tensorflow/tensorflow:1.14.0-gpu-py3

RUN apt-get update && apt-get -y install cmake protobuf-compiler wget
RUN apt-get install -y libsm6 libxext6 libxrender-dev

COPY . .
RUN pip install -r requirements.txt

CMD ["python", "processor.py"]
