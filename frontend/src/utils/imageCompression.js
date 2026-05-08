export async function compressImageFile(file) {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  let quality = 0.7;
  let blob = await canvasToBlob(canvas, quality, file.type);

  while (blob.size > 2 * 1024 * 1024 && quality > 0.25) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, quality, file.type);
  }

  return new File([blob], file.name, { type: file.type });
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function canvasToBlob(canvas, quality, type) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, type, quality);
  });
}
