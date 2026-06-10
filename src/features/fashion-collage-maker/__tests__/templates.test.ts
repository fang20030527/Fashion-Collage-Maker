import { describe, expect, it } from "vitest";

import { BACKGROUND_PRESETS } from "../constants";
import { TEMPLATES } from "../templates";
import type {
  EditorState,
  ExportState,
  RenderInput,
  SelectedImages,
  SlotAdjustment,
  SlotAdjustments,
  SourceImage,
  Step,
  TemplateConfig,
  TemplateSlot
} from "../types";

type Equal<Actual, Expected> = (<Value>() => Value extends Actual ? 1 : 2) extends <
  Value
>() => Value extends Expected ? 1 : 2
  ? (<Value>() => Value extends Expected ? 1 : 2) extends <Value>() => Value extends
      Actual
      ? 1
      : 2
    ? true
    : false
  : false;

type Expect<Actual extends true> = Actual;

type SpecTypeContract = [
  Expect<Equal<Step, "upload" | "select" | "edit" | "result">>,
  Expect<Equal<ExportState, "idle" | "rendering" | "success" | "error">>,
  Expect<
    Equal<
      SourceImage,
      {
        id: string;
        objectUrl: string;
        width: number;
        height: number;
        originalFileSize: number;
        mimeType: string;
      }
    >
  >,
  Expect<Equal<SlotAdjustment, { panX: number; panY: number; zoom: number }>>,
  Expect<
    Equal<
      SelectedImages,
      [SourceImage, SourceImage, SourceImage, SourceImage]
    >
  >,
  Expect<
    Equal<
      SlotAdjustments,
      [SlotAdjustment, SlotAdjustment, SlotAdjustment, SlotAdjustment]
    >
  >,
  Expect<
    Equal<
      EditorState,
      {
        step: Step;
        sourceImages: SourceImage[];
        selectedImages: SelectedImages | null;
        templateId: string;
        slotAdjustments: SlotAdjustments;
        backgroundColor: string;
        activeSlotIndex: 0 | 1 | 2 | 3 | null;
        exportState: ExportState;
        exportBlobUrl: string | null;
      }
    >
  >,
  Expect<
    Equal<
      RenderInput,
      {
        template: TemplateConfig;
        selectedImages: SelectedImages;
        slotAdjustments: SlotAdjustments;
        backgroundColor: string;
        width: number;
        height: number;
      }
    >
  >
];

const specTypeContractIsChecked = true satisfies SpecTypeContract extends readonly [
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true
]
  ? true
  : false;

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
    const sourceImage: SourceImage = {
      id: "image-1",
      objectUrl: "blob:test-image",
      width: 1200,
      height: 1600,
      originalFileSize: 1024,
      mimeType: "image/jpeg"
    };
    const selectedImages: SelectedImages = [
      sourceImage,
      sourceImage,
      sourceImage,
      sourceImage
    ];
    const slotAdjustments: SlotAdjustments = [
      { panX: 0, panY: 0, zoom: 1 },
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
      exportState: "success",
      exportBlobUrl: "blob:export"
    };
    const renderInput: RenderInput = {
      template: TEMPLATES[0],
      selectedImages,
      slotAdjustments,
      backgroundColor: editorState.backgroundColor,
      width: 2160,
      height: 2700
    };

    expect(specTypeContractIsChecked).toBe(true);
    expect(editorState.slotAdjustments[0]).toEqual({
      panX: 0,
      panY: 0,
      zoom: 1
    });
    expect(renderInput.selectedImages).toHaveLength(4);
  });

  it("defines four uniquely identified templates", () => {
    const templateIds = TEMPLATES.map((template) => template.id);

    expect(TEMPLATES).toHaveLength(4);
    expect(new Set(templateIds).size).toBe(templateIds.length);
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
