import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as React from 'react';

import TabBarIcon from '../components/TabBarIcon';
import UploadScreen from '../screens/UploadScreen';
import MyPhotosScreen from '../screens/MyPhotosScreen';

const BottomTab = createBottomTabNavigator();
const INITIAL_ROUTE_NAME = 'Upload';

export default function BottomTabNavigator({ navigation, route }) {
  // Set the header title on the parent stack navigator depending on the
  // currently active tab. Learn more in the documentation:
  // https://reactnavigation.org/docs/en/screen-options-resolution.html
  navigation.setOptions({ headerTitle: getHeaderTitle(route) });

  return (
    <BottomTab.Navigator initialRouteName={INITIAL_ROUTE_NAME}>
      <BottomTab.Screen
        name="Upload"
        component={UploadScreen}
        options={{
          title: 'Upload',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} name="md-cloud-upload" />,
        }}
      />
      <BottomTab.Screen
        name="MyPhotos"
        component={MyPhotosScreen}
        options={{
          title: 'My Photos',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} name="md-contacts" />,
        }}
      />
    </BottomTab.Navigator>
  );
}

function getHeaderTitle(route) {
  const routeName = route.state?.routes[route.state.index]?.name ?? INITIAL_ROUTE_NAME;

  switch (routeName) {
    case 'Home':
      return 'How to get started';
    case 'Links':
      return 'Links to learn more';
  }
}
