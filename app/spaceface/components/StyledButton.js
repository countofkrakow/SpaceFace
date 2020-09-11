import * as React from 'react';
import { StyleSheet, View, Button, TouchableOpacity, Text } from 'react-native';

export default function StyledButton({ onPress, text, disabled }) {
  return (
    <TouchableOpacity style={styles.buttonContainer} disabled={disabled} onPress={onPress}>
      <Text style={styles.buttonText}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    margin: 20,
    marginRight: 50,
    marginLeft: 50,
    borderRadius: 20,
    padding: 5,
    backgroundColor: 'pink',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
});
