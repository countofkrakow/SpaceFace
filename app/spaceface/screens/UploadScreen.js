import * as React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';

import { MonoText } from '../components/StyledText';
import { LoadingImage, LoadingScreen } from '../components/Loading';
import Colors from '../constants/Colors';
import StyledButton from './../components/StyledButton';
import { GetUploads, StoreUpload } from '../data/data';
import { GetImageExtension } from './../util';
import Toast from 'react-native-tiny-toast';

export default class UploadScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedImage: null,
      pendingUploads: [
        // {
        //   uri: 'https://www.yourdictionary.com/images/definitions/lg/10750.person.jpg',
        // },
        // {
        //   uri:
        //     'https://www.biography.com/.image/ar_1:1%2Cc_fill%2Ccs_srgb%2Cg_face%2Cq_auto:good%2Cw_300/MTcyMzE0MzI2NTU0NjQ5ODEy/ang-lee-gettyimages-163118045.jpg',
        // },
      ],
      loading: true,
      refreshing: false,
    };
  }

  async getPendingUploads() {
    const uploads = await GetUploads();
    return uploads.filter((upload) => upload.ready == false);
  }

  async refresh() {
    if (this.state.refreshing) {
      return;
    }
    this.setState({ refreshing: true });
    let pendingUploads = await this.getPendingUploads();
    // await Promise.all(
    //   pendingUploads.map(async (upload) => {
    //     // Do get request...;
    //     // pendingUploads = ...
    //   })
    // );
    setTimeout(() => this.setState({ refreshing: false, loading: false, pendingUploads }), 1000);
  }

  async componentDidMount() {
    const pendingUploads = await this.getPendingUploads();
    console.log(pendingUploads.length);
    if (pendingUploads.length == 0) {
      this.setState({
        loading: false,
        pendingUploads,
      });
    } else {
      this.refresh();
    }
  }

  renderNoImage() {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={async () =>
                this.setState({ pendingUploads: await this.getPendingUploads() })
              }
            />
          }
        >
          <View style={styles.getStartedContainer}>
            <Text style={styles.getStartedText}>
              You have no pending uploads. Upload a new photo with a face. We recommend uploading a
              photo with a clear picture of one person in it. We cannot process photos with multiple
              faces at this time.
            </Text>
            <Text style={styles.getStartedText}>Example Upload:</Text>
            <View style={styles.imageContainer}>
              <Image
                source={require('../assets/images/example-upload.jpg')}
                style={styles.sampleUploadImage}
              />
            </View>
          </View>
          <StyledButton text="Choose Image" onPress={this.chooseImageButtonPress.bind(this)} />
        </ScrollView>
      </View>
    );
  }

  renderWithImage() {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          <View style={styles.getStartedContainer}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: this.state.selectedImage }} style={styles.sampleUploadImage} />
            </View>
          </View>
          <StyledButton text="Upload" onPress={this.uploadButtonPress.bind(this)} />
          <StyledButton text="Cancel" onPress={this.cancelUploadButtonPress.bind(this)} />
        </ScrollView>
      </View>
    );
  }

  renderPendingUploads() {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this.refresh.bind(this)}
            />
          }
        >
          {this.state.pendingUploads.map((pendingUpload, i) => (
            <PendingUpload key={i} pendingUpload={pendingUpload} />
          ))}
          <StyledButton text="Add" onPress={this.chooseImageButtonPress.bind(this)} />
        </ScrollView>
      </View>
    );
  }

  render() {
    if (this.state.loading) {
      return <LoadingScreen />;
    }
    if (this.state.selectedImage) {
      return this.renderWithImage();
    }
    if (this.state.pendingUploads.length > 0) {
      return this.renderPendingUploads();
    }
    return this.renderNoImage();
  }

  async chooseImageButtonPress() {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 1,
    });

    if (!result.cancelled) {
      this.setState({ selectedImage: result.uri });
    }
  }

  async uploadButtonPress() {
    this.setState({ loading: true });
    let presignedUrlResponse = await fetch(
      'https://c6vrdtg6uc.execute-api.us-west-2.amazonaws.com/spaceface/encode?push_token=123'
    );
    // console.log('Presigned fetch complete.');
    if (!presignedUrlResponse.ok) {
      console.log(presignedUrlResponse.statusText);
      this.setState({
        selectedImage: null,
        loading: false,
      });
      Toast.show('Upload failed.', { position: Toast.position.BOTTOM });
      return;
    }
    const presignedUrlData = await presignedUrlResponse.json();
    // console.log(presignedUrlData.fields.key);

    const fileType = GetImageExtension(this.state.selectedImage);
    const mimeType = 'image/' + fileType.substr(1);
    let formData = new FormData();
    Object.keys(presignedUrlData.fields).forEach((field) =>
      formData.append(field, presignedUrlData.fields[field])
    );
    formData.append('file', {
      uri: this.state.selectedImage,
      name: 'image' + fileType,
      type: mimeType,
    });
    // console.log('Uploading image');
    const uploadResponse = await fetch(presignedUrlData.url, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (!uploadResponse.ok) {
      console.log('Upload failed:');
      console.log(uploadResponse.statusText);
      console.log(await uploadResponse.text());
      this.setState({
        selectedImage: null,
        loading: false,
      });
      Toast.show('Upload failed.', { position: Toast.position.BOTTOM });
      return;
    }
    const newUpload = {
      key: presignedUrlData.fields.key,
      uri: presignedUrlData.url + presignedUrlData.fields.key,
      ready: false,
    };
    await StoreUpload(newUpload);
    this.setState({
      selectedImage: null,
      loading: false,
      pendingUploads: this.state.pendingUploads.concat([newUpload]),
    });
  }

  async cancelUploadButtonPress() {
    this.setState({
      selectedImage: null,
    });
  }
}

function PendingUpload(props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        margin: 10,
        backgroundColor: Colors.tabIconDefault,
        alignItems: 'center',
        padding: 5,
      }}
    >
      <Image
        style={{ height: 60, width: 60, marginRight: 10 }}
        source={{ uri: props.pendingUpload.uri }}
      />
      <MonoText style={styles.noteText}>Processing image...</MonoText>
      <View style={{ flex: 1 }}></View>
      <LoadingImage />
    </View>
  );
}

UploadScreen.navigationOptions = {
  header: null,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {},
  sampleUploadImage: {
    width: 400,
    height: 250,
    resizeMode: 'contain',
    marginTop: 3,
    marginLeft: -10,
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
  navigationFilename: {
    marginTop: 5,
  },
  imageContainer: {
    alignItems: 'center',
  },
  noteText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.lightText,
  },
});
