import * as MediaLibrary from 'expo-media-library';
import * as Permissions from 'expo-permissions';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import Toast from 'react-native-tiny-toast';

export function GetImageExtension(uri) {
  let m = uri.match(/\.[A-Za-z0-9]+$/);
  if (m) {
    return m[0];
  }
  return '.jpg';
}

export async function DownloadImage(uri) {
  const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
  if (status === 'granted') {
    if (Platform.OS == 'android') {
      let fileUri = FileSystem.documentDirectory + 'tmp' + GetImageExtension(uri);
      const file = await FileSystem.downloadAsync(uri, fileUri);
      uri = file.uri;
    }
    await MediaLibrary.saveToLibraryAsync(uri);
    Toast.show('Saved', { position: Toast.position.BOTTOM });
  }
}

export function UUIDV4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
