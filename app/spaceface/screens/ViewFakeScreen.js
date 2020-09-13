import * as React from 'react';
import { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Video } from 'expo-av';
import { DownloadImage, GetImageExtension } from '../util';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

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
        resizeMode="contain"
        shouldPlay={isPlaying}
        isLooping
        style={{ aspectRatio: 3 / 4 }}
      />
      <View style={{ alignItems: 'center', justifyContent: 'space-around', flexDirection: 'row' }}>
        <TouchableOpacity
          onPress={async () => {
            let fileUri = FileSystem.documentDirectory + 'trump' + GetImageExtension(uri);
            const file = await FileSystem.downloadAsync(uri, fileUri);
            await Sharing.shareAsync(file.uri);
          }}
        >
          <Feather
            name={Platform.OS == 'ios' ? 'share' : 'share-2'}
            size={40}
            style={{ margin: 5 }}
          />
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
