FROM tensorflow/tensorflow:1.14.0-gpu-py3

RUN apt-get update && apt-get -y install cmake protobuf-compiler wget
RUN apt-get install -y libsm6 libxext6 libxrender-dev libgl1-mesa-glx
RUN pip install --upgrade pip
RUN apt update
COPY . .
RUN pip install -r requirements.txt
RUN mkdir -p /proj /proj/record /proj/img /proj/out
CMD ["python", "processor.py"]
