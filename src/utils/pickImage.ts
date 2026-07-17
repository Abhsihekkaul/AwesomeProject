import { Alert } from "react-native";
import {
  CameraOptions,
  ImageLibraryOptions,
  ImagePickerResponse,
  launchCamera,
  launchImageLibrary,
} from "react-native-image-picker";

/**
 * One image pipeline for the whole app: posts and chat messages both attach photos
 * as compressed base64 data-URIs (the MVP transport until cloud media storage lands).
 * Downscaled + compressed so the payload stays well inside the API's 10mb limit.
 */
const IMAGE_OPTIONS: CameraOptions & ImageLibraryOptions = {
  mediaType: "photo",
  includeBase64: true,
  maxWidth: 1280,
  maxHeight: 1280,
  quality: 0.6,
};

const toDataUri = (result: ImagePickerResponse): string | null => {
  if (result.didCancel) return null;

  const asset = result.assets?.[0];
  if (result.errorCode || !asset?.base64) {
    Alert.alert("Couldn't load image", result.errorMessage ?? "Try a different photo.");
    return null;
  }
  return `data:${asset.type ?? "image/jpeg"};base64,${asset.base64}`;
};

/** Opens the photo library. Returns the chosen photo as a data-URI, or null if cancelled. */
export const pickImageAsDataUri = async (): Promise<string | null> =>
  toDataUri(await launchImageLibrary({ ...IMAGE_OPTIONS, selectionLimit: 1 }));

/**
 * Multi-select gallery picker (post carousels). Returns up to `maxCount` photos
 * as data-URIs — empty array if the user cancels.
 */
export const pickImagesAsDataUri = async (maxCount: number): Promise<string[]> => {
  const result = await launchImageLibrary({ ...IMAGE_OPTIONS, selectionLimit: maxCount });
  if (result.didCancel) return [];
  if (result.errorCode) {
    Alert.alert("Couldn't load images", result.errorMessage ?? "Try different photos.");
    return [];
  }
  return (result.assets ?? [])
    .filter((a) => a.base64)
    .slice(0, maxCount)
    .map((a) => `data:${a.type ?? "image/jpeg"};base64,${a.base64}`);
};

/** Opens the camera to take a photo right now. Returns it as a data-URI, or null if cancelled. */
export const captureImageAsDataUri = async (): Promise<string | null> =>
  toDataUri(await launchCamera({ ...IMAGE_OPTIONS, saveToPhotos: false }));
