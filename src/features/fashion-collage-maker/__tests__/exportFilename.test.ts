import { describe, expect, it } from "vitest";

import { formatExportFilename } from "../exportFilename";

describe("formatExportFilename", () => {
  it("formats a local January date with padded month and day", () => {
    expect(formatExportFilename(new Date(2026, 0, 5))).toBe(
      "fashion-collage-20260105.png"
    );
  });

  it("formats a local double-digit month and day", () => {
    expect(formatExportFilename(new Date(2026, 10, 15))).toBe(
      "fashion-collage-20261115.png"
    );
  });
});
