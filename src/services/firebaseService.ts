/**
 * Firebase Service
 * Handles file uploads and storage using Firebase
 */

import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Firebase configuration
// Note: In a production environment, these values should be stored in environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

/**
 * Upload a file to Firebase Storage
 * @param file The file to upload
 * @param path The storage path where the file should be stored
 * @param progressCallback Optional callback to track upload progress
 * @returns Promise that resolves with the download URL
 */
export const uploadFile = async (
  file: File,
  path: string,
  progressCallback?: (progress: number) => void
): Promise<string> => {
  try {
    // Create a unique file name with timestamp
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;

    // Create a storage reference
    const storageRef = ref(storage, `${path}/${fileName}`);
    
    // Upload the file
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    // Return a promise that resolves with the download URL
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Track upload progress if callback is provided
          if (progressCallback) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressCallback(progress);
          }
        },
        (error) => {
          // Handle unsuccessful uploads
          console.error('Error uploading file:', error);
          reject(error);
        },
        async () => {
          // Handle successful uploads
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({url: downloadURL, name: fileName});
          } catch (error) {
            console.error('Error getting download URL:', error);
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error in uploadFile:', error);
    throw error;
  }
};

/**
 * Delete a file from Firebase Storage
 * @param fileUrl The URL of the file to delete
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteFile(fileUrl);
    console.log('File deleted successfully');
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};