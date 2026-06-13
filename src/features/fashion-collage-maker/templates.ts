import {
  BACKGROUND_PRESETS,
  LANDSCAPE_EXPORT_HEIGHT,
  LANDSCAPE_EXPORT_WIDTH,
  PORTRAIT_EXPORT_HEIGHT,
  PORTRAIT_EXPORT_WIDTH
} from "./constants";
import type {
  TemplateConfig,
  TemplateOrientation,
  TemplateSlot
} from "./types";

type SlotRect = Pick<TemplateSlot, "id" | "x" | "y" | "width" | "height">;

const whiteBackground = BACKGROUND_PRESETS[0].color;

function withLayerOrder(slots: readonly SlotRect[]): readonly TemplateSlot[] {
  return slots.map((slot, index) => ({
    ...slot,
    zIndex: index + 1
  }));
}

function createTemplate({
  id,
  name,
  orientation,
  slots
}: {
  id: string;
  name: string;
  orientation: TemplateOrientation;
  slots: readonly SlotRect[];
}): TemplateConfig {
  return {
    id,
    name,
    orientation,
    canvasWidth:
      orientation === "portrait" ? PORTRAIT_EXPORT_WIDTH : LANDSCAPE_EXPORT_WIDTH,
    canvasHeight:
      orientation === "portrait"
        ? PORTRAIT_EXPORT_HEIGHT
        : LANDSCAPE_EXPORT_HEIGHT,
    defaultBackground: whiteBackground,
    slots: withLayerOrder(slots)
  };
}

export const TEMPLATES = [
  createTemplate({
    id: "portrait-single",
    name: "Portrait Single",
    orientation: "portrait",
    slots: [{ id: "full", x: 0, y: 0, width: 1, height: 1 }]
  }),
  createTemplate({
    id: "portrait-grid-4",
    name: "Portrait 2 x 2",
    orientation: "portrait",
    slots: [
      { id: "top-left", x: 0, y: 0, width: 0.5, height: 0.5 },
      { id: "top-right", x: 0.5, y: 0, width: 0.5, height: 0.5 },
      { id: "bottom-left", x: 0, y: 0.5, width: 0.5, height: 0.5 },
      { id: "bottom-right", x: 0.5, y: 0.5, width: 0.5, height: 0.5 }
    ]
  }),
  createTemplate({
    id: "portrait-rows-3",
    name: "Portrait 3 Rows",
    orientation: "portrait",
    slots: [
      { id: "top", x: 0, y: 0, width: 1, height: 1 / 3 },
      { id: "middle", x: 0, y: 1 / 3, width: 1, height: 1 / 3 },
      { id: "bottom", x: 0, y: 2 / 3, width: 1, height: 1 / 3 }
    ]
  }),
  createTemplate({
    id: "portrait-rows-2",
    name: "Portrait 2 Rows",
    orientation: "portrait",
    slots: [
      { id: "top", x: 0, y: 0, width: 1, height: 0.5 },
      { id: "bottom", x: 0, y: 0.5, width: 1, height: 0.5 }
    ]
  }),
  createTemplate({
    id: "landscape-single",
    name: "Landscape Single",
    orientation: "landscape",
    slots: [{ id: "full", x: 0, y: 0, width: 1, height: 1 }]
  }),
  createTemplate({
    id: "landscape-grid-4",
    name: "Landscape 2 x 2",
    orientation: "landscape",
    slots: [
      { id: "top-left", x: 0, y: 0, width: 0.5, height: 0.5 },
      { id: "top-right", x: 0.5, y: 0, width: 0.5, height: 0.5 },
      { id: "bottom-left", x: 0, y: 0.5, width: 0.5, height: 0.5 },
      { id: "bottom-right", x: 0.5, y: 0.5, width: 0.5, height: 0.5 }
    ]
  }),
  createTemplate({
    id: "landscape-columns-2",
    name: "Landscape 2 Columns",
    orientation: "landscape",
    slots: [
      { id: "left", x: 0, y: 0, width: 0.5, height: 1 },
      { id: "right", x: 0.5, y: 0, width: 0.5, height: 1 }
    ]
  }),
  createTemplate({
    id: "landscape-grid-6",
    name: "Landscape 3 x 2",
    orientation: "landscape",
    slots: [
      { id: "top-left", x: 0, y: 0, width: 1 / 3, height: 0.5 },
      { id: "top-middle", x: 1 / 3, y: 0, width: 1 / 3, height: 0.5 },
      { id: "top-right", x: 2 / 3, y: 0, width: 1 / 3, height: 0.5 },
      { id: "bottom-left", x: 0, y: 0.5, width: 1 / 3, height: 0.5 },
      { id: "bottom-middle", x: 1 / 3, y: 0.5, width: 1 / 3, height: 0.5 },
      { id: "bottom-right", x: 2 / 3, y: 0.5, width: 1 / 3, height: 0.5 }
    ]
  })
] as const satisfies readonly TemplateConfig[];

export type TemplateId = (typeof TEMPLATES)[number]["id"];

export const DEFAULT_TEMPLATE_ID: TemplateId = "portrait-single";

export const MAX_TEMPLATE_SLOT_COUNT = Math.max(
  ...TEMPLATES.map((template) => template.slots.length)
);

export function getTemplateById(templateId: string): TemplateConfig {
  return TEMPLATES.find((template) => template.id === templateId) ?? TEMPLATES[0];
}

export function getTemplateForImageCount(imageCount: number): TemplateConfig {
  const exactMatch = TEMPLATES.find(
    (template) => template.slots.length === imageCount
  );

  if (exactMatch) {
    return exactMatch;
  }

  return (
    [...TEMPLATES]
      .filter((template) => template.slots.length < imageCount)
      .sort((first, second) => second.slots.length - first.slots.length)[0] ??
    TEMPLATES[0]
  );
}
