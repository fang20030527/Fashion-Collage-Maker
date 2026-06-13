import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CollageRenderError,
  renderCollageToCanvas,
  type CanvasRenderInput,
  type RenderableSourceImage
} from "../canvasRenderer";
import {
  LANDSCAPE_EXPORT_HEIGHT,
  LANDSCAPE_EXPORT_WIDTH,
  PORTRAIT_EXPORT_HEIGHT,
  PORTRAIT_EXPORT_WIDTH
} from "../constants";
import { TEMPLATES } from "../templates";
import type { TemplateConfig } from "../types";

type RecordedCall = {
  name: string;
  args: unknown[];
};

function makeImage(id: string, element: CanvasImageSource): RenderableSourceImage {
  return {
    id,
    objectUrl: `blob:${id}`,
    width: 1200,
    height: 1800,
    originalFileSize: 1024,
    mimeType: "image/jpeg",
    element
  };
}

function makeImages(count: number): RenderableSourceImage[] {
  return Array.from({ length: count }, (_, index) =>
    makeImage(`image-${index + 1}`, {
      tag: `image-${index + 1}`
    } as unknown as CanvasImageSource)
  );
}

function makeAdjustments(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    panX: index === 1 ? 0.1 : 0,
    panY: index === 2 ? -0.1 : 0,
    zoom: index === 3 ? 1.2 : 1
  }));
}

function makeInput(
  template: TemplateConfig =
    TEMPLATES.find((candidate) => candidate.id === "landscape-grid-6") ??
    TEMPLATES[0],
  selectedImages: CanvasRenderInput["selectedImages"] = makeImages(
    template.slots.length
  )
): CanvasRenderInput {
  return {
    template,
    selectedImages,
    slotAdjustments: makeAdjustments(template.slots.length),
    backgroundColor: "#F7F3ED"
  };
}

function installMockCanvas({
  drawImage = () => undefined,
  contextAvailable = true
}: {
  drawImage?: () => void;
  contextAvailable?: boolean;
} = {}) {
  const calls: RecordedCall[] = [];
  const record = (name: string, args: unknown[] = []) => {
    calls.push({ name, args });
  };
  const context = {
    save: vi.fn(() => record("save")),
    restore: vi.fn(() => record("restore")),
    translate: vi.fn((...args: unknown[]) => record("translate", args)),
    rotate: vi.fn((...args: unknown[]) => record("rotate", args)),
    beginPath: vi.fn(() => record("beginPath")),
    rect: vi.fn((...args: unknown[]) => record("rect", args)),
    clip: vi.fn(() => record("clip")),
    fillRect: vi.fn((...args: unknown[]) => record("fillRect", args)),
    strokeRect: vi.fn((...args: unknown[]) => record("strokeRect", args)),
    drawImage: vi.fn((...args: unknown[]) => {
      record("drawImage", args);
      drawImage();
    }),
    set fillStyle(value: string | CanvasGradient | CanvasPattern) {
      record("fillStyle", [value]);
    },
    set strokeStyle(value: string | CanvasGradient | CanvasPattern) {
      record("strokeStyle", [value]);
    },
    set lineWidth(value: number) {
      record("lineWidth", [value]);
    },
    set shadowColor(value: string) {
      record("shadowColor", [value]);
    },
    set shadowBlur(value: number) {
      record("shadowBlur", [value]);
    },
    set shadowOffsetX(value: number) {
      record("shadowOffsetX", [value]);
    },
    set shadowOffsetY(value: number) {
      record("shadowOffsetY", [value]);
    }
  } as unknown as CanvasRenderingContext2D;
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => (contextAvailable ? context : null))
  } as unknown as HTMLCanvasElement;

  vi.spyOn(document, "createElement").mockReturnValue(canvas);

  return { calls, canvas, context };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("fashion collage canvas renderer", () => {
  it("renders to the active template export dimensions", async () => {
    const { canvas } = installMockCanvas();
    const template =
      TEMPLATES.find((candidate) => candidate.id === "landscape-grid-6") ??
      TEMPLATES[0];

    const renderedCanvas = await renderCollageToCanvas(makeInput(template));

    expect(renderedCanvas).toBe(canvas);
    expect(canvas.width).toBe(LANDSCAPE_EXPORT_WIDTH);
    expect(canvas.height).toBe(LANDSCAPE_EXPORT_HEIGHT);
  });

  it("uses portrait dimensions for portrait templates", async () => {
    const { canvas } = installMockCanvas();
    const template =
      TEMPLATES.find((candidate) => candidate.id === "portrait-rows-3") ??
      TEMPLATES[0];

    await renderCollageToCanvas(makeInput(template));

    expect(canvas.width).toBe(PORTRAIT_EXPORT_WIDTH);
    expect(canvas.height).toBe(PORTRAIT_EXPORT_HEIGHT);
  });

  it("fills the solid background before drawing clipped image slots", async () => {
    const { calls } = installMockCanvas();
    const input = makeInput();

    await renderCollageToCanvas(input);

    expect(calls.slice(0, 2)).toEqual([
      { name: "fillStyle", args: ["#F7F3ED"] },
      {
        name: "fillRect",
        args: [0, 0, input.template.canvasWidth, input.template.canvasHeight]
      }
    ]);
    expect(calls.filter((call) => call.name === "drawImage")).toHaveLength(6);
    expect(calls.filter((call) => call.name === "clip")).toHaveLength(6);
    expect(calls.filter((call) => call.name === "save")).toHaveLength(12);
    expect(calls.filter((call) => call.name === "restore")).toHaveLength(12);

    const firstClipIndex = calls.findIndex((call) => call.name === "clip");
    const firstDrawIndex = calls.findIndex((call) => call.name === "drawImage");

    expect(firstClipIndex).toBeGreaterThan(0);
    expect(firstDrawIndex).toBeGreaterThan(firstClipIndex);
  });

  it("draws regular grid templates without shadows or white borders", async () => {
    const { calls } = installMockCanvas();

    await renderCollageToCanvas(makeInput());

    expect(calls.filter((call) => call.name === "shadowColor")).toHaveLength(0);
    expect(calls.filter((call) => call.name === "strokeStyle")).toHaveLength(0);
    expect(calls.filter((call) => call.name === "lineWidth")).toHaveLength(0);
    expect(calls.filter((call) => call.name === "strokeRect")).toHaveLength(0);
  });

  it("draws image layers by template z-index rather than slot array order", async () => {
    const { calls } = installMockCanvas();
    const layerTemplate: TemplateConfig = {
      id: "z-index-test",
      name: "Z-index Test",
      orientation: "portrait",
      canvasWidth: PORTRAIT_EXPORT_WIDTH,
      canvasHeight: PORTRAIT_EXPORT_HEIGHT,
      defaultBackground: "#F7F3ED",
      slots: [
        { id: "layer-1", x: 0, y: 0, width: 0.4, height: 0.4, zIndex: 3 },
        { id: "layer-2", x: 0, y: 0, width: 0.4, height: 0.4, zIndex: 1 },
        { id: "layer-3", x: 0, y: 0, width: 0.4, height: 0.4, zIndex: 4 },
        { id: "layer-4", x: 0, y: 0, width: 0.4, height: 0.4, zIndex: 2 }
      ]
    };

    await renderCollageToCanvas(makeInput(layerTemplate, makeImages(4)));

    const drawnImageTags = calls
      .filter((call) => call.name === "drawImage")
      .map((call) => (call.args[0] as { tag: string }).tag);

    expect(drawnImageTags).toEqual(["image-2", "image-4", "image-1", "image-3"]);
  });

  it("throws export_failed when a selected image has no drawable source", async () => {
    installMockCanvas();
    const template =
      TEMPLATES.find((candidate) => candidate.id === "portrait-grid-4") ??
      TEMPLATES[0];
    const images: CanvasRenderInput["selectedImages"] = [
      ...makeImages(3),
      {
        id: "missing",
        objectUrl: "",
        width: 1200,
        height: 1800,
        originalFileSize: 1024,
        mimeType: "image/jpeg"
      }
    ];

    await expect(renderCollageToCanvas(makeInput(template, images))).rejects
      .toMatchObject({
        code: "export_failed"
      });
  });

  it("throws export_failed when runtime input is missing a selected image", async () => {
    installMockCanvas();
    const template =
      TEMPLATES.find((candidate) => candidate.id === "portrait-grid-4") ??
      TEMPLATES[0];
    const malformedInput = {
      ...makeInput(template),
      selectedImages: makeImages(3)
    } as unknown as CanvasRenderInput;

    await expect(renderCollageToCanvas(malformedInput)).rejects.toBeInstanceOf(
      CollageRenderError
    );
    await expect(renderCollageToCanvas(malformedInput)).rejects.toMatchObject({
      code: "export_failed"
    });
  });

  it("throws export_failed when canvas drawing rejects an image", async () => {
    const { calls } = installMockCanvas({
      drawImage: () => {
        throw new Error("draw failed");
      }
    });
    const render = renderCollageToCanvas(makeInput());

    await expect(render).rejects.toBeInstanceOf(CollageRenderError);
    await expect(render).rejects.toMatchObject({ code: "export_failed" });

    const drawIndex = calls.findIndex((call) => call.name === "drawImage");
    const restoreAfterDrawIndex = calls.findIndex(
      (call, index) => index > drawIndex && call.name === "restore"
    );

    expect(drawIndex).toBeGreaterThan(-1);
    expect(restoreAfterDrawIndex).toBeGreaterThan(drawIndex);
  });

  it("throws export_failed when a 2d canvas context cannot be created", async () => {
    installMockCanvas({ contextAvailable: false });

    await expect(renderCollageToCanvas(makeInput())).rejects.toMatchObject({
      code: "export_failed"
    });
  });
});
