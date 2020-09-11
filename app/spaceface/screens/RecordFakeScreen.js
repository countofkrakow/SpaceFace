import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { View, Text, Image, Slider, StyleSheet, Picker } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, ScrollView } from 'react-native-gesture-handler';
import * as Permissions from 'expo-permissions';
import { Camera } from 'expo-camera';
import { HelpPopup } from '../components/HelpPopup';
import { GetStoredThumbnails } from '../data/Data';

function CameraControls({ photoThumbnails, navigation, onCapturePress, onReversePress }) {
  return (
    <View style={styles.controlsContainer}>
      {photoThumbnails.length > 0 ? (
        <TouchableOpacity
          style={styles.photoThumbnailContainer}
          onPress={() => {
            navigation.push('GalleryScreen');
          }}
        >
          <Image
            source={{ uri: photoThumbnails[photoThumbnails.length - 1] }}
            style={{ width: 35, height: 35, resizeMode: 'cover' }}
          />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 40 }}></View>
      )}
      <TouchableOpacity style={{}} onPress={onCapturePress}>
        <Feather name="target" size={70} style={styles.controlIcon} />
      </TouchableOpacity>
      <TouchableOpacity style={{}} onPress={onReversePress}>
        <Ionicons name="ios-reverse-camera" size={50} style={styles.controlIcon} />
      </TouchableOpacity>
    </View>
  );
}

export default function RecordFakeScreen({ route, navigation }) {
  const [cameraDirection, setCameraDirection] = useState(Camera.Constants.Type.front);
  const [showHelp, setShowHelp] = useState(true);
  const [showPermissionsError, setShowPermissionsError] = useState(false);
  const [photoThumbnails, setPhotoThumbnails] = useState([]);
  const camera = useRef();
  let isRecording = false;

  let permissionsLock = false;

  useEffect(() => {
    (async () => {
      setPhotoThumbnails(await GetStoredThumbnails());
    })();
  }, [route.params?.updateTime]);

  if (showHelp) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black' }}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <HelpPopup
            showPermissionsError={showPermissionsError}
            onClose={async () => {
              if (permissionsLock) {
                return;
              }
              permissionsLock = true;
              try {
                const permissions = await Permissions.askAsync(
                  Permissions.CAMERA,
                  Permissions.AUDIO_RECORDING
                );
                if (permissions.granted) {
                  setShowHelp(false);
                } else {
                  setShowPermissionsError(true);
                }
              } finally {
                permissionsLock = false;
              }
            }}
          />
        </View>
        <CameraControls photoThumbnails={photoThumbnails} navigation={navigation} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Camera
          style={{ aspectRatio: 3 / 4 }}
          type={cameraDirection}
          onFacesDetected={() => {}}
          ref={camera}
        ></Camera>
      </View>
      <CameraControls
        photoThumbnails={photoThumbnails}
        navigation={navigation}
        onCapturePress={() => {
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
        onReversePress={() => {
          if (showHelp) {
            return;
          }
          setCameraDirection(
            cameraDirection === Camera.Constants.Type.back
              ? Camera.Constants.Type.front
              : Camera.Constants.Type.back
          );
        }}
      />
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
    paddingLeft: 30,
    paddingRight: 30,
    paddingBottom: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlIcon: {
    color: 'white',
  },
  photoThumbnailContainer: {
    width: 40,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 3,
  },
});