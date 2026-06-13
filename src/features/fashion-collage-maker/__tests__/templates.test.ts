import { describe, expect, it } from "vitest";

import {
  BACKGROUND_PRESETS,
  LANDSCAPE_EXPORT_HEIGHT,
  LANDSCAPE_EXPORT_WIDTH,
  PORTRAIT_EXPORT_HEIGHT,
  PORTRAIT_EXPORT_WIDTH
} from "../constants";
import {
  getTemplateById,
  getTemplateForImageCount,
  MAX_TEMPLATE_SLOT_COUNT,
  TEMPLATES
} from "../templates";
import type {
  EditorState,
  ExportState,
  RenderInput,
  SelectedImages,
  SlotAdjustment,
  SlotAdjustments,
  SourceImage,
  Step,
  TemplateSlot
} from "../types";

const presetColors = new Set(BACKGROUND_PRESETS.map((preset) => preset.color));

function slotsOverlap(first: TemplateSlot, second: TemplateSlot) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

function getSlotArea(slot: TemplateSlot) {
  return slot.width * slot.height;
}

describe("collage templates", () => {
  it("keeps the domain type contract aligned with variable templates", () => {
    const stepWithSelect: Step = "select";
    const successfulExport: ExportState = "success";
    const sourceImage: SourceImage = {
      id: "image-1",
      objectUrl: "blob:test-image",
      width: 1200,
      height: 1600,
      originalFileSize: 1024,
      mimeType: "image/jpeg"
    };
    const slotAdjustment: SlotAdjustment = { panX: 0, panY: 0, zoom: 1 };
    const selectedImages: SelectedImages = [sourceImage, sourceImage];
    const slotAdjustments: SlotAdjustments = [
      slotAdjustment,
      { panX: 0.1, panY: -0.1, zoom: 1.2 }
    ];
    const editorState: EditorState = {
      step: "select",
      sourceImages: selectedImages,
      selectedImages,
      templateId: "portrait-rows-2",
      slotAdjustments,
      backgroundColor: BACKGROUND_PRESETS[0].color,
      activeSlotIndex: 0,
      exportState: successfulExport,
      exportBlobUrl: "blob:export"
    };
    const requiredSourceImageFields: Pick<
      SourceImage,
      "objectUrl" | "width" | "height" | "originalFileSize" | "mimeType"
    > = sourceImage;
    const requiredSlotAdjustmentFields: Pick<
      SlotAdjustment,
      "panX" | "panY" | "zoom"
    > = slotAdjustment;
    const renderInput: RenderInput = {
      template: getTemplateById(editorState.templateId),
      selectedImages,
      slotAdjustments,
      backgroundColor: editorState.backgroundColor
    };

    expect(stepWithSelect).toBe("select");
    expect(requiredSourceImageFields.originalFileSize).toBe(1024);
    expect(requiredSlotAdjustmentFields).toEqual(slotAdjustment);
    expect(editorState.activeSlotIndex).toBe(0);
    expect(editorState.exportBlobUrl).toBe("blob:export");
    expect(renderInput.selectedImages).toHaveLength(2);
  });

  it("defines the eight requested portrait and landscape templates", () => {
    expect(
      TEMPLATES.map((template) => ({
        id: template.id,
        orientation: template.orientation,
        slots: template.slots.length
      }))
    ).toEqual([
      { id: "portrait-single", orientation: "portrait", slots: 1 },
      { id: "portrait-grid-4", orientation: "portrait", slots: 4 },
      { id: "portrait-rows-3", orientation: "portrait", slots: 3 },
      { id: "portrait-rows-2", orientation: "portrait", slots: 2 },
      { id: "landscape-single", orientation: "landscape", slots: 1 },
      { id: "landscape-grid-4", orientation: "landscape", slots: 4 },
      { id: "landscape-columns-2", orientation: "landscape", slots: 2 },
      { id: "landscape-grid-6", orientation: "landscape", slots: 6 }
    ]);

    const templateIds = TEMPLATES.map((template) => template.id);

    expect(new Set(templateIds).size).toBe(templateIds.length);
    expect(templateIds).not.toContain("cutout-poster");
    expect(MAX_TEMPLATE_SLOT_COUNT).toBe(6);
  });

  it("finds templates from a string id and falls back to the default template", () => {
    expect(getTemplateById("landscape-grid-6").id).toBe("landscape-grid-6");
    expect(getTemplateById("template-id-from-editor-state").id).toBe(
      TEMPLATES[0].id
    );
  });

  it("chooses a sensible starting template by image count", () => {
    expect(getTemplateForImageCount(1).id).toBe("portrait-single");
    expect(getTemplateForImageCount(2).id).toBe("portrait-rows-2");
    expect(getTemplateForImageCount(3).id).toBe("portrait-rows-3");
    expect(getTemplateForImageCount(4).id).toBe("portrait-grid-4");
    expect(getTemplateForImageCount(5).id).toBe("portrait-grid-4");
    expect(getTemplateForImageCount(6).id).toBe("landscape-grid-6");
  });

  it("keeps every template browser-independent and renderable", () => {
    for (const template of TEMPLATES) {
      expect(presetColors.has(template.defaultBackground)).toBe(true);

      if (template.orientation === "portrait") {
        expect(template.canvasWidth).toBe(PORTRAIT_EXPORT_WIDTH);
        expect(template.canvasHeight).toBe(PORTRAIT_EXPORT_HEIGHT);
      } else {
        expect(template.canvasWidth).toBe(LANDSCAPE_EXPORT_WIDTH);
        expect(template.canvasHeight).toBe(LANDSCAPE_EXPORT_HEIGHT);
      }

      const slotIds = template.slots.map((slot) => slot.id);
      expect(new Set(slotIds).size).toBe(slotIds.length);

      for (const slot of template.slots) {
        expect(slot.x).toBeGreaterThanOrEqual(0);
        expect(slot.y).toBeGreaterThanOrEqual(0);
        expect(slot.width).toBeGreaterThan(0);
        expect(slot.height).toBeGreaterThan(0);
        expect(slot.x + slot.width).toBeLessThanOrEqual(1);
        expect(slot.y + slot.height).toBeLessThanOrEqual(1);
        expect(slot.zIndex).toBeGreaterThan(0);
      }
    }
  });

  it("uses regular cut-free grid compositions", () => {
    for (const template of TEMPLATES) {
      const totalArea = template.slots.reduce(
        (sum, slot) => sum + getSlotArea(slot),
        0
      );

      expect(totalArea).toBeCloseTo(1);
      expect(
        template.slots.some((slot, index, slots) =>
          slots.some(
            (candidate, candidateIndex) =>
              candidateIndex !== index && slotsOverlap(slot, candidate)
          )
        )
      ).toBe(false);
      expect(template.slots.every((slot) => slot.rotation === undefined)).toBe(true);
      expect(template.slots.every((slot) => slot.shadow === undefined)).toBe(true);
      expect(template.slots.every((slot) => slot.borderColor === undefined))
        .toBe(true);
      expect(template.slots.every((slot) => slot.borderWidth === undefined))
        .toBe(true);
    }
  });

  it("keeps layer order explicit for click and export behavior", () => {
    for (const template of TEMPLATES) {
      const zIndexes = template.slots.map((slot) => slot.zIndex);

      expect(zIndexes).toEqual(
        Array.from({ length: template.slots.length }, (_, index) => index + 1)
      );
    }
  });
});
