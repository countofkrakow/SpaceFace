import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';

import useCachedResources from './hooks/useCachedResources';
import GalleryScreen from './screens/GalleryScreen';
import RecordFakeScreen from './screens/RecordFakeScreen';
import SendVideoScreen from './screens/SendVideoScreen';
import ViewFakeScreen from './screens/ViewFakeScreen';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

const Stack = createStackNavigator();

export default function App(props) {
  const isLoadingComplete = useCachedResources();

  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <View style={styles.container}>
        {/* {Platform.OS === 'ios' && <StatusBar barStyle="dark-content" />} */}
        <StatusBar />
        <NavigationContainer>
          <Stack.Navigator initialRouteName="RecordFakeScreen">
            <Stack.Screen
              options={{ title: 'Gallery' }}
              name="GalleryScreen"
              component={GalleryScreen}
            />
            <Stack.Screen
              name="RecordFakeScreen"
              component={RecordFakeScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              options={{ headerShown: false }}
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
