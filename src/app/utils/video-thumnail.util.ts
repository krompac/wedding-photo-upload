/**
 * Extracts a thumbnail image from a video file.
 * @param {File} file - The uploaded file
 * @param {number} [captureTime=1] - Time (in seconds) at which to capture the frame
 * @returns {Promise<string|undefined>} - Resolves to a dataURL string if video, else undefined
 */
export function getVideoThumbnail(
  file: File,
  captureTime: number = 1,
): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    // Check if file is a video
    if (!file || !file.type.startsWith('video/')) {
      resolve(undefined);
      return;
    }

    const url = URL.createObjectURL(file);
    const video = document.createElement('video');

    video.preload = 'metadata';
    video.src = url;

    // Wait until metadata is loaded to set the capture time
    video.onloadedmetadata = () => {
      // Ensure capture time is within the duration
      video.currentTime = Math.min(captureTime, video.duration - 0.1);
    };

    video.onseeked = () => {
      // Draw frame on canvas
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataURL = canvas.toDataURL('image/png');

      URL.revokeObjectURL(url);
      resolve(dataURL);
    };

    video.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
  });
}
