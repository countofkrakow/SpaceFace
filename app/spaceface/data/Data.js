import { AsyncStorage } from 'react-native';
import Api from '../constants/Api';

const UPLOADS_KEY = 'uploads';
const MANIPULATIONS_KEY = 'manipulations';

// Video states.
export const UPLOADING = 'uploading';
export const FAILED_UPLOAD = 'failed upload';
export const UPLOADED = 'uploaded';
export const PROCESSING = 'processing';
export const PROCESSING_FAILED = 'processing failed';
export const PROCESSING_ERROR = 'processing error';
export const COMPLETE = 'complete';

async function getStoredUploads() {
  // AsyncStorage.setItem(UPLOADS_KEY, '[]');
  const uploadsStr = await AsyncStorage.getItem(UPLOADS_KEY);
  if (uploadsStr) {
    return JSON.parse(uploadsStr);
  }
  return [];
}

export async function GetStoredThumbnails() {
  return (await getStoredUploads()).map((upload) => upload.ogThumbnail);
}

async function checkUploadReady(upload) {
  let hasUpdates = false;
  if (upload.state != PROCESSING) {
    return hasUpdates;
  }
  const result = await fetch(Api.fom_video_status(upload.key));
  console.log(result.status);
  if (result.status == 200) {
    const status = await result.text();
    console.log(status);
    if (status == 'success') {
      upload.state = COMPLETE;
    } else {
      upload.state = PROCESSING_FAILED;
      upload.error = status;
    }
    hasUpdates = true;
    StoreUpload(upload);
  }
  return hasUpdates;
}

// The point of this is for the background task to know we can send a push notification to the user.
// The UI will then get the actual uploads again.
export async function NewUploadsReady() {
  const uploads = await getStoredUploads();
  let updates = await Promise.all(uploads.map(checkUploadReady));
  const hasReadyUpdates = updates.some((hasUpdates) => hasUpdates);
  const newUpdatesExpected = uploads.some((upload) =>
    [PROCESSING, UPLOADING].includes(upload.state)
  );
  return { hasReadyUpdates, newUpdatesExpected };
}

export async function GetUploads() {
  const uploads = await getStoredUploads();
  await Promise.all(uploads.map(checkUploadReady));
  return uploads;
}

let uploadLock = false;
export async function StoreUpload(upload) {
  if (uploadLock) {
    setTimeout(() => StoreUpload(upload), 5);
    return;
  }
  uploadLock = true;
  try {
    let currentUploads = await getStoredUploads();
    let sameKeys = currentUploads.map((u, i) => [u, i]).filter(([u, i]) => u.key == upload.key);
    if (sameKeys.length > 0) {
      currentUploads[sameKeys[0][1]] = upload;
    } else {
      currentUploads = currentUploads.concat([upload]);
    }
    await AsyncStorage.setItem(UPLOADS_KEY, JSON.stringify(currentUploads));
  } finally {
    uploadLock = false;
  }
}

export async function DeleteUpload(upload) {
  if (uploadLock) {
    setTimeout(() => DeleteUpload(upload), 5);
    return;
  }
  uploadLock = true;
  try {
    let currentUploads = await getStoredUploads();
    currentUploads = currentUploads.filter((otherUpload) => otherUpload.key != upload.key);
    await AsyncStorage.setItem(UPLOADS_KEY, JSON.stringify(currentUploads));
  } finally {
    uploadLock = false;
  }
}

async function GetAllManipulations() {
  const manipulationsStr = await AsyncStorage.getItem(MANIPULATIONS_KEY);
  if (manipulationsStr) {
    return JSON.parse(manipulationsStr);
  }
  return {};
}

async function GetStoredManipulations(upload) {
  const manipulations = await GetAllManipulations();
  if (upload.key in manipulations) {
    return manipulations[upload.key];
  }
  return [];
}

export async function GetManipulations(upload) {
  // AsyncStorage.setItem(MANIPULATIONS_KEY, JSON.stringify({}));
  const storedManipulations = await GetStoredManipulations(upload);
  await Promise.all(
    storedManipulations.map(async (manipulation) => {
      if (manipulation.ready) {
        return;
      }
      const result = await fetch(Api.manipulate_result(manipulation.key));
      if (result.status == 200) {
        manipulation.ready = true;
      }
    })
  );
  return storedManipulations;
}

let manipulationLock = false;
export async function StoreManipulation(upload, manipulation) {
  if (manipulationLock) {
    setTimeout(() => StoreManipulation(upload, manipulation), 5);
    return;
  }
  manipulationLock = true;
  let manipulations = await GetAllManipulations();
  if (!(upload.key in manipulations)) {
    manipulations[upload.key] = [];
  }
  manipulations[upload.key] = manipulations[upload.key].concat([manipulation]);
  // console.log(manipulations);
  await AsyncStorage.setItem(MANIPULATIONS_KEY, JSON.stringify(manipulations));
  manipulationLock = false;
}
