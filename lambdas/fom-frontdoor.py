import json
import os
import boto3
from uuid import uuid1

def lambda_handler(event, context):
  video_id = event["queryStringParameters"]["id"]
  video_file = video_id
  print("Video id: " + video_id)

  s3 = boto3.resource('s3')
  try:
    s3.Object('fom-input', video_file).load()
  except Exception as e:
    print(e)
    return {
      'statusCode': 400,
      'body': 'given image or video not found'
    }

  environment = {
    'VIDEO_FILE' : video_file,
    'IMAGE_FILE' : 't3.png',
    'RESULT_FILE' : video_file + '.mp4'
  }
  job_def = os.environ['job_def']
  job_queue_arn = os.environ['queue_arn']

  batch = boto3.client('batch')

  r = batch.submit_job(
    jobName=video_id,
    jobQueue=job_queue_arn,
    jobDefinition=job_def,
    containerOverrides=
    {
      'environment': [{'name':k, 'value':v} for (k, v) in environment.items()]
    }
  )
  print(r)

  return {
    'statusCode': 200,
    'body': "Request sent, now you wait."
  }
