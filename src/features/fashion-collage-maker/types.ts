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
  zIndex: number;
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

export type TemplateOrientation = "portrait" | "landscape";

export type TemplateConfig = {
  id: string;
  name: string;
  orientation: TemplateOrientation;
  canvasWidth: number;
  canvasHeight: number;
  defaultBackground: string;
  slots: readonly TemplateSlot[];
};

export type SelectedImages = SourceImage[];

export type SlotAdjustments = SlotAdjustment[];

export type EditorState = {
  step: Step;
  sourceImages: SourceImage[];
  selectedImages: SelectedImages | null;
  templateId: string;
  slotAdjustments: SlotAdjustments;
  backgroundColor: string;
  activeSlotIndex: number | null;
  exportState: ExportState;
  exportBlobUrl: string | null;
};

export type RenderInput = {
  template: TemplateConfig;
  selectedImages: SelectedImages;
  slotAdjustments: SlotAdjustments;
  backgroundColor: string;
};
