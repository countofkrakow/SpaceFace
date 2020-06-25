import * as React from 'react';
import { useState } from 'react';
import { View, Text, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TouchableOpacity, ScrollView } from 'react-native-gesture-handler';
import Colors from '../constants/Colors';
import StyledButton from './../components/StyledButton';
import { MonoText } from './../components/StyledText';
import { DownloadImage } from '../util';
import { GetManipulations } from '../data/Data';

export default class ViewUploadScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = { manipulations: [] };
  }

  async refreshManipulations() {
    const upload = this.props.route.params.upload;
    this.setState({ manipulations: await GetManipulations(upload) });
  }

  componentDidMount() {
    this.refreshManipulations();
  }

  render() {
    const navigation = this.props.navigation;
    const upload = this.props.route.params.upload;

    return (
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={40} style={{ margin: 5 }} />
          </TouchableOpacity>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 20 }}>Photo</Text>
          </View>
          <TouchableOpacity onPress={() => DownloadImage(upload.uri)}>
            <Feather name="download" size={40} style={{ margin: 5 }} />
          </TouchableOpacity>
        </View>
        <Image
          style={{
            width: 400,
            height: 250,
            resizeMode: 'contain',
          }}
          source={{ uri: upload.uri }}
        />
        <View
          style={{
            height: 4,
            borderRadius: 2,
            margin: 10,
            marginLeft: 5,
            marginRight: 5,
            backgroundColor: Colors.lightText,
          }}
        />
        <View style={{ flex: 1 }}>
          <ScrollView>
            {this.state.manipulations.map((manipulation, i) => (
              <Manipulation
                key={i}
                manipulation={manipulation}
                onPress={() =>
                  manipulation.ready &&
                  navigation.push('ViewManipulation', {
                    manipulation,
                    upload,
                  })
                }
              />
            ))}
            <StyledButton
              text="Manipulate Image"
              onPress={() => navigation.push('ManipulateScreen', { upload })}
            />
          </ScrollView>
        </View>
      </View>
    );
  }
}

function Manipulation({ onPress, manipulation }) {
  console.log(manipulation.uri + '/' + (manipulation.steps - 1) + '.png');
  // console.log(manipulation.ready);
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
      {manipulation.ready ? (
        <Image
          style={{ height: 60, width: 60, marginRight: 10 }}
          source={{ uri: manipulation.uri + '/' + (manipulation.steps - 1) + '.png' }}
        />
      ) : (
        <LoadingImage />
      )}
      <MonoText
        style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: Colors.lightText,
        }}
      >
        View Manipulation
      </MonoText>
      <View style={{ flex: 1 }}></View>
    </TouchableOpacity>
  );
}
