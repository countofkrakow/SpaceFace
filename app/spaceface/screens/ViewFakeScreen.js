import * as React from 'react';
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Video } from 'expo-av';
import { DownloadImage } from '../util';

export default function ViewFakeScreen({ route, navigation }) {
  const { uri } = route.params;
  const [isPlaying, setPlaying] = useState(true);

  return (
    <View style={{}}>
      <Video
        source={{ uri: uri }}
        // rate={1.0}
        // volume={1.0}
        isMuted={false}
        resizeMode="cover"
        shouldPlay={isPlaying}
        isLooping
        style={{ aspectRatio: 3 / 4 }}
      />
      <View style={{ alignItems: 'center' }}>
        <TouchableOpacity
          style={{}}
          onPress={() => {
            setPlaying(!isPlaying);
          }}
        >
          <Feather name={isPlaying ? 'pause' : 'play'} size={50} style={styles.controlIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => DownloadImage(uri)}>
          <Feather name="download" size={40} style={{ margin: 5 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonBorder: {
    borderWidth: 3,
    borderRadius: 10,
    paddingTop: 7,
    paddingLeft: 7,
    paddingBottom: 2,
    paddingRight: 2,
    fontWeight: 'bold',
  },
});
