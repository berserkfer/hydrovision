/**
 * Extracción de RGB promedio de una foto — siguiendo HydroColor: promedia los píxeles de un
 * recuadro centrado en la imagen (los autores usan 200×200 px para cámaras de 12MP; aquí se
 * usa una fracción del lado más corto para que escale con cualquier resolución de cámara).
 *
 * Separado en dos capas a propósito:
 *  - `averageRgbFromImageData` es una función PURA (recibe un objeto con forma de ImageData:
 *    {width, height, data}) — se puede probar con datos sintéticos sin un canvas real.
 *  - `extractCenterAverageRgbFromCanvas` es la envoltura de navegador que sí usa
 *    HTMLCanvasElement/getContext('2d') — nunca se ejecuta en tests.
 */

import type { RgbMeans } from "./hydrocolor-formula";

/** Mismo shape que ImageData del DOM, sin depender de él — para poder probarlo en Node. */
export interface ImageDataLike {
  width: number;
  height: number;
  data: ArrayLike<number>; // RGBA, 4 valores por píxel
}

export const DEFAULT_CENTER_BOX_FRACTION = 0.15;

/**
 * Promedia los canales R, G, B de un recuadro centrado en la imagen. Ignora el canal alfa.
 * Retorna null si la imagen es demasiado pequeña para tener un recuadro válido.
 */
export function averageRgbFromImageData(
  image: ImageDataLike,
  boxFraction: number = DEFAULT_CENTER_BOX_FRACTION
): RgbMeans | null {
  const { width, height, data } = image;
  if (width <= 0 || height <= 0) return null;

  const boxSize = Math.max(1, Math.floor(Math.min(width, height) * boxFraction));
  const startX = Math.floor((width - boxSize) / 2);
  const startY = Math.floor((height - boxSize) / 2);
  if (boxSize <= 0 || startX < 0 || startY < 0) return null;

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let count = 0;

  for (let y = startY; y < startY + boxSize; y += 1) {
    for (let x = startX; x < startX + boxSize; x += 1) {
      const idx = (y * width + x) * 4;
      if (idx + 2 >= data.length) continue;
      sumR += data[idx];
      sumG += data[idx + 1];
      sumB += data[idx + 2];
      count += 1;
    }
  }

  if (count === 0) return null;

  return {
    r: Number((sumR / count).toFixed(3)),
    g: Number((sumG / count).toFixed(3)),
    b: Number((sumB / count).toFixed(3)),
  };
}

/**
 * Envoltura de navegador — dibuja el HTMLImageElement/ImageBitmap en un canvas temporal y
 * delega el promedio a la función pura de arriba. Solo se ejecuta en el cliente.
 */
export async function extractCenterAverageRgbFromCanvas(
  source: CanvasImageSource,
  naturalWidth: number,
  naturalHeight: number,
  boxFraction: number = DEFAULT_CENTER_BOX_FRACTION
): Promise<RgbMeans | null> {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = naturalWidth;
  canvas.height = naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, naturalWidth, naturalHeight);
  const boxSize = Math.max(1, Math.floor(Math.min(naturalWidth, naturalHeight) * boxFraction));
  const startX = Math.floor((naturalWidth - boxSize) / 2);
  const startY = Math.floor((naturalHeight - boxSize) / 2);
  const imageData = ctx.getImageData(startX, startY, boxSize, boxSize);
  return averageRgbFromImageData(
    { width: imageData.width, height: imageData.height, data: imageData.data },
    1 // ya recortamos el recuadro al leer con getImageData — promediar el 100% de esto
  );
}
