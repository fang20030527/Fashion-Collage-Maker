import { describe, expect, it } from "vitest";

import {
  getCoverDrawRect,
  getMinimumCoverZoom,
  slotToPixelRect,
  type PixelRect
} from "../renderMath";
import { TEMPLATES } from "../templates";
import type { TemplateSlot } from "../types";

function expectSlotCovered(drawRect: PixelRect, slotRect: PixelRect) {
  expect(drawRect.x).toBeLessThanOrEqual(slotRect.x);
  expect(drawRect.y).toBeLessThanOrEqual(slotRect.y);
  expect(drawRect.x + drawRect.width).toBeGreaterThanOrEqual(
    slotRect.x + slotRect.width
  );
  expect(drawRect.y + drawRect.height).toBeGreaterThanOrEqual(
    slotRect.y + slotRect.height
  );
}

function expectRectCloseTo(actual: PixelRect, expected: PixelRect) {
  expect(actual.x).toBeCloseTo(expected.x);
  expect(actual.y).toBeCloseTo(expected.y);
  expect(actual.width).toBeCloseTo(expected.width);
  expect(actual.height).toBeCloseTo(expected.height);
}

describe("fashion collage render math", () => {
  it("converts normalized slots to pixel rectangles for export dimensions", () => {
    const slot: TemplateSlot = {
      id: "hero",
      x: 0.08,
      y: 0.06,
      width: 0.58,
      height: 0.64
    };

    expect(slotToPixelRect(slot, 2160, 2700)).toEqual({
      x: 172.8,
      y: 162,
      width: 1252.8,
      height: 1728
    });
  });

  it("cover-fits a landscape image in a portrait slot without exposed gaps", () => {
    const slotRect: PixelRect = { x: 100, y: 80, width: 300, height: 600 };
    const drawRect = getCoverDrawRect({
      imageSize: { width: 1600, height: 900 },
      slotRect,
      adjustment: { panX: 0, panY: 0, zoom: 1 }
    });

    expectRectCloseTo(drawRect, {
      x: -283.33333333333326,
      y: 80,
      width: 1066.6666666666665,
      height: 600
    });
    expectSlotCovered(drawRect, slotRect);
  });

  it("cover-fits a portrait image in a landscape slot without exposed gaps", () => {
    const slotRect: PixelRect = { x: 25, y: 40, width: 700, height: 280 };
    const drawRect = getCoverDrawRect({
      imageSize: { width: 900, height: 1600 },
      slotRect,
      adjustment: { panX: 0, panY: 0, zoom: 1 }
    });

    expectRectCloseTo(drawRect, {
      x: 25,
      y: -442.22222222222223,
      width: 700,
      height: 1244.4444444444443
    });
    expectSlotCovered(drawRect, slotRect);
  });

  it("uses zoom as a multiplier above the minimum cover scale", () => {
    const imageSize = { width: 1000, height: 500 };
    const slotRect: PixelRect = { x: 0, y: 0, width: 300, height: 300 };

    expect(getMinimumCoverZoom(imageSize, slotRect)).toBe(0.6);

    const drawRect = getCoverDrawRect({
      imageSize,
      slotRect,
      adjustment: { panX: 0, panY: 0, zoom: 1.5 }
    });

    expectRectCloseTo(drawRect, {
      x: -300,
      y: -75,
      width: 900,
      height: 450
    });
    expectSlotCovered(drawRect, slotRect);
  });

  it("clamps zoom below one to minimum cover", () => {
    const slotRect: PixelRect = { x: 0, y: 0, width: 300, height: 300 };
    const drawRect = getCoverDrawRect({
      imageSize: { width: 1000, height: 500 },
      slotRect,
      adjustment: { panX: 0, panY: 0, zoom: 0.2 }
    });

    expectRectCloseTo(drawRect, {
      x: -150,
      y: 0,
      width: 600,
      height: 300
    });
    expectSlotCovered(drawRect, slotRect);
  });

  it("applies normalized pan offsets and clamps them before gaps appear", () => {
    const slotRect: PixelRect = { x: 100, y: 200, width: 400, height: 300 };
    const drawRect = getCoverDrawRect({
      imageSize: { width: 1000, height: 500 },
      slotRect,
      adjustment: { panX: 1, panY: -1, zoom: 1.5 }
    });

    expectRectCloseTo(drawRect, {
      x: 100,
      y: 50,
      width: 900,
      height: 450
    });
    expectSlotCovered(drawRect, slotRect);
  });

  it("returns draw rectangles in the target canvas coordinate space", () => {
    const slotRect = slotToPixelRect(TEMPLATES[0].slots[0], 2160, 2700);
    const drawRect = getCoverDrawRect({
      imageSize: { width: 1200, height: 1800 },
      slotRect,
      adjustment: { panX: 0.25, panY: -0.25, zoom: 1.2 }
    });

    expect(slotRect).toEqual({
      x: 172.8,
      y: 162,
      width: 1252.8,
      height: 1728
    });
    expectRectCloseTo(drawRect, {
      x: 172.8,
      y: -365.04,
      width: 1503.36,
      height: 2255.04
    });
    expectSlotCovered(drawRect, slotRect);
  });
});
