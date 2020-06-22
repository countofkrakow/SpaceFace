import * as React from 'react';
import MyPhotosScreen from './MyPhotosScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ViewUploadScreen from './ViewUploadScreen';
import ViewManipulation from './ViewManipulation';

const Stack = createStackNavigator();

export default function MyPhotosContainer({ navigation }) {
  return (
    <NavigationContainer independent={true}>
      <Stack.Navigator initialRouteName="MyPhotosScreen">
        <Stack.Screen name="MyPhotosScreen" component={MyPhotosScreen} />
        <Stack.Screen name="ViewUploadScreen" component={ViewUploadScreen} />
        <Stack.Screen name="ViewManipulation" component={ViewManipulation} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
