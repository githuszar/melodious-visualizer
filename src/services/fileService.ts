
/**
 * Save file to local filesystem
 * Note: This can only work in a Node.js environment, not in the browser
 * For the MVP, we'll simulate this functionality
 */
export const saveImageLocally = async (imageData: string, userId: string): Promise<boolean> => {
  try {
    // In a real application with a backend, we would:
    // 1. Send the image data to the backend
    // 2. Have the backend save it to the filesystem
    
    // For the MVP demo in browser environment, we'll log this
    console.log(`[File Service] Would save image for user ${userId} to /Users/thiago/Desktop/GitHuszar/YourMusicImge/${userId}.png`);
    
    // We'll also save to localStorage to simulate persistence
    localStorage.setItem(`user_image_${userId}`, imageData);
    
    // For demonstration, if we're in a development environment with the right APIs,
    // we can try to use the File System Access API (supported in some modern browsers)
    if (window.showSaveFilePicker && process.env.NODE_ENV === 'development') {
      try {
        const blob = await (await fetch(imageData)).blob();
        const handle = await window.showSaveFilePicker({
          suggestedName: `music-image-${userId}.png`,
          types: [{
            description: 'PNG Image',
            accept: {'image/png': ['.png']},
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        console.log('File saved successfully through File System Access API');
      } catch (fsError) {
        console.error('File System Access API failed:', fsError);
        // Fall back to download
        downloadImage(imageData, `music-image-${userId}.png`);
      }
    } else {
      // Fallback to downloading the file
      downloadImage(imageData, `music-image-${userId}.png`);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving image locally:', error);
    return false;
  }
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
