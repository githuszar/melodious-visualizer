
/**
 * File Storage Service for YourMusicImage
 * 
 * Provides functions to save, retrieve, and manage generated images
 * Currently uses localStorage for persistence with preparation for Firebase integration
 */

// Add TypeScript interface for the File System Access API
interface FileSystemWritableFileStream extends WritableStream {
  write(data: any): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
}

interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>;
}

// Extend Window interface to include the File System Access API
interface ExtendedWindow extends Window {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<FileSystemFileHandle>;
}

// Constants for storage keys
const IMAGE_STORAGE_PREFIX = "music_image_";
const USER_IMAGE_COLLECTION = "user_images";

/**
 * Save image to storage (localStorage and eventually Firebase)
 */
export const saveImageLocally = async (imageData: string, userId: string): Promise<boolean> => {
  try {
    console.log(`Saving image for user ${userId}`);
    
    // Save to localStorage (temporary storage)
    localStorage.setItem(`${IMAGE_STORAGE_PREFIX}${userId}`, imageData);
    
    // Log information about the storage
    console.log(`Image saved to localStorage with key: ${IMAGE_STORAGE_PREFIX}${userId}`);
    
    // When Firebase is integrated, we would upload the image here
    // const imageUrl = await uploadToFirebase(imageData, userId);
    
    // Offer download as a fallback
    try {
      const extendedWindow = window as ExtendedWindow;
      
      // Use File System Access API if available
      if (extendedWindow.showSaveFilePicker) {
        const blob = await (await fetch(imageData)).blob();
        const handle = await extendedWindow.showSaveFilePicker({
          suggestedName: `music-image-${userId}.png`,
          types: [{
            description: 'PNG Image',
            accept: {'image/png': ['.png']},
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        console.log('File saved using File System Access API');
      }
    } catch (fsError) {
      console.log('File System Access API not available or failed, offering download instead');
      // Silently fail and continue - we'll still have the image in localStorage
    }
    
    return true;
  } catch (error) {
    console.error('Error saving image:', error);
    return false;
  }
};

/**
 * Get image from storage
 */
export const getImageFromStorage = (userId: string): string | null => {
  return localStorage.getItem(`${IMAGE_STORAGE_PREFIX}${userId}`);
};

/**
 * Download the generated image
 */
export const downloadImage = (dataUrl: string, filename = "your-music-image.png"): void => {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Delete image from storage
 */
export const deleteImageFromStorage = (userId: string): boolean => {
  try {
    localStorage.removeItem(`${IMAGE_STORAGE_PREFIX}${userId}`);
    
    // When Firebase is integrated, we would delete the image here too
    // await deleteFromFirebase(userId);
    
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

// Function to prepare for Firebase integration
// This is commented out until we add Firebase as a dependency
/*
const uploadToFirebase = async (imageData: string, userId: string): Promise<string> => {
  // Convert data URL to blob
  const response = await fetch(imageData);
  const blob = await response.blob();
  
  // Create a reference to Firebase Storage
  const storageRef = ref(storage, `${USER_IMAGE_COLLECTION}/${userId}.png`);
  
  // Upload the blob
  const snapshot = await uploadBytes(storageRef, blob);
  
  // Get the download URL
  const downloadUrl = await getDownloadURL(snapshot.ref);
  
  return downloadUrl;
};

const deleteFromFirebase = async (userId: string): Promise<void> => {
  const storageRef = ref(storage, `${USER_IMAGE_COLLECTION}/${userId}.png`);
  await deleteObject(storageRef);
};
*/
