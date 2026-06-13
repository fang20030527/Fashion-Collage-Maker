import { describe, expect, it } from "vitest";

import { BACKGROUND_PRESETS, MAX_TEMPLATE_IMAGE_COUNT } from "../constants";
import {
  createInitialEditorState,
  editorReducer,
  reduceEditorState
} from "../editorReducer";
import { DEFAULT_TEMPLATE_ID } from "../templates";
import type { SourceImage } from "../types";

function image(id: string): SourceImage {
  return {
    id,
    objectUrl: `blob:${id}`,
    width: 1200,
    height: 1600,
    originalFileSize: 1024,
    mimeType: "image/jpeg"
  };
}

const oneImage = [image("image-1")];
const twoImages = ["image-1", "image-2"].map(image);
const fourImages = ["image-1", "image-2", "image-3", "image-4"].map(image);
const fiveImages = [...fourImages, image("image-5")];
const sixImages = [...fiveImages, image("image-6")];
const sevenImages = [...sixImages, image("image-7")];

describe("editor reducer", () => {
  it("creates the initial upload state with defaults", () => {
    const state = createInitialEditorState();

    expect(state).toEqual({
      step: "upload",
      sourceImages: [],
      selectedImages: null,
      templateId: DEFAULT_TEMPLATE_ID,
      slotAdjustments: [{ panX: 0, panY: 0, zoom: 1 }],
      backgroundColor: BACKGROUND_PRESETS[0].color,
      activeSlotIndex: null,
      exportState: "idle",
      exportBlobUrl: null
    });
  });

  it("moves directly to edit after uploading one valid image", () => {
    const { state, cleanup } = reduceEditorState(createInitialEditorState(), {
      type: "uploadCompleted",
      images: oneImage
    });

    expect(state.step).toBe("edit");
    expect(state.templateId).toBe("portrait-single");
    expect(state.sourceImages).toEqual(oneImage);
    expect(state.selectedImages).toEqual(oneImage);
    expect(state.slotAdjustments).toHaveLength(1);
    expect(cleanup).toEqual([]);
  });

  it("starts with the matching four-slot portrait template for four images", () => {
    const state = editorReducer(createInitialEditorState(), {
      type: "uploadCompleted",
      images: fourImages
    });

    expect(state.step).toBe("edit");
    expect(state.templateId).toBe("portrait-grid-4");
    expect(state.selectedImages).toEqual(fourImages);
    expect(state.slotAdjustments).toHaveLength(4);
  });

  it("uses the largest available regular template when five images are uploaded", () => {
    const state = editorReducer(createInitialEditorState(), {
      type: "uploadCompleted",
      images: fiveImages
    });

    expect(state.step).toBe("edit");
    expect(state.templateId).toBe("portrait-grid-4");
    expect(state.sourceImages).toEqual(fiveImages);
    expect(state.selectedImages).toEqual(fiveImages.slice(0, 4));
  });

  it("moves to select after uploading more images than any template can use", () => {
    const state = editorReducer(createInitialEditorState(), {
      type: "uploadCompleted",
      images: sevenImages
    });

    expect(state.step).toBe("select");
    expect(state.sourceImages).toEqual(sevenImages);
    expect(state.selectedImages).toBeNull();
  });

  it("fills editor slots by user selection order", () => {
    const selecting = editorReducer(createInitialEditorState(), {
      type: "uploadCompleted",
      images: sevenImages
    });
    const selectedInUserOrder = [
      sevenImages[6],
      sevenImages[2],
      sevenImages[0],
      sevenImages[3],
      sevenImages[5],
      sevenImages[1]
    ];

    const state = editorReducer(selecting, {
      type: "selectImages",
      imageIds: selectedInUserOrder.map((sourceImage) => sourceImage.id)
    });

    expect(state.step).toBe("edit");
    expect(state.templateId).toBe("landscape-grid-6");
    expect(state.sourceImages).toEqual(selectedInUserOrder);
    expect(state.selectedImages).toEqual(selectedInUserOrder);
    expect(state.selectedImages).toHaveLength(MAX_TEMPLATE_IMAGE_COUNT);
  });

  it("ignores selection attempts outside the supported template image count", () => {
    const selecting = editorReducer(createInitialEditorState(), {
      type: "uploadCompleted",
      images: sevenImages
    });

    const state = editorReducer(selecting, {
      type: "selectImages",
      imageIds: []
    });

    expect(state).toEqual(selecting);
  });

  it("switches template without losing available images or background and resets edits", () => {
    const edited = editorReducer(
      {
        ...editorReducer(createInitialEditorState(), {
          type: "uploadCompleted",
          images: sixImages
        }),
        backgroundColor: BACKGROUND_PRESETS[3].color,
        activeSlotIndex: 2,
        slotAdjustments: [
          { panX: 0.2, panY: 0.1, zoom: 1.5 },
          { panX: -0.1, panY: 0, zoom: 1.2 },
          { panX: 0, panY: -0.3, zoom: 1.1 },
          { panX: 0.4, panY: 0.4, zoom: 0.9 },
          { panX: 0.1, panY: 0.2, zoom: 1.3 },
          { panX: -0.2, panY: 0.2, zoom: 1.4 }
        ]
      },
      { type: "switchTemplate", templateId: "landscape-columns-2" }
    );

    expect(edited.templateId).toBe("landscape-columns-2");
    expect(edited.sourceImages).toEqual(sixImages);
    expect(edited.selectedImages).toEqual(sixImages.slice(0, 2));
    expect(edited.backgroundColor).toBe(BACKGROUND_PRESETS[3].color);
    expect(edited.activeSlotIndex).toBeNull();
    expect(edited.slotAdjustments).toEqual([
      { panX: 0, panY: 0, zoom: 1 },
      { panX: 0, panY: 0, zoom: 1 }
    ]);
  });

  it("ignores template switches that need more images than are available", () => {
    const editing = editorReducer(createInitialEditorState(), {
      type: "uploadCompleted",
      images: twoImages
    });

    const state = editorReducer(editing, {
      type: "switchTemplate",
      templateId: "landscape-grid-6"
    });

    expect(state).toEqual(editing);
  });

  it("resets only the selected slot adjustment", () => {
    const edited = {
      ...editorReducer(createInitialEditorState(), {
        type: "uploadCompleted",
        images: fourImages
      }),
      activeSlotIndex: 1,
      slotAdjustments: [
        { panX: 0.2, panY: 0.1, zoom: 1.5 },
        { panX: -0.1, panY: 0, zoom: 1.2 },
        { panX: 0, panY: -0.3, zoom: 1.1 },
        { panX: 0.4, panY: 0.4, zoom: 0.9 }
      ]
    };

    const state = editorReducer(edited, { type: "resetActiveSlot" });

    expect(state.slotAdjustments).toEqual([
      { panX: 0.2, panY: 0.1, zoom: 1.5 },
      { panX: 0, panY: 0, zoom: 1 },
      { panX: 0, panY: -0.3, zoom: 1.1 },
      { panX: 0.4, panY: 0.4, zoom: 0.9 }
    ]);
  });

  it("replaces only the selected slot image and resets that slot", () => {
    const replacement = image("replacement-image");
    const editing = {
      ...editorReducer(createInitialEditorState(), {
        type: "uploadCompleted",
        images: fourImages
      }),
      activeSlotIndex: 2,
      slotAdjustments: [
        { panX: 0.2, panY: 0.1, zoom: 1.5 },
        { panX: -0.1, panY: 0, zoom: 1.2 },
        { panX: 0, panY: -0.3, zoom: 1.1 },
        { panX: 0.4, panY: 0.4, zoom: 0.9 }
      ]
    };

    const state = editorReducer(editing, {
      type: "replaceActiveSlot",
      image: replacement
    });

    expect(state.selectedImages).toEqual([
      fourImages[0],
      fourImages[1],
      replacement,
      fourImages[3]
    ]);
    expect(state.sourceImages).toEqual([
      fourImages[0],
      fourImages[1],
      replacement,
      fourImages[3]
    ]);
    expect(state.slotAdjustments[2]).toEqual({ panX: 0, panY: 0, zoom: 1 });
  });

  it("replaces a specific slot even when another slot is active", () => {
    const replacement = image("replacement-image");
    const editing = {
      ...editorReducer(createInitialEditorState(), {
        type: "uploadCompleted",
        images: fourImages
      }),
      activeSlotIndex: 3,
      slotAdjustments: [
        { panX: 0.2, panY: 0.1, zoom: 1.5 },
        { panX: -0.1, panY: 0, zoom: 1.2 },
        { panX: 0, panY: -0.3, zoom: 1.1 },
        { panX: 0.4, panY: 0.4, zoom: 0.9 }
      ]
    };

    const state = editorReducer(editing, {
      type: "replaceSlot",
      slotIndex: 1,
      image: replacement
    });

    expect(state.activeSlotIndex).toBe(3);
    expect(state.selectedImages).toEqual([
      fourImages[0],
      replacement,
      fourImages[2],
      fourImages[3]
    ]);
    expect(state.slotAdjustments[1]).toEqual({ panX: 0, panY: 0, zoom: 1 });
    expect(state.slotAdjustments[3]).toEqual({ panX: 0.4, panY: 0.4, zoom: 0.9 });
  });

  it("returns from result to edit while preserving editor choices and cleaning export URL", () => {
    const result = {
      ...editorReducer(createInitialEditorState(), {
        type: "uploadCompleted",
        images: fourImages
      }),
      step: "result" as const,
      exportState: "success" as const,
      exportBlobUrl: "blob:export-1",
      activeSlotIndex: 3
    };

    const reduced = reduceEditorState(result, { type: "backToEdit" });

    expect(reduced.state.step).toBe("edit");
    expect(reduced.state.selectedImages).toEqual(fourImages);
    expect(reduced.state.activeSlotIndex).toBe(3);
    expect(reduced.state.exportState).toBe("idle");
    expect(reduced.state.exportBlobUrl).toBeNull();
    expect(reduced.cleanup).toEqual([
      { type: "revokeObjectUrl", objectUrl: "blob:export-1" }
    ]);
  });

  it("does not return to edit when no image selection exists", () => {
    const selecting = editorReducer(createInitialEditorState(), {
      type: "uploadCompleted",
      images: sevenImages
    });

    const reduced = reduceEditorState(selecting, { type: "backToEdit" });

    expect(reduced.state).toEqual(selecting);
    expect(reduced.state.step).not.toBe("edit");
    expect(reduced.state.selectedImages).toBeNull();
    expect(reduced.cleanup).toEqual([]);
  });

  it("does not export to result and cleans late export URL when no selection exists", () => {
    const selecting = editorReducer(createInitialEditorState(), {
      type: "uploadCompleted",
      images: sevenImages
    });

    const reduced = reduceEditorState(selecting, {
      type: "exportSucceeded",
      objectUrl: "blob:export-1"
    });

    expect(reduced.state).toEqual(selecting);
    expect(reduced.state.step).not.toBe("result");
    expect(reduced.state.selectedImages).toBeNull();
    expect(reduced.cleanup).toEqual([
      { type: "revokeObjectUrl", objectUrl: "blob:export-1" }
    ]);
  });
});
