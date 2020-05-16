# Most of the stuff below is copied from the tensorflow docker file. I could have set that file
# as the base however it needed some modifications such as not installing tensort rt. My
# comments are marked with ***.

ARG UBUNTU_VERSION=18.04

# *** Changed cuda version here.
ARG ARCH=
ARG CUDA=9.2
FROM nvidia/cuda${ARCH:+-$ARCH}:${CUDA}-devel-ubuntu${UBUNTU_VERSION} as base
# ARCH and CUDA are specified again because the FROM directive resets ARGs
# (but their default value is retained if set previously)
ARG ARCH
ARG CUDA
ARG CUDNN=7.6.4.38-1
ARG CUDNN_MAJOR_VERSION=7
ARG LIB_DIR_PREFIX=x86_64
ARG LIBNVINFER=5.0.2-1
ARG LIBNVINFER_MAJOR_VERSION=5

# Needed for string substitution
SHELL ["/bin/bash", "-c"]
# Pick up some TF dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        cuda-command-line-tools-${CUDA/./-} \
        # There appears to be a regression in libcublas10=10.2.2.89-1 which
        # prevents cublas from initializing in TF. See
        # https://github.com/tensorflow/tensorflow/issues/9489#issuecomment-562394257
        libcublas9.1 \
        cuda-nvrtc-${CUDA/./-} \
        cuda-cufft-${CUDA/./-} \
        cuda-curand-${CUDA/./-} \
        cuda-cusolver-${CUDA/./-} \
        cuda-cusparse-${CUDA/./-} \
        curl \
        libcudnn7=${CUDNN}+cuda${CUDA} \
        libfreetype6-dev \
        libhdf5-serial-dev \
        libzmq3-dev \
        pkg-config \
        software-properties-common \
        unzip

# *** Commented out since it didnt work.
# Install TensorRT if not building for PowerPC
# RUN [[ "${ARCH}" = "ppc64le" ]] || { apt-get update && \
#         apt-get install -y --no-install-recommends libnvinfer${LIBNVINFER_MAJOR_VERSION}=${LIBNVINFER}+cuda${CUDA} \
#         libnvinfer-plugin${LIBNVINFER_MAJOR_VERSION}=${LIBNVINFER}+cuda${CUDA} \
#         && apt-get clean \
#         && rm -rf /var/lib/apt/lists/*; }
#
# For CUDA profiling, TensorFlow requires CUPTI.
ENV LD_LIBRARY_PATH /usr/local/cuda/extras/CUPTI/lib64:/usr/local/cuda/lib64:$LD_LIBRARY_PATH

# Link the libcuda stub to the location where tensorflow is searching for it and reconfigure
# dynamic linker run-time bindings
RUN ln -s /usr/local/cuda/lib64/stubs/libcuda.so /usr/local/cuda/lib64/stubs/libcuda.so.1 \
    && echo "/usr/local/cuda/lib64/stubs" > /etc/ld.so.conf.d/z-cuda-stubs.conf \
    && ldconfig

# See http://bugs.python.org/issue19846
ENV LANG C.UTF-8

# *** Changed to python 3.6 instead of 3.7.
RUN apt-get update && apt-get install -y \
   python3.6 \
   python3-pip

RUN ln -s $(which python3.6) /usr/local/bin/python

RUN python3 -m pip --no-cache-dir install --upgrade \
    pip \
    setuptools

# *** Commented out b/c tf installed via requirements.txt
# Some TF tools expect a "python" binary
#RUN ln -s $(which python3) /usr/local/bin/python

# Options:
#   tensorflow
#   tensorflow-gpu
#   tf-nightly
#   tf-nightly-gpu
# Set --build-arg TF_PACKAGE_VERSION=1.11.0rc0 to install a specific version.
# Installs the latest version by default.
# ARG TF_PACKAGE=tensorflow
# ARG TF_PACKAGE_VERSION=
# RUN python3 -m pip install --no-cache-dir ${TF_PACKAGE}${TF_PACKAGE_VERSION:+==${TF_PACKAGE_VERSION}}
#
#
# COPY bashrc /etc/bash.bashrc
# RUN chmod a+rwx /etc/bash.bashrc
# RUN /etc/bash.bashrc
#

# *** Bellow this line are spaceface specific things.
ARG DEBIAN_FRONTEND=noninteractive
RUN apt install -y python3-opencv

COPY . /
EXPOSE 80
ADD requirements.txt .
RUN pip3 install -r requirements.txt
WORKDIR "/interfacegan"
CMD ["python3", "app.py"]
