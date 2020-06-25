import * as React from 'react';
import { useState, useRef } from 'react';
import { View, Text, Image, Slider, StyleSheet, Picker } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TouchableOpacity, ScrollView } from 'react-native-gesture-handler';
import Colors from '../constants/Colors';
import StyledButton from './../components/StyledButton';
import { CameraRoll } from 'react-native';
import { DownloadImage } from './../util';
import { MonoText } from './../components/StyledText';
import Api from '../constants/Api';
import { Toast } from 'react-native-tiny-toast';
import { StoreManipulation } from '../data/Data';

export default function ManipulateScreen({ route, navigation }) {
  const { upload } = route.params;
  const [manipulatePressed, setManipulatePressed] = useState(false);
  const minRef = useRef();
  const maxRef = useRef();
  const stepsRef = useRef();
  const typeRef = useRef();

  const manipulate = async () => {
    setManipulatePressed(true);
    const params = {
      min: minRef.current.value,
      max: maxRef.current.value,
      steps: stepsRef.current.value,
      type: typeRef.current.value,
      id: upload.key,
    };
    const response = await fetch(Api.manipulate(params));
    if (response.ok) {
      const responseObj = await response.json();
      await StoreManipulation(
        upload,
        Object.assign(
          {
            key: responseObj.result_id,
            uri: responseObj.result_uri,
            ready: false,
          },
          params
        )
      );
      // onRefresh();
    } else {
      Toast.show('Server error.', { position: Toast.position.BOTTOM });
    }
    navigation.goBack();
  };

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
        <MyPicker
          values={['age', 'gender', 'pose', 'smile', 'glasses']}
          labels={['Age', 'Gender', 'Pose', 'Smile', 'Glasses']}
          ref={typeRef}
        />
        <MonoText style={styles.labelText}>Min</MonoText>
        <MySlider minimumValue={-10} maximumValue={10} value={-2} step={1} ref={minRef} />
        <View style={styles.sliderLabelsContainer}>
          <MonoText>-10</MonoText>
          <MonoText>10</MonoText>
        </View>
        <MonoText style={styles.labelText}>Max</MonoText>
        <MySlider minimumValue={-10} maximumValue={10} value={2} step={1} ref={maxRef} />
        <View style={styles.sliderLabelsContainer}>
          <MonoText>-10</MonoText>
          <MonoText>10</MonoText>
        </View>
        <MonoText style={styles.labelText}>Steps</MonoText>
        <MySlider minimumValue={10} maximumValue={100} value={16} step={1} ref={stepsRef} />
        <View style={styles.sliderLabelsContainer}>
          <MonoText>10</MonoText>
          <MonoText>100</MonoText>
        </View>
        <StyledButton disabled={manipulatePressed} text="Manipulate" onPress={() => manipulate()} />
      </ScrollView>
    </View>
  );
}

class MyPicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: props.values[0] };
    this.value = props.values[0];
  }
  render() {
    return (
      <Picker
        selectedValue={this.state.value}
        onValueChange={(value) => {
          this.setState({ value });
          this.value = value;
        }}
      >
        {this.props.values.map((v, i) => (
          <Picker.Item key={i} label={this.props.labels[i]} value={v} />
        ))}
      </Picker>
    );
  }
}

class MySlider extends React.Component {
  constructor(props) {
    super(props);
    this.value = props.value;
  }
  render() {
    return <Slider {...this.props} onValueChange={(value) => (this.value = value)} />;
  }
}

const styles = StyleSheet.create({
  labelText: {
    fontSize: 15,
    marginBottom: 10,
  },
  sliderLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 10,
    paddingLeft: 10,
  },
});
