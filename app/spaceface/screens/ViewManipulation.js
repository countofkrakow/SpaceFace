import * as React from 'react';
import { useState } from 'react';
import { View, Text, Image, Slider } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Colors from '../constants/Colors';
import StyledButton from './../components/StyledButton';
import { CameraRoll } from 'react-native';
import { DownloadImage } from './../util';

export default function ViewManipulation({ route, navigation }) {
  const { manipulation, upload } = route.params;
  const [sliderState, setSliderState] = useState({ fraction: 0.5 });

  const totalImageWidth = 300;
  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={40} style={{ margin: 5 }} />
        </TouchableOpacity>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 20 }}>Photo</Text>
        </View>
        <TouchableOpacity onPress={() => DownloadImage(manipulation.uri)}>
          <Feather name="download" size={40} style={{ margin: 5 }} />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <View
          style={{
            width: totalImageWidth * sliderState.fraction,
            height: 400,
            overflow: 'hidden',
          }}
        >
          <Image
            style={{
              width: totalImageWidth,
              height: 400,
              resizeMode: 'contain',
            }}
            source={{ uri: upload.uri }}
          />
        </View>
        <View
          style={{
            width: totalImageWidth * (1 - sliderState.fraction),
            height: 400,
            overflow: 'hidden',
          }}
        >
          <Image
            style={{
              width: totalImageWidth,
              marginLeft: -totalImageWidth * sliderState.fraction,
              height: 400,
              resizeMode: 'contain',
            }}
            source={{ uri: manipulation.uri }}
          />
        </View>
      </View>
      <View style={{ alignItems: 'center' }}>
        <Slider
          style={{ width: totalImageWidth, height: 40 }}
          value={sliderState.fraction}
          onValueChange={(fraction) => setSliderState({ fraction })}
          minimumValue={0}
          maximumValue={1}
          minimumTrackTintColor="#FFFFFF"
          maximumTrackTintColor="#000000"
        />
      </View>
    </View>
  );
}
