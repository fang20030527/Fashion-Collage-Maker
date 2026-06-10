export type Step = "upload" | "select" | "edit" | "result";

export type ExportState = "idle" | "rendering" | "success" | "error";

export type SourceImage = {
  id: string;
  objectUrl: string;
  width: number;
  height: number;
  originalFileSize: number;
  mimeType: string;
};

export type SlotAdjustment = {
  panX: number;
  panY: number;
  zoom: number;
};

export type BackgroundPreset = {
  id: string;
  name: string;
  color: string;
};

export type TemplateSlot = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  borderColor?: string;
  borderWidth?: number;
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
};

export type TemplateConfig = {
  id: string;
  name: string;
  thumbnailSrc: string;
  defaultBackground: string;
  slots: readonly [TemplateSlot, TemplateSlot, TemplateSlot, TemplateSlot];
};

export type SelectedImages = [
  SourceImage,
  SourceImage,
  SourceImage,
  SourceImage
];

export type SlotAdjustments = [
  SlotAdjustment,
  SlotAdjustment,
  SlotAdjustment,
  SlotAdjustment
];

export type EditorState = {
  step: Step;
  sourceImages: SourceImage[];
  selectedImages: SelectedImages | null;
  templateId: string;
  slotAdjustments: SlotAdjustments;
  backgroundColor: string;
  activeSlotIndex: 0 | 1 | 2 | 3 | null;
  exportState: ExportState;
  exportBlobUrl: string | null;
};

export type RenderInput = {
  template: TemplateConfig;
  selectedImages: SelectedImages;
  slotAdjustments: SlotAdjustments;
  backgroundColor: string;
  width: number;
  height: number;
};
