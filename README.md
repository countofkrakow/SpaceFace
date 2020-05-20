# Space Face

## Building docker images

To build an image, install docker, cd into face_generate, and run:

```bash
docker build -t spaceface_processor -f processor_docker/Dockerfile .
```

After the container is build, run this to run the container:

```bash
docker run -p 127.0.0.1:80:80/tcp --env-file=processor_docker/env.list spaceface_processor
```

SpaceFace is an app for neural face editing.
For more information, the notebooks contain the basic idea of this project.

Models used:
* InterFaceGan - for face manipulation
* StyleGan2 - for encoding latent vectors
