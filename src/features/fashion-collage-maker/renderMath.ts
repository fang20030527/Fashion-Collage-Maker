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
  assertFiniteCoordinate(slot.x, "slot x");
  assertFiniteCoordinate(slot.y, "slot y");
  assertPositiveSize(slot, "slot");

  return {
    x: slot.x * targetWidth,
    y: slot.y * targetHeight,
    width: slot.width * targetWidth,
    height: slot.height * targetHeight
  };
}

export function getMinimumCoverScale(imageSize: Size, slotSize: Size): number {
  assertPositiveSize(imageSize, "image");
  assertPositiveSize(slotSize, "slot");

  return Math.max(
    slotSize.width / imageSize.width,
    slotSize.height / imageSize.height
  );
}

/** @deprecated Use getMinimumCoverScale. */
export const getMinimumCoverZoom = getMinimumCoverScale;

export function getCoverDrawRect({
  imageSize,
  slotRect,
  adjustment
}: CoverDrawRectInput): PixelRect {
  assertPositiveSize(imageSize, "image");
  assertPositiveSize(slotRect, "slot");
  assertFiniteCoordinate(slotRect.x, "slot x");
  assertFiniteCoordinate(slotRect.y, "slot y");

  const resolvedAdjustment = sanitizeAdjustment(adjustment);
  const minimumCoverScale = getMinimumCoverScale(imageSize, slotRect);
  const userZoom = Math.max(resolvedAdjustment.zoom, 1);
  const scale = minimumCoverScale * userZoom;
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

function sanitizeAdjustment(adjustment?: Partial<SlotAdjustment>): SlotAdjustment {
  return {
    panX: sanitizeFiniteNumber(adjustment?.panX, DEFAULT_ADJUSTMENT.panX),
    panY: sanitizeFiniteNumber(adjustment?.panY, DEFAULT_ADJUSTMENT.panY),
    zoom: sanitizeFiniteNumber(adjustment?.zoom, DEFAULT_ADJUSTMENT.zoom)
  };
}

function sanitizeFiniteNumber(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function assertPositiveSize(size: Size, label: string) {
  if (!Number.isFinite(size.width) || !Number.isFinite(size.height)) {
    throw new RangeError(`${label} width and height must be finite numbers`);
  }

  if (size.width <= 0 || size.height <= 0) {
    throw new RangeError(`${label} width and height must be greater than zero`);
  }
}

function assertFiniteCoordinate(value: number, label: string) {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${label} must be a finite number`);
  }
}
