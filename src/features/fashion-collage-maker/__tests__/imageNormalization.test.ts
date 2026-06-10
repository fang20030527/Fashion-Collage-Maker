import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import { normalizeImageFile, normalizeImageFiles } from "../imageNormalization";
import type {
  ImageNormalizationResult,
  ImageNormalizationSuccess
} from "../imageNormalization";
import type { SourceImage } from "../types";

type HasOriginalFile = SourceImage extends { file: File } ? true : false;
type HasOriginalName = SourceImage extends { name: string } ? true : false;
type HasOriginalFilename = SourceImage extends { filename: string } ? true : false;

function makeJpegFileWithOrientation(orientation: 1 | 3 | 6 | 8) {
  const bytes = new Uint8Array([
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

  return new File([bytes], "photo.jpg", { type: "image/jpeg" });
}

function installMockCanvas(toBlobResult: Blob | null) {
  const drawImage = vi.fn();
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ({
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      drawImage
    })),
    toBlob: vi.fn((callback: BlobCallback) => callback(toBlobResult))
  } as unknown as HTMLCanvasElement;

  vi.spyOn(document, "createElement").mockReturnValue(canvas);

  return { canvas, drawImage };
}

function installMockImageDecode(shouldDecode: boolean) {
  class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    width = 100;
    height = 50;

    set src(_value: string) {
      queueMicrotask(() => {
        if (shouldDecode) {
          this.onload?.();
        } else {
          this.onerror?.();
        }
      });
    }
  }

  vi.stubGlobal("Image", MockImage);
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("image normalization boundary", () => {
  it("exports a batch normalization helper for upload integration", () => {
    expect(typeof normalizeImageFiles).toBe("function");
  });

  it("exposes successful normalized images as SourceImage only", () => {
    expectTypeOf<ImageNormalizationSuccess["image"]>().toEqualTypeOf<SourceImage>();
    expectTypeOf<Extract<ImageNormalizationResult, { ok: true }>["image"]>()
      .toEqualTypeOf<SourceImage>();
  });

  it("keeps original File objects and filenames out of SourceImage", () => {
    expectTypeOf<HasOriginalFile>().toEqualTypeOf<false>();
    expectTypeOf<HasOriginalName>().toEqualTypeOf<false>();
    expectTypeOf<HasOriginalFilename>().toEqualTypeOf<false>();
  });

  it("returns unsupported_format and revokes the temporary fallback URL when decode fails", async () => {
    const file = new File(["not an image"], "notes.txt", { type: "text/plain" });
    const revokeObjectUrl = vi.fn();

    vi.stubGlobal("createImageBitmap", undefined);
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:temp"),
      revokeObjectURL: revokeObjectUrl
    });
    installMockImageDecode(false);

    const result = await normalizeImageFile(file);

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        code: "unsupported_format",
        file
      })
    );
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:temp");
  });

  it("returns normalization_failed when canvas blob creation fails", async () => {
    const file = makeJpegFileWithOrientation(1);
    const close = vi.fn();

    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({ width: 100, height: 50, close }))
    );
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:normalized"),
      revokeObjectURL: vi.fn()
    });
    installMockCanvas(null);

    const result = await normalizeImageFile(file);

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        code: "normalization_failed",
        file
      })
    );
    expect(close).toHaveBeenCalledOnce();
  });

  it("revokes the HTML fallback URL and skips manual EXIF rotation after fallback decode", async () => {
    const file = makeJpegFileWithOrientation(6);
    const outputBlob = new Blob(["normalized"], { type: "image/jpeg" });
    const createObjectUrl = vi
      .fn()
      .mockReturnValueOnce("blob:temp")
      .mockReturnValueOnce("blob:normalized");
    const revokeObjectUrl = vi.fn();
    const { canvas, drawImage } = installMockCanvas(outputBlob);

    vi.stubGlobal("createImageBitmap", undefined);
    vi.stubGlobal("URL", {
      createObjectURL: createObjectUrl,
      revokeObjectURL: revokeObjectUrl
    });
    installMockImageDecode(true);

    const result = await normalizeImageFile(file);

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        image: expect.objectContaining({
          objectUrl: "blob:normalized",
          width: 100,
          height: 50
        })
      })
    );
    expect(canvas.width).toBe(100);
    expect(canvas.height).toBe(50);
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 100, 50);
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:temp");
    expect(revokeObjectUrl).not.toHaveBeenCalledWith("blob:normalized");
  });
});
