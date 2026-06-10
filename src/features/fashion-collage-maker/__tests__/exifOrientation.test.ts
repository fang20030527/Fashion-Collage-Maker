import { describe, expect, it } from "vitest";

import { parseExifOrientation } from "../exifOrientation";

function bytesToArrayBuffer(bytes: number[]) {
  return new Uint8Array(bytes).buffer;
}

function jpegWithoutExif() {
  return bytesToArrayBuffer([0xff, 0xd8, 0xff, 0xd9]);
}

function jpegWithOrientation(orientation: 1 | 3 | 6 | 8) {
  return bytesToArrayBuffer([
    0xff,
    0xd8,
    0xff,
    0xe1,
    0x00,
    0x22,
    0x45,
    0x78,
    0x69,
    0x66,
    0x00,
    0x00,
    0x49,
    0x49,
    0x2a,
    0x00,
    0x08,
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x12,
    0x01,
    0x03,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    orientation,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00
  ]);
}

describe("parseExifOrientation", () => {
  it("returns null when JPEG has no EXIF orientation", () => {
    expect(parseExifOrientation(jpegWithoutExif())).toBeNull();
  });

  it("parses EXIF orientation 1", () => {
    expect(parseExifOrientation(jpegWithOrientation(1))).toBe(1);
  });

  it("parses EXIF orientation 3", () => {
    expect(parseExifOrientation(jpegWithOrientation(3))).toBe(3);
  });

  it("parses EXIF orientation 6", () => {
    expect(parseExifOrientation(jpegWithOrientation(6))).toBe(6);
  });

  it("parses EXIF orientation 8", () => {
    expect(parseExifOrientation(jpegWithOrientation(8))).toBe(8);
  });
});
