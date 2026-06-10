import { describe, expect, it } from "vitest";

import {
  MAX_FILE_SIZE_BYTES,
  MAX_UPLOAD_COUNT,
  REQUIRED_IMAGE_COUNT
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
  it("accepts exactly 4 valid images", () => {
    const files = makeImageFiles(REQUIRED_IMAGE_COUNT);
    const result = validateImageFiles(files);

    expect(result.filesToNormalize).toEqual(files);
    expect(result.rejectedFiles).toEqual([]);
    expect(result.messages).toEqual([]);
  });

  it("accepts 5 to 9 valid images without visible errors", () => {
    for (let count = 5; count <= MAX_UPLOAD_COUNT; count += 1) {
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
      ...makeImageFiles(REQUIRED_IMAGE_COUNT),
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
      ...makeImageFiles(REQUIRED_IMAGE_COUNT),
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

  it("reports mixed accepted and rejected files with too few valid images", () => {
    const acceptedFiles = [
      makeFile("front.png", { type: "image/png" }),
      makeFile("detail.webp", { type: "image/webp" }),
      makeFile("mobile.heic", { type: "image/heic" })
    ];
    const rejectedFile = makeFile("brief.txt", { type: "text/plain" });
    const result = validateImageFiles([...acceptedFiles, rejectedFile]);

    expect(result.filesToNormalize).toEqual(acceptedFiles);
    expect(result.rejectedFiles).toEqual([
      expect.objectContaining({
        code: "unsupported_format",
        file: rejectedFile
      })
    ]);
    expect(result.messages).toEqual([
      expect.objectContaining({
        code: "too_few_images",
        message: expect.stringContaining(`at least ${REQUIRED_IMAGE_COUNT}`)
      })
    ]);
  });
});
