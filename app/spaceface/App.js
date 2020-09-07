import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';

import useCachedResources from './hooks/useCachedResources';
import MainScreen from './screens/MainScreen';
import RecordFakeScreen from './screens/RecordFakeScreen';
import SendVideoScreen from './screens/SendVideoScreen';
import ViewFakeScreen from './screens/ViewFakeScreen';

const Stack = createStackNavigator();

export default function App(props) {
  const isLoadingComplete = useCachedResources();

  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <View style={styles.container}>
        {Platform.OS === 'ios' && <StatusBar barStyle="dark-content" />}
        <NavigationContainer>
          <Stack.Navigator initialRouteName="MainScreen">
            <Stack.Screen
              options={{ title: 'SpaceFace' }}
              name="MainScreen"
              component={MainScreen}
            />
            <Stack.Screen
              options={{ title: 'SpaceFace' }}
              name="RecordFakeScreen"
              component={RecordFakeScreen}
            />
            <Stack.Screen
              options={{ title: 'SpaceFace' }}
              name="SendVideoScreen"
              component={SendVideoScreen}
            />
            <Stack.Screen
              options={{ title: 'SpaceFace' }}
              name="ViewFakeScreen"
              component={ViewFakeScreen}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
