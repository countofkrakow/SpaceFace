import * as React from 'react';
import { Image, View } from 'react-native';
import Colors from '../constants/Colors';

export function LoadingImage() {
  return (
    <Image
      style={{
        width: 50,
        height: 50,
      }}
      source={require('../assets/images/loading.gif')}
    />
  );
}
export function UploadingImage() {
  return (
    <Image
      style={{
        width: 50,
        height: 50,
      }}
      source={require('../assets/images/uploading.gif')}
    />
  );
}

export function LoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.loading,
      }}
    >
      <LoadingImage />
    </View>
  );
}
