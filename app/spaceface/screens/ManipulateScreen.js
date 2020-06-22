import * as React from 'react';
import { useState, useRef } from 'react';
import { View, Text, Image, Slider, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TouchableOpacity, ScrollView } from 'react-native-gesture-handler';
import Colors from '../constants/Colors';
import StyledButton from './../components/StyledButton';
import { CameraRoll } from 'react-native';
import { DownloadImage } from './../util';
import { MonoText } from './../components/StyledText';

export default function ManipulateScreen({ route, navigation }) {
  const { upload } = route.params;
  const ageRef = useRef();

  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={40} style={{ margin: 5 }} />
        </TouchableOpacity>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginRight: 50 }}>
          <Text style={{ fontSize: 20 }}>Photo</Text>
        </View>
      </View>
      <ScrollView style={{ margin: 10 }}>
        <MonoText style={styles.labelText}>Age</MonoText>
        <MySlider minimumValue={4} maximumValue={80} value={20} step={1} ref={ageRef} />
        <View style={styles.sliderLabelsContainer}>
          <MonoText>4</MonoText>
          <MonoText>80</MonoText>
        </View>
        <MonoText style={styles.labelText}>Gender</MonoText>
        <MySlider value={0.1} ref={ageRef} />
        <View style={styles.sliderLabelsContainer}>
          <MonoText>Boy</MonoText>
          <MonoText>Girl</MonoText>
        </View>
        <StyledButton
          text="Manipulate"
          onPress={() => console.log(JSON.stringify(ageRef.current.value))}
        />
      </ScrollView>
    </View>
  );
}

class MySlider extends React.Component {
  render() {
    return <Slider {...this.props} onValueChange={(value) => (this.value = value)} />;
  }
}

const styles = StyleSheet.create({
  labelText: {
    fontSize: 20,
    marginBottom: 10,
  },
  sliderLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 10,
    paddingLeft: 10,
  },
});
