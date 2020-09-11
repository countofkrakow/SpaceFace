import * as React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import StyledButton from './StyledButton';
import Colors from '../constants/Colors';

export function HelpPopup({ onClose, showPermissionsError }) {
  return (
    <View style={styles.popup}>
      <View style={styles.getStartedContainer}>
        <Text style={styles.getStartedText}>
          Welcome to the fakes app. You can make Trump talk using the button below. Upload a video
          like the one below to animate Trump's face. Keep your face clearly visible in the video
          and don't move around too much.
        </Text>
        {showPermissionsError && (
          <Text style={{ color: 'red', marginBottom: 5 }}>
            You need to give camera permissions to use this app.
          </Text>
        )}
        <Text style={styles.getStartedText}>Example Upload:</Text>
        <View style={styles.sampleImageContainer}>
          <Image
            source={require('../assets/images/example.gif')}
            style={styles.sampleUploadImage}
          />
        </View>
      </View>
      <StyledButton text="Start Creating" onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  popup: {
    paddingTop: 10,
    borderColor: Colors.background,
    borderRadius: 7,
    margin: 10,
    backgroundColor: Colors.background,
  },
  sampleUploadImage: {
    resizeMode: 'contain',
    flex: 1,
    aspectRatio: 1020 / 510,
  },
  sampleImageContainer: {
    flexDirection: 'row',
    marginLeft: -30,
    marginRight: -30,
  },
  getStartedContainer: {
    marginHorizontal: 50,
  },
  getStartedText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    lineHeight: 24,
    marginBottom: 10,
  },
});
