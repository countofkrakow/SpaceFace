import * as React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { MonoText } from '../components/StyledText';
import { LoadingImage, LoadingScreen, UploadingImage } from '../components/Loading';
import Colors from '../constants/Colors';
import {
  GetUploads,
  StoreUpload,
  PROCESSING,
  UPLOADING,
  COMPLETE,
  PROCESSING_ERROR,
  PROCESSING_FAILED,
  DeleteUpload,
} from '../data/Data';
import Api from '../constants/Api';
import { Video } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-tiny-toast';
import { AntDesign } from '@expo/vector-icons';
import { Entypo } from '@expo/vector-icons';

export default class GalleryScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      uploads: [],
      loading: true,
      refreshing: false,
      selectedIndex: null,
    };
    this.props.navigation.addListener('focus', () => {
      this.refresh();
    });
    this.props.navigation.addListener('blur', () => {
      this.refreshTimeout != null && clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    });
    this.refreshTimeout = null;
  }

  async timerRefresh() {
    console.log('Refreshing');
    this.setState({ uploads: await GetUploads() });
    this.refreshTimeout = null;
    this.startTimerRefresh();
  }

  async startTimerRefresh() {
    if (this.refreshTimeout == null) {
      this.refreshTimeout = setTimeout(() => this.timerRefresh(), 6000);
    }
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
    this.startTimerRefresh();
  }

  async componentDidMount() {
    this.refresh();
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
          // onTouchStart={() => this.setState({ selectedIndex: null })}
        >
          {rowsArray.map((_, i) => {
            const upInds = 2 * i + 1 < this.state.uploads.length ? [2 * i, 2 * i + 1] : [2 * i, -1];
            return (
              <View style={{ flexDirection: 'row' }} key={i}>
                {upInds.map((j) =>
                  j >= 0 ? (
                    <UploadView
                      key={j}
                      upload={this.state.uploads[j]}
                      navigation={this.props.navigation}
                      onSelect={() =>
                        this.setState({ selectedIndex: this.state.selectedIndex == j ? null : j })
                      }
                      isSelected={this.state.selectedIndex == j}
                    />
                  ) : (
                    <View style={{ flex: 1, margin: 10 }} key={j} />
                  )
                )}
              </View>
            );
          })}
        </ScrollView>
        {this.state.selectedIndex != null && (
          <View style={{ flexDirection: 'row', padding: 20, justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={async () => {
                await DeleteUpload(this.state.uploads[this.state.selectedIndex]);
                this.state.uploads.splice(this.state.selectedIndex, 1);
                this.setState({ selectedIndex: null, uploads: this.state.uploads });
              }}
            >
              <AntDesign name="delete" size={44} color="black" />
            </TouchableOpacity>
            {this.state.uploads[this.state.selectedIndex].state == PROCESSING_FAILED && (
              <Text>{this.state.uploads[this.state.selectedIndex].error}</Text>
            )}
            {(this.state.uploads[this.state.selectedIndex].state == PROCESSING ||
              this.state.uploads[this.state.selectedIndex].state == UPLOADING) && (
              <Text>Processing the video. May take a while.</Text>
            )}
            <TouchableOpacity onPress={() => this.setState({ selectedIndex: null })}>
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
    return this.renderUploads();
  }

  async createFakeButtonPress() {
    this.props.navigation.push('RecordFakeScreen');
  }
}

function UploadView({ upload, navigation, onSelect, isSelected }) {
  return (
    <TouchableOpacity
      onPress={() => {
        if (upload.state == PROCESSING_FAILED) {
          onSelect();
        } else if (upload.state == COMPLETE) {
          navigation.push('ViewFakeScreen', { uri: Api.fom_video_result(upload.key) });
        }
      }}
      onLongPress={onSelect}
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
        source={
          upload.state == COMPLETE
            ? require('../assets/images/trumpTriangle.png')
            : require('../assets/images/triangle.png')
        }
        style={{
          width: '100%',
          height: '100%',
          top: 5,
          left: 5,
          position: 'absolute',
        }}
      />
      {upload.state != COMPLETE && (
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
      )}
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
