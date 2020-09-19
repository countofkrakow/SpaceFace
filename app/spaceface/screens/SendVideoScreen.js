import * as React from 'react';
import { useState, useRef } from 'react';
import { View, Text, Image, Slider, StyleSheet, Picker, Platform } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, ScrollView } from 'react-native-gesture-handler';
import { Video } from 'expo-av';
import { UploadVideo } from '../data/UploadVideo';
import * as Network from 'expo-network';
import StyledButton from '../components/StyledButton';
import { DataWarningPopup } from '../components/Popups';

export default function SendVideoScreen({ route, navigation }) {
  const { uri } = route.params;
  const [isPlaying, setPlaying] = useState(true);
  const [showNetworkWarning, setShowNetworkWarning] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        <Video
          source={{ uri: uri }}
          // rate={1.0}
          // volume={1.0}
          isMuted={false}
          resizeMode="cover"
          shouldPlay={isPlaying}
          isLooping
          style={{ aspectRatio: 3 / 4, width: '100%' }}
        />
      </View>
      <View style={styles.buttonContainer}>
        <StyledButton
          onPress={async () => {
            const networkState = await Network.getNetworkStateAsync();
            if (networkState.type != Network.NetworkStateType.WIFI) {
              setShowNetworkWarning(true);
            } else {
              UploadVideo(uri, navigation);
            }
          }}
          text="Animate Trump!"
          disabled={showNetworkWarning}
        />
      </View>
      {showNetworkWarning && (
        <View style={styles.popupContainer}>
          <DataWarningPopup
            onClose={() => {
              UploadVideo(uri, navigation);
            }}
          />
        </View>
      )}
      {Platform.OS == 'ios' && (
        <View style={styles.overlayX}>
          <Feather
            name="x"
            size={50}
            style={{ color: 'white' }}
            onPress={() => navigation.goBack()}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    flex: 1,
  },
  videoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    padding: 20,
    alignItems: 'center',
  },
  popupContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayX: {
    position: 'absolute',
    top: 100,
    left: 0,
  },
});
