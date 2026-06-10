import type { SlotAdjustment, TemplateSlot } from "./types";

export type PixelRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Size = {
  width: number;
  height: number;
};

export type CoverDrawRectInput = {
  imageSize: Size;
  slotRect: PixelRect;
  adjustment?: Partial<SlotAdjustment>;
};

const DEFAULT_ADJUSTMENT: SlotAdjustment = {
  panX: 0,
  panY: 0,
  zoom: 1
};

export function slotToPixelRect(
  slot: TemplateSlot,
  targetWidth: number,
  targetHeight: number
): PixelRect {
  assertPositiveSize({ width: targetWidth, height: targetHeight }, "target");

  return {
    x: slot.x * targetWidth,
    y: slot.y * targetHeight,
    width: slot.width * targetWidth,
    height: slot.height * targetHeight
  };
}

export function getMinimumCoverZoom(imageSize: Size, slotSize: Size): number {
  assertPositiveSize(imageSize, "image");
  assertPositiveSize(slotSize, "slot");

  return Math.max(
    slotSize.width / imageSize.width,
    slotSize.height / imageSize.height
  );
}

export function getCoverDrawRect({
  imageSize,
  slotRect,
  adjustment
}: CoverDrawRectInput): PixelRect {
  assertPositiveSize(imageSize, "image");
  assertPositiveSize(slotRect, "slot");

  const resolvedAdjustment = {
    ...DEFAULT_ADJUSTMENT,
    ...adjustment
  };
  const minimumCoverZoom = getMinimumCoverZoom(imageSize, slotRect);
  const userZoom = Math.max(resolvedAdjustment.zoom, 1);
  const scale = minimumCoverZoom * userZoom;
  const drawSize = {
    width: imageSize.width * scale,
    height: imageSize.height * scale
  };

  return {
    x: getClampedAxisStart({
      slotStart: slotRect.x,
      slotLength: slotRect.width,
      drawLength: drawSize.width,
      pan: resolvedAdjustment.panX
    }),
    y: getClampedAxisStart({
      slotStart: slotRect.y,
      slotLength: slotRect.height,
      drawLength: drawSize.height,
      pan: resolvedAdjustment.panY
    }),
    width: drawSize.width,
    height: drawSize.height
  };
}

function getClampedAxisStart({
  slotStart,
  slotLength,
  drawLength,
  pan
}: {
  slotStart: number;
  slotLength: number;
  drawLength: number;
  pan: number;
}): number {
  const centeredStart = slotStart + (slotLength - drawLength) / 2;
  // Pan is normalized to the slot size: 1 moves the image center by one slot length.
  const requestedStart = centeredStart + pan * slotLength;
  const minStart = slotStart + slotLength - drawLength;
  const maxStart = slotStart;

  return clamp(requestedStart, minStart, maxStart);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function assertPositiveSize(size: Size, label: string) {
  if (size.width <= 0 || size.height <= 0) {
    throw new RangeError(`${label} width and height must be greater than zero`);
  }
}
