# Space Face

## Building docker images

To build an image, install docker, cd into face_generate, and run:

```bash
docker build -t spaceface .
```

After the container is build, run this to run the container:

```bash
docker run --name sf spaceface
```

SpaceFace is an app for neural face editing.
For more information, the notebooks contain the basic idea of this project.

Models used:
* InterFaceGan - for face manipulation
* StyleGan2 - for encoding latent vectors
