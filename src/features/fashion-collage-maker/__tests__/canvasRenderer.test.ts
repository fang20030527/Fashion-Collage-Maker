import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CollageRenderError,
  renderCollageToCanvas,
  type CanvasRenderInput,
  type RenderableSourceImage
} from "../canvasRenderer";
import { EXPORT_HEIGHT, EXPORT_WIDTH } from "../constants";
import { TEMPLATES } from "../templates";

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

function makeInput(
  selectedImages: CanvasRenderInput["selectedImages"] = [
    makeImage("image-1", { tag: "image-1" } as unknown as CanvasImageSource),
    makeImage("image-2", { tag: "image-2" } as unknown as CanvasImageSource),
    makeImage("image-3", { tag: "image-3" } as unknown as CanvasImageSource),
    makeImage("image-4", { tag: "image-4" } as unknown as CanvasImageSource)
  ]
): CanvasRenderInput {
  return {
    template: TEMPLATES[2],
    selectedImages,
    slotAdjustments: [
      { panX: 0, panY: 0, zoom: 1 },
      { panX: 0.1, panY: -0.1, zoom: 1.2 },
      { panX: -0.15, panY: 0.2, zoom: 1.1 },
      { panX: 0, panY: 0, zoom: 1 }
    ],
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
  it("renders to the export canvas dimensions", async () => {
    const { canvas } = installMockCanvas();

    const renderedCanvas = await renderCollageToCanvas(makeInput());

    expect(renderedCanvas).toBe(canvas);
    expect(canvas.width).toBe(EXPORT_WIDTH);
    expect(canvas.height).toBe(EXPORT_HEIGHT);
  });

  it("fills the solid background before drawing clipped image slots", async () => {
    const { calls } = installMockCanvas();

    await renderCollageToCanvas(makeInput());

    expect(calls.slice(0, 2)).toEqual([
      { name: "fillStyle", args: ["#F7F3ED"] },
      { name: "fillRect", args: [0, 0, EXPORT_WIDTH, EXPORT_HEIGHT] }
    ]);
    expect(calls.filter((call) => call.name === "drawImage")).toHaveLength(4);
    expect(calls.filter((call) => call.name === "clip")).toHaveLength(4);
    expect(calls.filter((call) => call.name === "save")).toHaveLength(7);
    expect(calls.filter((call) => call.name === "restore")).toHaveLength(7);

    const firstClipIndex = calls.findIndex((call) => call.name === "clip");
    const firstDrawIndex = calls.findIndex((call) => call.name === "drawImage");

    expect(firstClipIndex).toBeGreaterThan(0);
    expect(firstDrawIndex).toBeGreaterThan(firstClipIndex);
  });

  it("applies template rotation, shadows, and borders when slots request them", async () => {
    const { calls } = installMockCanvas();

    await renderCollageToCanvas(makeInput());

    expect(calls.some((call) => call.name === "rotate" && call.args[0] !== 0))
      .toBe(true);
    expect(calls.filter((call) => call.name === "shadowColor")).toHaveLength(3);
    expect(calls.filter((call) => call.name === "strokeStyle")).toHaveLength(4);
    expect(calls.filter((call) => call.name === "lineWidth")).toHaveLength(4);
    expect(calls.filter((call) => call.name === "strokeRect")).toHaveLength(4);
  });

  it("throws export_failed when a selected image has no drawable source", async () => {
    installMockCanvas();
    const images: CanvasRenderInput["selectedImages"] = [
      makeImage("image-1", { tag: "image-1" } as unknown as CanvasImageSource),
      makeImage("image-2", { tag: "image-2" } as unknown as CanvasImageSource),
      makeImage("image-3", { tag: "image-3" } as unknown as CanvasImageSource),
      {
        id: "missing",
        objectUrl: "",
        width: 1200,
        height: 1800,
        originalFileSize: 1024,
        mimeType: "image/jpeg"
      }
    ];

    await expect(renderCollageToCanvas(makeInput(images))).rejects.toMatchObject({
      code: "export_failed"
    });
  });

  it("throws export_failed when runtime input is missing a selected image", async () => {
    installMockCanvas();
    const malformedInput = {
      ...makeInput(),
      selectedImages: [
        makeImage("image-1", { tag: "image-1" } as unknown as CanvasImageSource),
        makeImage("image-2", { tag: "image-2" } as unknown as CanvasImageSource),
        makeImage("image-3", { tag: "image-3" } as unknown as CanvasImageSource)
      ]
    } as unknown as CanvasRenderInput;

    await expect(renderCollageToCanvas(malformedInput)).rejects.toBeInstanceOf(
      CollageRenderError
    );
    await expect(renderCollageToCanvas(malformedInput)).rejects.toMatchObject({
      code: "export_failed"
    });
  });

  it("throws export_failed when canvas drawing rejects an image", async () => {
    installMockCanvas({
      drawImage: () => {
        throw new Error("draw failed");
      }
    });

    await expect(renderCollageToCanvas(makeInput())).rejects.toBeInstanceOf(
      CollageRenderError
    );
  });

  it("throws export_failed when a 2d canvas context cannot be created", async () => {
    installMockCanvas({ contextAvailable: false });

    await expect(renderCollageToCanvas(makeInput())).rejects.toMatchObject({
      code: "export_failed"
    });
  });
});
