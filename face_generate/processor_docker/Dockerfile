FROM tensorflow/tensorflow:1.12.3-gpu-py3

ADD processor_docker/requirements.txt .
RUN pip3 install -r requirements.txt
COPY . /
WORKDIR "/interfacegan"

CMD ["python3", "processor.py"]
