export interface CompressedImageResult {
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  dataBase64: string;
  width: number;
  height: number;
  sizeBytes: number;
  previewUrl: string;
}

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_INPUT_FILE_BYTES = 15 * 1024 * 1024; // 15 MB raw input
const TARGET_MAX_OUTPUT_BYTES = 450 * 1024; // 450 KB persisted in Firestore media doc
const MAX_DIMENSION = 1280;

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Não foi possível ler a imagem selecionada.'));
    };
    img.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Falha ao comprimir a imagem.'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIndex = result.indexOf(',');
      if (commaIndex === -1) {
        reject(new Error('Falha ao codificar imagem.'));
        return;
      }
      resolve(result.slice(commaIndex + 1));
    };
    reader.onerror = () => reject(new Error('Erro ao ler dados da imagem.'));
    reader.readAsDataURL(blob);
  });
}

export async function compressImageFile(file: File): Promise<CompressedImageResult> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(
      'Formato não suportado. Envie imagens em JPEG, PNG ou WebP.'
    );
  }
  if (file.size > MAX_INPUT_FILE_BYTES) {
    throw new Error(
      'Arquivo muito grande (limite de 15 MB por foto antes da compressão).'
    );
  }

  const img = await loadImageElement(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Navegador sem suporte a processamento de imagem.');
  }
  ctx.drawImage(img, 0, 0, width, height);

  // Prefer WebP for best quality/size ratio; fallback to JPEG if browser lacks WebP encode
  let targetMime: 'image/webp' | 'image/jpeg' = 'image/webp';
  let blob = await canvasToBlob(canvas, targetMime, 0.84);
  if (blob.type !== 'image/webp') {
    targetMime = 'image/jpeg';
    blob = await canvasToBlob(canvas, targetMime, 0.84);
  }

  const qualitySteps = [0.74, 0.64, 0.52];
  for (const q of qualitySteps) {
    if (blob.size <= TARGET_MAX_OUTPUT_BYTES) break;
    blob = await canvasToBlob(canvas, targetMime, q);
  }

  if (blob.size > 680 * 1024) {
    // Secondary resize pass if still too large
    const smallCanvas = document.createElement('canvas');
    smallCanvas.width = Math.max(1, Math.round(width * 0.7));
    smallCanvas.height = Math.max(1, Math.round(height * 0.7));
    const smallCtx = smallCanvas.getContext('2d');
    if (smallCtx) {
      smallCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
      blob = await canvasToBlob(smallCanvas, targetMime, 0.72);
    }
  }

  if (blob.size > 680 * 1024) {
    throw new Error(
      'A imagem continua muito pesada após compressão. Tente outra fotografia.'
    );
  }

  const dataBase64 = await blobToBase64(blob);
  const previewUrl = `data:${targetMime};base64,${dataBase64}`;

  return {
    mimeType: targetMime,
    dataBase64,
    width,
    height,
    sizeBytes: blob.size,
    previewUrl,
  };
}
