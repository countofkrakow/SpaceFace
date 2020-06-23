import * as React from 'react';
import { Image, Platform, StyleSheet, TouchableOpacity, Text, View, Button } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';

import { MonoText } from '../components/StyledText';
import { LoadingImage, LoadingScreen } from '../components/Loading';
import Colors from '../constants/Colors';
import { GetUploads } from '../data/Data';

export default class MyPhotosScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      uploads: [],
      loading: true,
    };
  }

  async getUploads() {
    return (await GetUploads()).filter((upload) => upload.ready);
  }

  async componentDidMount() {
    const uploads = await this.getUploads();
    this.setState({
      loading: false,
      uploads,
    });
  }

  renderUploads() {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          {this.state.uploads.map((upload, i) => (
            <Upload key={i} upload={upload} onPress={this.manipulateUpload.bind(this, upload)} />
          ))}
        </ScrollView>
      </View>
    );
  }

  manipulateUpload(upload) {
    this.props.navigation.push('ViewUploadScreen', { upload });
  }

  renderNoUploads() {
    return (
      <View style={styles.container}>
        <Text>You don't have any uploaded image. Click "Upload" below to upload one.</Text>
      </View>
    );
  }

  render() {
    if (this.state.loading) {
      return <LoadingScreen />;
    }
    if (this.state.uploads.length == 0) {
      return this.renderNoUploads();
    }
    return this.renderUploads();
  }
}

function Upload({ onPress, upload }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        margin: 10,
        backgroundColor: Colors.tabIconDefault,
        alignItems: 'center',
        padding: 5,
      }}
    >
      <Image style={{ height: 60, width: 60, marginRight: 10 }} source={{ uri: upload.uri }} />
      <MonoText style={styles.noteText}>Manipulate Image</MonoText>
      <View style={{ flex: 1 }}></View>
    </TouchableOpacity>
  );
}

MyPhotosScreen.navigationOptions = {
  header: null,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {},
  imageContainer: {
    alignItems: 'center',
  },
  buttonContainer: {
    margin: 20,
    marginRight: 50,
    marginLeft: 50,
  },
  noteText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.lightText,
  },
});
