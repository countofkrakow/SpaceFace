import * as React from 'react';
import { useState, useRef } from 'react';
import { View, Text, Image, Slider, StyleSheet, Picker } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, ScrollView } from 'react-native-gesture-handler';
import * as Permissions from 'expo-permissions';
import { Camera } from 'expo-camera';

export default function RecordFakeScreen({ route, navigation }) {
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [cameraDirection, setCameraDirection] = useState(Camera.Constants.Type.front);
  const camera = useRef();
  let isRecording = false;

  if (!cameraAllowed) {
    (async () => {
      const permissions = await Permissions.askAsync(
        Permissions.CAMERA,
        Permissions.AUDIO_RECORDING
      );
      if (permissions.granted) {
        setCameraAllowed(true);
      }
    })();

    return (
      <View style={styles.blackScreen}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={40} style={{ margin: 5, color: '#fff' }} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Camera
          style={{ aspectRatio: 3 / 4 }}
          type={cameraDirection}
          onFacesDetected={() => {}}
          ref={camera}
        ></Camera>
      </View>
      {/* <View style={{ flex: 1 }}></View> */}
      <View style={styles.controlsContainer}>
        <View style={{ width: 40 }}></View>
        <TouchableOpacity
          style={{}}
          onPress={() => {
            if (isRecording) {
              camera.current.stopRecording();
            } else {
              (async () => {
                const { uri } = await camera.current.recordAsync({
                  quality: '1080p',
                  maxDuration: 20,
                });
                navigation.push('SendVideoScreen', { uri });
                isRecording = false;
              })();
              isRecording = true;
            }
          }}
        >
          <Feather name="target" size={50} style={styles.controlIcon} />
        </TouchableOpacity>
        <TouchableOpacity
          style={{}}
          onPress={() => {
            setCameraDirection(
              cameraDirection === Camera.Constants.Type.back
                ? Camera.Constants.Type.front
                : Camera.Constants.Type.back
            );
          }}
        >
          <Ionicons name="ios-reverse-camera" size={50} style={styles.controlIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelText: {
    fontSize: 15,
    marginBottom: 10,
  },
  sliderLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 10,
    paddingLeft: 10,
  },
  blackScreen: {
    flex: 1,
    backgroundColor: '#000',
    padding: 10,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  controlsContainer: {
    flexDirection: 'row',
    marginTop: 10,
    paddingLeft: 10,
    paddingRight: 10,
    justifyContent: 'space-between',
  },
  controlIcon: {},
});
