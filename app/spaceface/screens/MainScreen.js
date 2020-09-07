import * as React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { MonoText } from '../components/StyledText';
import { LoadingImage, LoadingScreen, UploadingImage } from '../components/Loading';
import Colors from '../constants/Colors';
import StyledButton from './../components/StyledButton';
import { GetUploads, StoreUpload, PROCESSING, UPLOADING, COMPLETE } from '../data/Data';
import Api from '../constants/Api';

export default class MainScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      uploads: [
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
    this.props.navigation.addListener('focus', () => {
      this.refresh();
    });
    this.refreshTimeout = null;
  }

  async refresh() {
    if (this.state.refreshing) {
      return;
    }
    this.setState({ refreshing: true });
    const newUploads = await GetUploads();
    this.setState({
      refreshing: false,
      loading: false,
      uploads: newUploads,
    });
    if (
      this.refreshTimeout == null &&
      newUploads.some((upload) => upload.status == PROCESSING || upload.status == UPLOADING)
    ) {
      this.refreshTimeout = setTimeout(() => {
        this.refresh();
      }, 60000);
    }
  }

  async componentDidMount() {
    this.refresh();
  }

  renderNoImage() {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          refreshControl={<RefreshControl refreshing={false} onRefresh={this.refresh.bind(this)} />}
        >
          <View style={styles.getStartedContainer}>
            <Text style={styles.getStartedText}>
              Welcome to the fakes app. You can make Trump talk using the button below. Upload a
              video like the one below to animate Trump's face. Keep your face clearly visible in
              the video and don't move around too much.
            </Text>
            <Text style={styles.getStartedText}>Example Upload:</Text>
            <View style={styles.sampleImageContainer}>
              <Image
                source={require('../assets/images/example.gif')}
                style={styles.sampleUploadImage}
              />
            </View>
          </View>
          <StyledButton text="Create Fake" onPress={this.createFakeButtonPress.bind(this)} />
        </ScrollView>
      </View>
    );
  }

  renderUploads() {
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
          {this.state.uploads.map((upload, i) => (
            <UploadView key={i} upload={upload} navigation={this.props.navigation} />
          ))}
          <StyledButton text="Add" onPress={this.createFakeButtonPress.bind(this)} />
        </ScrollView>
      </View>
    );
  }

  render() {
    if (this.state.loading) {
      return <LoadingScreen />;
    }
    if (this.state.uploads.length > 0) {
      return this.renderUploads();
    }
    return this.renderNoImage();
  }

  async createFakeButtonPress() {
    this.props.navigation.push('RecordFakeScreen');
  }
}

function UploadView({ upload, navigation }) {
  if (upload.state == COMPLETE) {
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
        <TouchableOpacity
          onPress={() => {
            navigation.push('ViewFakeScreen', { uri: Api.fom_video_result(upload.key) });
          }}
        >
          <MonoText style={styles.noteText}>View Fake</MonoText>
        </TouchableOpacity>
      </View>
    );
  }
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
      <MonoText style={styles.noteText}>
        {upload.state == UPLOADING
          ? 'Uploading...'
          : upload.state == PROCESSING
          ? 'Processing...'
          : 'Error'}
      </MonoText>
      <View style={{ flex: 1 }}></View>
      {upload.state == UPLOADING ? (
        <UploadingImage />
      ) : upload.state == PROCESSING ? (
        <LoadingImage />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {},
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
    height: 50,
    textAlignVertical: 'center',
  },
});
