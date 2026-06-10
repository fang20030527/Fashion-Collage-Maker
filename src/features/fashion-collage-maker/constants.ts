import type { BackgroundPreset } from "./types";

export const EXPORT_WIDTH = 2160;
export const EXPORT_HEIGHT = 2700;
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
export const MAX_UPLOAD_COUNT = 9;
export const REQUIRED_IMAGE_COUNT = 4;

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
