# This script assumes a container has been started. You can start it with
# docker run --runtime=nvidia -it fom /bin/bash
# in another terminal.

get_container_id() {
  sudo docker container ls | grep fom | grep -Po '^[^ ]+'
}

run_processor() {
  CONTAINER_ID=$(get_container_id)
  if [ -z "$CONTAINER_ID" ]; then
    echo "No container started."
    exit 1
  fi
  sudo docker cp processor.py $CONTAINER_ID:/app/processor.py
  sudo docker exec \
    --env VIDEO_FILE=j22.mp4 \
    --env IMAGE_FILE=trump.jpg \
    --env RESULT_FILE=result.mp4 \
    --env INPUT_BUCKET=fom-input \
    --env OUTPUT_BUCKET=fom-output \
    --env FRAME_BATCH_SIZE=200 \
    --env AWS_ACCESS_KEY_ID=aaa \
    --env AWS_SECRET_ACCESS_KEY=aaa \
    --env AWS_DEFAULT_REGION=us-west-2 \
    --env LOCAL_RUN=true $CONTAINER_ID \
    python3 processor.py
  sudo docker cp $CONTAINER_ID:/app/temp_output.mp4 ~/result.mp4
}

start_container() {
  CONTAINER_ID=$(get_container_id)
  if [ ! -z "$CONTAINER_ID" ]; then
    sudo docker kill $CONTAINER_ID
  fi
  sudo docker build -t fom .
  sudo docker run --runtime=nvidia -d -it fom /bin/bash
}

stop_container() {
  CONTAINER_ID=$(get_container_id)
  if [ ! -z "$CONTAINER_ID" ]; then
    sudo docker kill $CONTAINER_ID
  fi
}

if [ "$1" == "start" ]; then
  echo "Starting container..."
  start_container
elif [ "$1" == "stop" ]; then
  echo "Stopping container..."
  stop_container
elif [ "$1" == "run" ]; then
  run_processor
else
  echo \
"Run the code locally in docker. This command starts a background container and
keeps it active. You can update the local code an run the run command and your
updated code will be executed in the docker container.

Usage:
  ./run-in-docker.sh start    -  starts a container
  ./run-in-docker.sh stop     -  stops the container
  ./run-in-docker.sh run      -  runs processor in the started container. Copies
                                 output video to ~/result.mp4.
"
fi
