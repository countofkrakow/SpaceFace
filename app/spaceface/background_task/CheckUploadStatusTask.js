import * as TaskManager from 'expo-task-manager';
import { GetUploads, NewUploadsReady } from '../data/Data';
import { Notifications } from 'expo';
import * as BackgroundFetch from 'expo-background-fetch';

export const UPDATE_TASK_NAME = 'update-task';

export function ShowNotification() {
  Notifications.presentLocalNotificationAsync({
    title: 'Trump Fake',
    body: 'You got an upload ready.', // (string) — body text of the notification.
    ios: {
      // (optional) (object) — notification configuration specific to iOS.
      sound: true, // (optional) (boolean) — if true, play a sound. Default: false.
    },
    // (optional) (object) — notification configuration specific to Android.
    android: {
      sound: true, // (optional) (boolean) — if true, play a sound. Default: false.
      //icon (optional) (string) — URL of icon to display in notification drawer.
      //color (optional) (string) — color of the notification icon in notification drawer.
      priority: 'high', // (optional) (min | low | high | max) — android may present notifications according to the priority, for example a high priority notification will likely to be shown as a heads-up notification.
      sticky: false, // (optional) (boolean) — if true, the notification will be sticky and not dismissable by user. The notification must be programmatically dismissed. Default: false.
      vibrate: true, // (optional) (boolean or array) — if true, vibrate the device. An array can be supplied to specify the vibration pattern, e.g. - [ 0, 500 ].
      // link (optional) (string) — external link to open when notification is selected.
    },
  });
}

export function DefineUpdateTask() {
  TaskManager.defineTask(UPDATE_TASK_NAME, async ({ data, error }) => {
    // I assume I'm here because the foreground told me there's a new upload.
    console.log('Checking updates.');
    const { hasReadyUpdates, newUpdatesExpected } = await NewUploadsReady();
    if (hasReadyUpdates) {
      // Fire push notification.
      ShowNotification();
    }
    if (!newUpdatesExpected) {
      BackgroundFetch.unregisterTaskAsync(UPDATE_TASK_NAME);
    }
  });
}

export function StartUploadChecking() {
  BackgroundFetch.registerTaskAsync(UPDATE_TASK_NAME, {
    minimumInterval: 60 * 1, // 5 minutes
    stopOnTerminate: false,
  });
}
