import * as React from 'react';
import { StyleSheet, View, Button } from 'react-native';

export default function StyledButton({ onPress, text }) {
  return (
    <View style={styles.buttonContainer}>
      <Button title={text} onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    margin: 20,
    marginRight: 50,
    marginLeft: 50,
  },
});
