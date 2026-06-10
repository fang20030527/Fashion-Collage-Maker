import { SUPPORTED_MIME_TYPES } from "./constants";
import { parseExifOrientation, type ExifOrientation } from "./exifOrientation";
import type { SourceImage } from "./types";

export const NORMALIZED_MAX_LONG_EDGE = 3000;

export type ImageNormalizationErrorCode =
  | "unsupported_format"
  | "normalization_failed";

export type ImageNormalizationResult =
  | ImageNormalizationSuccess
  | ImageNormalizationFailure;

export type ImageNormalizationSuccess = { ok: true; image: SourceImage };

export type ImageNormalizationFailure = {
  ok: false;
  code: ImageNormalizationErrorCode;
  message: string;
  file: File;
};

type DecodedImage = CanvasImageSource & {
  width: number;
  height: number;
  close?: () => void;
};

const supportedMimeTypes = new Set<string>(SUPPORTED_MIME_TYPES);
let fallbackIdCounter = 0;

export async function normalizeImageFile(file: File): Promise<ImageNormalizationResult> {
  const orientation = await readExifOrientation(file);
  const decoded = await decodeImage(file);

  if (!decoded) {
    return {
      ok: false,
      code: "unsupported_format",
      file,
      message: `${file.name || "This file"} could not be decoded as an image.`
    };
  }

  try {
    const normalized = await renderNormalizedImage(
      file,
      decoded.image,
      decoded.manualOrientation ? orientation : null
    );

    return {
      ok: true,
      image: normalized
    };
  } catch {
    return {
      ok: false,
      code: "normalization_failed",
      file,
      message: `${file.name || "This file"} could not be prepared for editing.`
    };
  } finally {
    decoded.image.close?.();
    decoded.objectUrlToRevoke && URL.revokeObjectURL(decoded.objectUrlToRevoke);
  }
}

export async function normalizeImageFiles(
  files: Iterable<File>
): Promise<ImageNormalizationResult[]> {
  // Upload UI should pass only successful result.image SourceImages into editor state.
  return Promise.all(Array.from(files, normalizeImageFile));
}

async function readExifOrientation(file: File): Promise<ExifOrientation | null> {
  if (!isJpegFile(file)) {
    return null;
  }

  try {
    return parseExifOrientation(await file.arrayBuffer());
  } catch {
    return null;
  }
}

function isJpegFile(file: File) {
  const type = file.type.toLowerCase();

  return type === "image/jpeg" || type === "image/jpg" || /\.(jpe?g)$/i.test(file.name);
}

async function decodeImage(file: File): Promise<{
  image: DecodedImage;
  objectUrlToRevoke: string | null;
  manualOrientation: boolean;
} | null> {
  if (typeof createImageBitmap === "function") {
    try {
      const imageBitmap = await createImageBitmap(file, { imageOrientation: "none" });

      return {
        image: imageBitmap,
        objectUrlToRevoke: null,
        manualOrientation: true
      };
    } catch {
      // Fall through to Image decoding for browsers without full createImageBitmap support.
    }
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await decodeHtmlImage(objectUrl);

    return {
      image,
      objectUrlToRevoke: objectUrl,
      manualOrientation: false
    };
  } catch {
    URL.revokeObjectURL(objectUrl);
    return null;
  }
}

function decodeHtmlImage(objectUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image decode failed"));
    image.src = objectUrl;
  });
}

async function renderNormalizedImage(
  file: File,
  image: DecodedImage,
  orientation: ExifOrientation | null
): Promise<SourceImage> {
  const orientedSize = getOrientedSize(image.width, image.height, orientation);
  const scale = Math.min(
    1,
    NORMALIZED_MAX_LONG_EDGE / Math.max(orientedSize.width, orientedSize.height)
  );
  const outputWidth = Math.max(1, Math.round(orientedSize.width * scale));
  const outputHeight = Math.max(1, Math.round(orientedSize.height * scale));
  const canvas = document.createElement("canvas");

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context unavailable");
  }

  drawOrientedImage(context, image, orientation, outputWidth, outputHeight);

  const blob = await canvasToBlob(canvas, getCanvasMimeType(file));

  if (!blob) {
    throw new Error("Canvas blob creation failed");
  }

  const objectUrl = URL.createObjectURL(blob);

  return {
    id: createSourceImageId(),
    objectUrl,
    width: outputWidth,
    height: outputHeight,
    originalFileSize: file.size,
    mimeType: blob.type || getCanvasMimeType(file)
  };
}

function getOrientedSize(
  width: number,
  height: number,
  orientation: ExifOrientation | null
) {
  if (orientation === 6 || orientation === 8) {
    return { width: height, height: width };
  }

  return { width, height };
}

function drawOrientedImage(
  context: CanvasRenderingContext2D,
  image: DecodedImage,
  orientation: ExifOrientation | null,
  outputWidth: number,
  outputHeight: number
) {
  context.save();

  switch (orientation) {
    case 3:
      context.translate(outputWidth, outputHeight);
      context.rotate(Math.PI);
      context.drawImage(image, 0, 0, outputWidth, outputHeight);
      break;
    case 6:
      context.translate(outputWidth, 0);
      context.rotate(Math.PI / 2);
      context.drawImage(image, 0, 0, outputHeight, outputWidth);
      break;
    case 8:
      context.translate(0, outputHeight);
      context.rotate(-Math.PI / 2);
      context.drawImage(image, 0, 0, outputHeight, outputWidth);
      break;
    case 1:
    default:
      context.drawImage(image, 0, 0, outputWidth, outputHeight);
      break;
  }

  context.restore();
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType);
  });
}

function getCanvasMimeType(file: File) {
  const mimeType = file.type.toLowerCase();

  if (supportedMimeTypes.has(mimeType)) {
    return mimeType;
  }

  return "image/jpeg";
}

function createSourceImageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  fallbackIdCounter += 1;

  return `source-image-${fallbackIdCounter}`;
}
