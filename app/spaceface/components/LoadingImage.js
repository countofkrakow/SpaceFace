import * as React from 'react';
import { Image } from 'react-native';

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
