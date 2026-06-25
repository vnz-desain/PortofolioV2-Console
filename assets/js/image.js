/* ═══════════════════════════════════════════════════════════
   IMAGE.JS — Compress + convert to WebP ≤500KB via Canvas
   Tidak butuh library eksternal — pure browser API
═══════════════════════════════════════════════════════════ */

const MAX_SIZE_BYTES = 500 * 1024; // 500KB
const MAX_DIMENSION  = 1920;       // max width atau height

/**
 * Compress + convert File/Blob ke WebP ≤500KB
 * @param {File} file - File gambar input (jpg/png/webp/gif)
 * @returns {Promise<Blob>} WebP blob ≤500KB
 */
async function compressToWebP(file) {
  // Load image ke HTMLImageElement
  const img = await loadImage(file);

  // Hitung dimensi baru (scale down kalau > MAX_DIMENSION)
  let { width, height } = calcDimensions(img.naturalWidth, img.naturalHeight);

  // Binary search untuk quality yang menghasilkan ≤500KB
  const blob = await findQuality(img, width, height);
  return blob;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img  = new Image();
    img.onload  = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

function calcDimensions(w, h) {
  if (w <= MAX_DIMENSION && h <= MAX_DIMENSION) return { width: w, height: h };
  const ratio = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h);
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

function renderToBlob(img, width, height, quality) {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas');
    canvas.width  = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    canvas.toBlob(blob => resolve(blob), 'image/webp', quality);
  });
}

async function findQuality(img, width, height) {
  // Coba quality 0.9 dulu
  let blob = await renderToBlob(img, width, height, 0.9);
  if (blob.size <= MAX_SIZE_BYTES) return blob;

  // Binary search quality antara 0.1 dan 0.9
  let lo = 0.1, hi = 0.85, best = blob;
  for (let i = 0; i < 8; i++) {
    const mid = (lo + hi) / 2;
    blob = await renderToBlob(img, width, height, mid);
    if (blob.size <= MAX_SIZE_BYTES) { best = blob; lo = mid; }
    else { hi = mid; }
    if (hi - lo < 0.02) break;
  }

  // Kalau masih > 500KB, scale down dimensi
  if (best.size > MAX_SIZE_BYTES) {
    const scale = Math.sqrt(MAX_SIZE_BYTES / best.size) * 0.9;
    const w2 = Math.round(width  * scale);
    const h2 = Math.round(height * scale);
    best = await renderToBlob(img, w2, h2, 0.75);
  }

  return best;
}

/**
 * Buat preview URL dari Blob
 */
function createPreviewURL(blob) {
  return URL.createObjectURL(blob);
}

/**
 * Convert Blob ke File dengan nama yang benar
 */
function blobToFile(blob, originalName) {
  const baseName = originalName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-');
  const fileName = `${baseName}-${Date.now()}.webp`;
  return new File([blob], fileName, { type: 'image/webp' });
}

/**
 * Format ukuran file untuk display
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export { compressToWebP, blobToFile, createPreviewURL, formatBytes };
