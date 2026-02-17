import * as ImagePicker from 'expo-image-picker';

type PhotoSource = 'library' | 'camera';

async function requestPermission(source: PhotoSource): Promise<boolean> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    return permission.granted;
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return permission.granted;
}

export async function pickProfilePhoto(source: PhotoSource): Promise<string | null> {
  const granted = await requestPermission(source);
  if (!granted) {
    throw new Error('permission-denied');
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.75,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        })
      : await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.75,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          selectionLimit: 1,
        });

  if (result.canceled || !result.assets?.[0]?.uri) {
    return null;
  }

  return result.assets[0].uri;
}
