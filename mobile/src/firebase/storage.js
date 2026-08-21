import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './config';

// `asset` is one entry from expo-image-picker's result.assets array.
export const uploadPostMedia = async (squadId, postId, asset) => {
  const response = await fetch(asset.uri);
  const blob = await response.blob();

  const extension = (asset.fileName || asset.uri).split('.').pop().split('?')[0] || 'dat';
  const fileName = `${Date.now()}.${extension}`;
  const storagePath = `squads/${squadId}/posts/${postId}/${fileName}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, blob, { contentType: asset.mimeType || blob.type });
  const url = await getDownloadURL(storageRef);

  return {
    type: asset.type === 'video' ? 'video' : 'image',
    url,
    storagePath,
    width: asset.width || 0,
    height: asset.height || 0,
    duration: asset.type === 'video' && asset.duration ? asset.duration / 1000 : null,
  };
};

export const deleteMediaFile = (storagePath) =>
  deleteObject(ref(storage, storagePath)).catch(() => {});
