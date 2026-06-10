import { describe, expect, expectTypeOf, it } from "vitest";

import { normalizeImageFiles } from "../imageNormalization";
import type {
  ImageNormalizationResult,
  ImageNormalizationSuccess
} from "../imageNormalization";
import type { SourceImage } from "../types";

type HasOriginalFile = SourceImage extends { file: File } ? true : false;
type HasOriginalName = SourceImage extends { name: string } ? true : false;
type HasOriginalFilename = SourceImage extends { filename: string } ? true : false;

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
});
