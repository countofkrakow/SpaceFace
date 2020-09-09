import * as React from 'react';
import { useState, useRef } from 'react';
import { View, Text, Image, Slider, StyleSheet, Picker } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, ScrollView } from 'react-native-gesture-handler';
import * as Permissions from 'expo-permissions';
import { Video } from 'expo-av';
import Api from '../constants/Api';
import {
  UPLOADING,
  FAILED_UPLOAD,
  UPLOADED,
  PROCESSING,
  PROCESSING_FAILED,
  StoreUpload,
} from '../data/Data';
import { UUIDV4, GetImageExtension } from '../util';
import Toast from 'react-native-tiny-toast';
import * as VideoThumbnails from 'expo-video-thumbnails';

export default function SendVideoScreen({ route, navigation }) {
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
      </View>
      <View>
        <Text>
          <Text style={{ color: 'red' }}>Data Warning: </Text>
          Uploading videos uses a lot of data. If you are on a limited data plan I suggest you do
          this step over wifi.
        </Text>
      </View>
      <TouchableOpacity
        style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}
        onPress={async () => {
          const videoId = UUIDV4();

          const fileType = GetImageExtension(uri);
          const mimeType = 'video/mp4';
          const videoBlob = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
              resolve(xhr.response);
            };
            xhr.onerror = function (e) {
              console.log(e);
              reject(new TypeError('Network request failed'));
            };
            xhr.responseType = 'blob';
            xhr.open('GET', uri, true);
            xhr.send(null);
          });
          console.log('Got blob');

          const videoFileName = videoId + fileType;
          const bucketUri = Api.fom_video_upload(videoFileName);

          const thumbnail = await VideoThumbnails.getThumbnailAsync(uri);

          let newUpload = {
            key: videoId,
            localUri: uri,
            ogThumbnail: thumbnail.uri,
            bucketUri: bucketUri,
            state: UPLOADING,

            processed: false,
          };
          await StoreUpload(newUpload);
          navigation.navigate('GalleryScreen');

          console.log(`Uploading ${uri} to ${bucketUri}`);
          let uploadError = null;
          try {
            const uploadResponse = await fetch(bucketUri, {
              method: 'PUT',
              body: videoBlob,
              headers: {
                'x-amz-acl': 'public-read-write',
                'Content-Type': 'video/mp4',
              },
            });
            if (!uploadResponse.ok) {
              uploadError = uploadResponse.statusText + ' ' + (await uploadResponse.text());
            }
          } catch (e) {
            uploadError = e.message;
          }
          if (uploadError) {
            console.log('Upload failed:');
            console.log(uploadError);
            Toast.show('Upload failed.', { position: Toast.position.BOTTOM });
            newUpload.state = FAILED_UPLOAD;
            await StoreUpload(newUpload);
            return;
          }
          console.log(`Uploaded ${bucketUri}, sending request`);
          newUpload.state = UPLOADED;
          await StoreUpload(newUpload);

          const apiUrl = Api.fom_process_video(videoId);
          console.log(apiUrl);
          const processResponse = await fetch(apiUrl);
          newUpload.state = processResponse.ok ? PROCESSING : PROCESSING_FAILED;
          if (!processResponse.ok) {
            console.log(await processResponse.text());
          }
          console.log(`New state: ${newUpload.state}`);
          await StoreUpload(newUpload);
        }}
      >
        <Text style={styles.buttonBorder}>Animate Trump!</Text>
      </TouchableOpacity>
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
