export type ExifOrientation = 1 | 3 | 6 | 8;

const JPEG_START_OF_IMAGE = 0xffd8;
const JPEG_START_OF_SCAN = 0xffda;
const JPEG_END_OF_IMAGE = 0xffd9;
const JPEG_APP1 = 0xffe1;
const EXIF_HEADER = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00] as const;
const TIFF_BIG_ENDIAN = 0x4d4d;
const TIFF_LITTLE_ENDIAN = 0x4949;
const TIFF_MAGIC = 0x002a;
const ORIENTATION_TAG = 0x0112;
const SHORT_TYPE = 3;

export function parseExifOrientation(buffer: ArrayBuffer): ExifOrientation | null {
  const view = new DataView(buffer);

  if (view.byteLength < 4 || view.getUint16(0) !== JPEG_START_OF_IMAGE) {
    return null;
  }

  let offset = 2;

  while (offset + 4 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) {
      return null;
    }

    const marker = view.getUint16(offset);

    if (marker === JPEG_START_OF_SCAN || marker === JPEG_END_OF_IMAGE) {
      return null;
    }

    const segmentLength = view.getUint16(offset + 2);
    const segmentStart = offset + 4;
    const segmentEnd = offset + 2 + segmentLength;

    if (segmentLength < 2 || segmentEnd > view.byteLength) {
      return null;
    }

    if (marker === JPEG_APP1 && hasExifHeader(view, segmentStart, segmentEnd)) {
      return parseTiffOrientation(view, segmentStart + EXIF_HEADER.length, segmentEnd);
    }

    offset = segmentEnd;
  }

  return null;
}

function hasExifHeader(view: DataView, offset: number, end: number) {
  if (offset + EXIF_HEADER.length > end) {
    return false;
  }

  return EXIF_HEADER.every((byte, index) => view.getUint8(offset + index) === byte);
}

function parseTiffOrientation(
  view: DataView,
  tiffOffset: number,
  segmentEnd: number
): ExifOrientation | null {
  if (tiffOffset + 8 > segmentEnd) {
    return null;
  }

  const byteOrder = view.getUint16(tiffOffset);
  const littleEndian =
    byteOrder === TIFF_LITTLE_ENDIAN ? true : byteOrder === TIFF_BIG_ENDIAN ? false : null;

  if (littleEndian === null || view.getUint16(tiffOffset + 2, littleEndian) !== TIFF_MAGIC) {
    return null;
  }

  const firstIfdOffset = view.getUint32(tiffOffset + 4, littleEndian);
  const ifdOffset = tiffOffset + firstIfdOffset;

  if (firstIfdOffset < 8 || ifdOffset + 2 > segmentEnd) {
    return null;
  }

  const entryCount = view.getUint16(ifdOffset, littleEndian);
  const entriesOffset = ifdOffset + 2;

  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = entriesOffset + index * 12;

    if (entryOffset + 12 > segmentEnd) {
      return null;
    }

    const tag = view.getUint16(entryOffset, littleEndian);

    if (tag !== ORIENTATION_TAG) {
      continue;
    }

    const type = view.getUint16(entryOffset + 2, littleEndian);
    const count = view.getUint32(entryOffset + 4, littleEndian);

    if (type !== SHORT_TYPE || count !== 1) {
      return null;
    }

    return toSupportedOrientation(view.getUint16(entryOffset + 8, littleEndian));
  }

  return null;
}

function toSupportedOrientation(value: number): ExifOrientation | null {
  if (value === 1 || value === 3 || value === 6 || value === 8) {
    return value;
  }

  return null;
}
