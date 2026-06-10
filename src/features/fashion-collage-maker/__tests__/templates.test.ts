import { describe, expect, it } from "vitest";

import { BACKGROUND_PRESETS } from "../constants";
import { getTemplateById, TEMPLATES } from "../templates";
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

function slotsOverlap(
  first: TemplateSlot,
  second: TemplateSlot
) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

describe("collage templates", () => {
  it("keeps the domain type contract aligned with the MVP spec", () => {
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
    const selectedImages: SelectedImages = [
      sourceImage,
      sourceImage,
      sourceImage,
      sourceImage
    ];
    const slotAdjustments: SlotAdjustments = [
      slotAdjustment,
      { panX: 0.1, panY: -0.1, zoom: 1.2 },
      { panX: -0.05, panY: 0, zoom: 1 },
      { panX: 0, panY: 0.08, zoom: 0.95 }
    ];
    const editorState: EditorState = {
      step: "select",
      sourceImages: selectedImages,
      selectedImages,
      templateId: TEMPLATES[0].id,
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
    const nonNullSlotAdjustments: SlotAdjustments = editorState.slotAdjustments;
    const activeSlotIndex: EditorState["activeSlotIndex"] = 3;
    const exportBlobUrl: EditorState["exportBlobUrl"] = editorState.exportBlobUrl;
    const renderInput: RenderInput = {
      template: TEMPLATES[0],
      selectedImages,
      slotAdjustments: nonNullSlotAdjustments,
      backgroundColor: editorState.backgroundColor,
      width: 2160,
      height: 2700
    };

    expect(stepWithSelect).toBe("select");
    expect(requiredSourceImageFields.originalFileSize).toBe(1024);
    expect(requiredSlotAdjustmentFields).toEqual(slotAdjustment);
    expect(activeSlotIndex).toBe(3);
    expect(exportBlobUrl).toBe("blob:export");
    expect(renderInput.selectedImages).toHaveLength(4);
  });

  it("defines four uniquely identified templates", () => {
    const templateIds = TEMPLATES.map((template) => template.id);

    expect(TEMPLATES).toHaveLength(4);
    expect(new Set(templateIds).size).toBe(templateIds.length);
  });

  it("finds templates from a string id and falls back to the default template", () => {
    expect(getTemplateById("clean-grid").id).toBe("clean-grid");
    expect(getTemplateById("template-id-from-editor-state").id).toBe(
      TEMPLATES[0].id
    );
  });

  it("keeps every template browser-independent and renderable", () => {
    for (const template of TEMPLATES) {
      expect(template.thumbnailSrc).toMatch(
        /^\/fashion-collage\/templates\/.+\.png$/
      );
      expect(presetColors.has(template.defaultBackground)).toBe(true);
      expect(template.slots).toHaveLength(4);

      const slotIds = template.slots.map((slot) => slot.id);
      expect(new Set(slotIds).size).toBe(slotIds.length);

      for (const slot of template.slots) {
        expect(slot.x).toBeGreaterThanOrEqual(0);
        expect(slot.y).toBeGreaterThanOrEqual(0);
        expect(slot.width).toBeGreaterThan(0);
        expect(slot.height).toBeGreaterThan(0);
        expect(slot.x + slot.width).toBeLessThanOrEqual(1);
        expect(slot.y + slot.height).toBeLessThanOrEqual(1);
      }
    }
  });

  it("includes an editorial template with a dominant hero slot", () => {
    const editorialHero = TEMPLATES.find(
      (template) => template.id === "editorial-hero"
    );

    expect(editorialHero).toBeDefined();
    expect(editorialHero?.slots.some((slot) => slot.width * slot.height > 0.35))
      .toBe(true);
  });

  it("includes an overlapped print template with rotation and shadow", () => {
    const overlappedPrint = TEMPLATES.find(
      (template) => template.id === "overlapped-print"
    );

    expect(overlappedPrint).toBeDefined();
    expect(
      overlappedPrint?.slots.some((slot, index, slots) =>
        slots.some(
          (candidate, candidateIndex) =>
            candidateIndex !== index && slotsOverlap(slot, candidate)
        )
      )
    ).toBe(true);
    expect(
      overlappedPrint?.slots.some(
        (slot) => "rotation" in slot && Math.abs(slot.rotation) > 0
      )
    ).toBe(true);
    expect(overlappedPrint?.slots.some((slot) => "shadow" in slot)).toBe(true);
  });

  it("includes a restrained, grid-like template", () => {
    const cleanGrid = TEMPLATES.find((template) => template.id === "clean-grid");

    expect(cleanGrid).toBeDefined();
    expect(
      cleanGrid?.slots.every(
        (slot) => !("rotation" in slot) && !("shadow" in slot)
      )
    ).toBe(true);
    expect(new Set(cleanGrid?.slots.map((slot) => slot.width)).size).toBe(1);
    expect(new Set(cleanGrid?.slots.map((slot) => slot.height)).size).toBe(1);
  });
});
