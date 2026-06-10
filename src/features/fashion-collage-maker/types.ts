export type Step = "upload" | "edit" | "result";

export type ExportState = "idle" | "rendering" | "ready" | "error";

export type SourceImage = {
  id: string;
  file: File;
  objectUrl: string;
  name: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
};

export type SlotAdjustment = {
  imageId: string;
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number;
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

export type SelectedImages = readonly [
  SourceImage,
  SourceImage,
  SourceImage,
  SourceImage
];

export type SlotAdjustments = readonly [
  SlotAdjustment,
  SlotAdjustment,
  SlotAdjustment,
  SlotAdjustment
];

export type EditorState = {
  step: Step;
  exportState: ExportState;
  sourceImages: SourceImage[];
  selectedImages: SelectedImages | null;
  templateId: string;
  backgroundColor: string;
  slotAdjustments: SlotAdjustments | null;
};

export type RenderInput = {
  template: TemplateConfig;
  selectedImages: SelectedImages;
  slotAdjustments: SlotAdjustments;
  backgroundColor: string;
  width: number;
  height: number;
};
