// import { CameraRoll, Platform } from 'react-native';
// import RNFetchBlob from 'rn-fetch-blob';
// import CameraRoll from '@react-native-community/cameraroll';
import * as MediaLibrary from 'expo-media-library';
import * as Permissions from 'expo-permissions';
import * as FileSystem from 'expo-file-system';
import Platform from 'react-native';

function getImageExtension(uri) {
  let m = uri.match(/\.[A-Za-z]+$/);
  if (m) {
    return m[0];
  }
  return '.jpg';
}

export async function DownloadImage(uri) {
  const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
  if (status === 'granted') {
    console.log(Platform.OS);
    if (Platform.OS == 'android') {
      console.log('Downloading..');
      let fileUri = FileSystem.documentDirectory + 'tmp' + getImageExtension(uri);
      const file = await FileSystem.downloadAsync(uri, fileUri);
      uri = file.uri;
    }
    console.log(uri);
    MediaLibrary.saveToLibraryAsync(uri);
  }

  // CameraRoll.save(uri);
  // if (Platform.OS == 'android') {
  //   RNFetchBlob.config({
  //     fileCache: true,
  //     appendExt: 'png',
  //     indicator: true,
  //     IOSBackgroundTask: true,
  //     path: path,
  //     addAndroidDownloads: {
  //       useDownloadManager: true,
  //       notification: true,
  //       path: path,
  //       description: 'Image',
  //     },
  //   })
  //     .fetch('GET', uri)
  //     .then((res) => {
  //       console.log(res, 'end downloaded');
  //     });
  // } else {
  //   CameraRoll.saveToCameraRoll(uri);
  // }
}
