import * as React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { MonoText } from '../components/StyledText';
import { LoadingImage, LoadingScreen, UploadingImage } from '../components/Loading';
import Colors from '../constants/Colors';
import StyledButton from './../components/StyledButton';
import {
  GetUploads,
  StoreUpload,
  PROCESSING,
  UPLOADING,
  COMPLETE,
  PROCESSING_ERROR,
  PROCESSING_FAILED,
} from '../data/Data';
import Api from '../constants/Api';
import { Video } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-tiny-toast';
import { AntDesign } from '@expo/vector-icons';
import { Entypo } from '@expo/vector-icons';

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
      toDelete: null,
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
    const rowsArray = new Array(Math.ceil(this.state.uploads.length / 2)).fill(0);
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
          onTouchStart={() => this.setState({ toDelete: null })}
        >
          {rowsArray.map((_, i) => {
            const upInds = 2 * i + 1 < this.state.uploads.length ? [2 * i, 2 * i + 1] : [2 * i];
            return (
              <View style={{ flexDirection: 'row' }} key={i}>
                {upInds.map((j) => (
                  <UploadView
                    key={j}
                    upload={this.state.uploads[j]}
                    navigation={this.props.navigation}
                    onShowDelete={() => this.setState({ toDelete: j })}
                    isSelected={this.state.toDelete == j}
                  />
                ))}
              </View>
            );
          })}
          <StyledButton text="Add" onPress={this.createFakeButtonPress.bind(this)} />
        </ScrollView>
        {this.state.toDelete != null && (
          <View style={{ flexDirection: 'row', padding: 20, justifyContent: 'space-between' }}>
            <TouchableOpacity>
              <AntDesign name="delete" size={44} color="black" />
            </TouchableOpacity>
            {this.state.uploads[this.state.toDelete].state == PROCESSING_FAILED && (
              <Text>{this.state.uploads[this.state.toDelete].error}</Text>
            )}
            <TouchableOpacity onPress={() => this.setState({ toDelete: null })}>
              <Entypo name="cross" size={44} color="black" />
            </TouchableOpacity>
          </View>
        )}
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

function UploadView({ upload, navigation, onShowDelete, isSelected }) {
  return (
    <TouchableOpacity
      onPress={() => {
        if (upload.state == PROCESSING_FAILED) {
          onShowDelete();
        } else if (upload.state == COMPLETE) {
          navigation.push('ViewFakeScreen', { uri: Api.fom_video_result(upload.key) });
        }
      }}
      onLongPress={onShowDelete}
      style={{
        flexDirection: 'row',
        margin: 10,
        backgroundColor: isSelected ? Colors.tabIconSelected : Colors.tabIconDefault,
        alignItems: 'center',
        padding: 5,
        flex: 1,
        position: 'relative',
      }}
    >
      {isSelected ? (
        <Video
          source={{ uri: upload.localUri }}
          // rate={1.0}
          // volume={1.0}
          isMuted={true}
          resizeMode="cover"
          shouldPlay={true}
          isLooping
          style={{ flex: 1, aspectRatio: 1 }}
        />
      ) : (
        <Image
          source={{ uri: upload.ogThumbnail }}
          style={{ flex: 1, aspectRatio: 1, resizeMode: 'cover' }}
        />
      )}
      <Image
        source={require('../assets/images/triangle.png')}
        style={{
          width: '100%',
          height: '100%',
          top: 5,
          left: 5,
          position: 'absolute',
        }}
      />
      <View
        style={{
          width: '100%',
          height: '100%',
          aspectRatio: 1,
          top: 5,
          left: 5,
          position: 'absolute',
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'flex-end',
        }}
      >
        <View
          style={{ width: '66%', height: '66%', justifyContent: 'center', alignItems: 'center' }}
        >
          {upload.state == UPLOADING ? (
            <UploadingImage />
          ) : upload.state == PROCESSING ? (
            <LoadingImage />
          ) : (
            <MaterialIcons name="error-outline" size={50} color="red" />
          )}
        </View>
      </View>
    </TouchableOpacity>
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
