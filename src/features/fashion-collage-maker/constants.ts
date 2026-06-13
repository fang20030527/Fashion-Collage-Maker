import type { BackgroundPreset } from "./types";

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
export const MAX_UPLOAD_COUNT = 9;
export const MIN_UPLOAD_IMAGE_COUNT = 1;
export const MAX_TEMPLATE_IMAGE_COUNT = 6;
export const PORTRAIT_EXPORT_WIDTH = 2400;
export const PORTRAIT_EXPORT_HEIGHT = 3200;
export const LANDSCAPE_EXPORT_WIDTH = 3200;
export const LANDSCAPE_EXPORT_HEIGHT = 2400;

export const SUPPORTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
] as const;

export const BACKGROUND_PRESETS = [
  { id: "warm-white", name: "Warm White", color: "#F7F3ED" },
  { id: "soft-gray", name: "Soft Gray", color: "#E9E7E2" },
  { id: "pale-blush", name: "Pale Blush", color: "#F3E6E2" },
  { id: "ink-black", name: "Ink Black", color: "#111111" },
  { id: "olive-gray", name: "Olive Gray", color: "#777568" },
  { id: "dusty-blue", name: "Dusty Blue", color: "#DDE5EA" }
] as const satisfies readonly BackgroundPreset[];

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];
export type BackgroundPresetId = (typeof BACKGROUND_PRESETS)[number]["id"];
export type BackgroundColor = (typeof BACKGROUND_PRESETS)[number]["color"];
