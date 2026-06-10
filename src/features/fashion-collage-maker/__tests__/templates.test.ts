import { describe, expect, it } from "vitest";

import { BACKGROUND_PRESETS } from "../constants";
import { TEMPLATES } from "../templates";

const presetColors = new Set(BACKGROUND_PRESETS.map((preset) => preset.color));

function slotsOverlap(
  first: (typeof TEMPLATES)[number]["slots"][number],
  second: (typeof TEMPLATES)[number]["slots"][number]
) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

describe("collage templates", () => {
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
      overlappedPrint?.slots.some((slot) => Math.abs(slot.rotation ?? 0) > 0)
    ).toBe(true);
    expect(overlappedPrint?.slots.some((slot) => slot.shadow)).toBe(true);
  });

  it("includes a restrained, grid-like template", () => {
    const cleanGrid = TEMPLATES.find((template) => template.id === "clean-grid");

    expect(cleanGrid).toBeDefined();
    expect(cleanGrid?.slots.every((slot) => !slot.rotation && !slot.shadow)).toBe(
      true
    );
    expect(new Set(cleanGrid?.slots.map((slot) => slot.width)).size).toBe(1);
    expect(new Set(cleanGrid?.slots.map((slot) => slot.height)).size).toBe(1);
  });
});
