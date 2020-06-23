import { AsyncStorage } from 'react-native';
import Api from '../constants/Api';

const UPLOADS_KEY = 'uploads';
const MANIPULATIONS_KEY = 'uploads';

async function getStoredUploads() {
  const uploadsStr = await AsyncStorage.getItem(UPLOADS_KEY);
  if (uploadsStr) {
    return JSON.parse(uploadsStr);
  }
  return [];
}

async function checkUploadReady(upload) {
  if (upload.ready) {
    return;
  }
  const result = await fetch(Api.encode_result(upload.key));
  if (result.status == 200) {
    upload.ready = true;
  }
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
  let currentUploads = await GetUploads();
  let sameKeys = currentUploads.map((u, i) => [u, i]).filter(([u, i]) => u.key == upload.key);
  if (sameKeys.length > 0) {
    currentUploads[sameKeys[0][1]] = upload;
  } else {
    currentUploads = currentUploads.concat([upload]);
  }
  await AsyncStorage.setItem(UPLOADS_KEY, JSON.stringify(currentUploads));
  uploadLock = false;
}

async function GetAllManipulations() {
  const manipulationsStr = await AsyncStorage.getItem(MANIPULATIONS_KEY);
  if (manipulationsStr) {
    return JSON.parse(manipulationsStr);
  }
  return {};
}

export async function GetManipulations(upload) {
  const manipulations = await GetAllManipulations();
  if (upload.key in manipulations) {
    return manipulations[upload.key];
  }
  return [];
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
  await AsyncStorage.setItem(MANIPULATIONS_KEY, JSON.stringify(manipulations));
  manipulationLock = false;
}
