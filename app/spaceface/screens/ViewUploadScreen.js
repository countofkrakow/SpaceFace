import * as React from 'react';
import { View, Text, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Colors from '../constants/Colors';
import StyledButton from './../components/StyledButton';
import { MonoText } from './../components/StyledText';
import { DownloadImage } from '../util';

export default function ViewUploadScreen({ route, navigation }) {
  const { upload } = route.params;
  const manipulations = [
    {
      uri: 'https://avada.theme-fusion.com/wp-content/uploads/2019/07/person_sample_4.jpg',
    },
  ];
  return (
    <View>
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
      {manipulations.map((manipulation, i) => (
        <Manipulation
          key={i}
          manipulation={manipulation}
          onPress={() => navigation.push('ViewManipulation', { manipulation, upload })}
        />
      ))}
      <StyledButton
        text="Manipulate Image"
        onPress={() => navigation.push('ManipulateScreen', { upload })}
      />
    </View>
  );
}

function Manipulation({ onPress, manipulation }) {
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
      <Image
        style={{ height: 60, width: 60, marginRight: 10 }}
        source={{ uri: manipulation.uri }}
      />
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
