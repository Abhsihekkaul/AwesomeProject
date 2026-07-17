/**
 * Browser edition of the app's pickImage policy: every photo is resized to
 * ≤1280px on its longest side and re-encoded as a JPEG data-URI, so web posts
 * carry the same payload sizes the backend's 25mb budget was designed around.
 */
export const MAX_DIMENSION = 1280;
export const MAX_PHOTOS_PER_POST = 10;

export const fileToCompressedDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that image"));
    };
    img.src = url;
  });
