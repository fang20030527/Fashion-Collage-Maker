import { describe, expect, it } from "vitest";

import {
  MAX_FILE_SIZE_BYTES,
  MAX_UPLOAD_COUNT,
  MIN_UPLOAD_IMAGE_COUNT
} from "../constants";
import { validateImageFiles } from "../imageValidation";

function makeFile(
  name: string,
  options: {
    size?: number;
    type?: string;
  } = {}
) {
  const size = options.size ?? 1024;
  const bytes = new Uint8Array(size);

  return new File([bytes], name, { type: options.type ?? "image/jpeg" });
}

function makeImageFiles(count: number) {
  return Array.from({ length: count }, (_, index) =>
    makeFile(`image-${index + 1}.jpg`)
  );
}

describe("validateImageFiles", () => {
  it("accepts one valid image", () => {
    const files = makeImageFiles(MIN_UPLOAD_IMAGE_COUNT);
    const result = validateImageFiles(files);

    expect(result.filesToNormalize).toEqual(files);
    expect(result.rejectedFiles).toEqual([]);
    expect(result.messages).toEqual([]);
  });

  it("accepts 2 to 9 valid images without visible errors", () => {
    for (let count = 2; count <= MAX_UPLOAD_COUNT; count += 1) {
      const files = makeImageFiles(count);
      const result = validateImageFiles(files);

      expect(result.filesToNormalize).toEqual(files);
      expect(result.rejectedFiles).toEqual([]);
      expect(result.messages).toEqual([]);
    }
  });

  it("keeps only the first 9 files and returns a visible message when too many are selected", () => {
    const files = makeImageFiles(MAX_UPLOAD_COUNT + 2);
    const result = validateImageFiles(files);

    expect(result.filesToNormalize).toEqual(files.slice(0, MAX_UPLOAD_COUNT));
    expect(result.rejectedFiles).toEqual([]);
    expect(result.messages).toEqual([
      expect.objectContaining({
        code: "too_many_images",
        message: expect.stringContaining(`Only the first ${MAX_UPLOAD_COUNT}`)
      })
    ]);
  });

  it("rejects files over 15MB", () => {
    const oversizedFile = makeFile("large.jpg", {
      size: MAX_FILE_SIZE_BYTES + 1,
      type: "image/jpeg"
    });
    const result = validateImageFiles([
      ...makeImageFiles(MIN_UPLOAD_IMAGE_COUNT),
      oversizedFile
    ]);

    expect(result.filesToNormalize).not.toContain(oversizedFile);
    expect(result.rejectedFiles).toEqual([
      expect.objectContaining({
        code: "file_too_large",
        file: oversizedFile,
        message: expect.stringContaining("larger than 15MB")
      })
    ]);
    expect(result.messages).toEqual([]);
  });

  it("rejects obvious text and PDF files as unsupported formats", () => {
    const textFile = makeFile("notes.txt", { type: "text/plain" });
    const pdfFile = makeFile("lookbook.pdf", { type: "application/pdf" });
    const result = validateImageFiles([
      ...makeImageFiles(MIN_UPLOAD_IMAGE_COUNT),
      textFile,
      pdfFile
    ]);

    expect(result.filesToNormalize).not.toContain(textFile);
    expect(result.filesToNormalize).not.toContain(pdfFile);
    expect(result.rejectedFiles).toEqual([
      expect.objectContaining({
        code: "unsupported_format",
        file: textFile,
        message: expect.stringContaining("Upload JPG, PNG, or WebP")
      }),
      expect.objectContaining({
        code: "unsupported_format",
        file: pdfFile,
        message: expect.stringContaining("Upload JPG, PNG, or WebP")
      })
    ]);
  });

  it("reports too few valid images when every file is rejected", () => {
    const rejectedFile = makeFile("brief.txt", { type: "text/plain" });
    const result = validateImageFiles([rejectedFile]);

    expect(result.filesToNormalize).toEqual([]);
    expect(result.rejectedFiles).toEqual([
      expect.objectContaining({
        code: "unsupported_format",
        file: rejectedFile
      })
    ]);
    expect(result.messages).toEqual([
      expect.objectContaining({
        code: "too_few_images",
        message: expect.stringContaining(`at least ${MIN_UPLOAD_IMAGE_COUNT}`)
      })
    ]);
  });
});
