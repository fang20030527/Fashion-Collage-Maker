import { describe, expect, it } from "vitest";

import { BACKGROUND_PRESETS, REQUIRED_IMAGE_COUNT } from "../constants";
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

const fourImages = ["image-1", "image-2", "image-3", "image-4"].map(image);
const fiveImages = [...fourImages, image("image-5")];

describe("editor reducer", () => {
  it("creates the initial upload state with defaults", () => {
    const state = createInitialEditorState();

    expect(state).toEqual({
      step: "upload",
      sourceImages: [],
      selectedImages: null,
      templateId: DEFAULT_TEMPLATE_ID,
      slotAdjustments: [
        { panX: 0, panY: 0, zoom: 1 },
        { panX: 0, panY: 0, zoom: 1 },
        { panX: 0, panY: 0, zoom: 1 },
        { panX: 0, panY: 0, zoom: 1 }
      ],
      backgroundColor: BACKGROUND_PRESETS[0].color,
      activeSlotIndex: null,
      exportState: "idle",
      exportBlobUrl: null
    });
    expect(state.slotAdjustments[0]).not.toBe(state.slotAdjustments[1]);
  });

  it("moves directly to edit after uploading exactly four valid images", () => {
    const { state, cleanup } = reduceEditorState(createInitialEditorState(), {
      type: "uploadCompleted",
      images: fourImages
    });

    expect(state.step).toBe("edit");
    expect(state.sourceImages).toEqual(fourImages);
    expect(state.selectedImages).toEqual(fourImages);
    expect(state.selectedImages).toHaveLength(REQUIRED_IMAGE_COUNT);
    expect(cleanup).toEqual([]);
  });

  it("moves to select after uploading five to nine valid images", () => {
    const state = editorReducer(createInitialEditorState(), {
      type: "uploadCompleted",
      images: fiveImages
    });

    expect(state.step).toBe("select");
    expect(state.sourceImages).toEqual(fiveImages);
    expect(state.selectedImages).toBeNull();
  });

  it("fills editor slots by user selection order", () => {
    const selecting = editorReducer(createInitialEditorState(), {
      type: "uploadCompleted",
      images: fiveImages
    });
    const selectedInUserOrder = [
      fiveImages[4],
      fiveImages[2],
      fiveImages[0],
      fiveImages[3]
    ];

    const state = editorReducer(selecting, {
      type: "selectImages",
      imageIds: selectedInUserOrder.map((sourceImage) => sourceImage.id)
    });

    expect(state.step).toBe("edit");
    expect(state.selectedImages).toEqual(selectedInUserOrder);
    expect(state.selectedImages).toHaveLength(REQUIRED_IMAGE_COUNT);
  });

  it("ignores selection attempts that do not choose exactly four images", () => {
    const selecting = editorReducer(createInitialEditorState(), {
      type: "uploadCompleted",
      images: fiveImages
    });

    const state = editorReducer(selecting, {
      type: "selectImages",
      imageIds: [fiveImages[0].id, fiveImages[1].id, fiveImages[2].id]
    });

    expect(state).toEqual(selecting);
  });

  it("switches template without losing images or background and resets edits", () => {
    const edited = editorReducer(
      {
        ...editorReducer(createInitialEditorState(), {
          type: "uploadCompleted",
          images: fourImages
        }),
        backgroundColor: BACKGROUND_PRESETS[3].color,
        activeSlotIndex: 2,
        slotAdjustments: [
          { panX: 0.2, panY: 0.1, zoom: 1.5 },
          { panX: -0.1, panY: 0, zoom: 1.2 },
          { panX: 0, panY: -0.3, zoom: 1.1 },
          { panX: 0.4, panY: 0.4, zoom: 0.9 }
        ]
      },
      { type: "switchTemplate", templateId: "clean-grid" }
    );

    expect(edited.templateId).toBe("clean-grid");
    expect(edited.selectedImages).toEqual(fourImages);
    expect(edited.backgroundColor).toBe(BACKGROUND_PRESETS[3].color);
    expect(edited.activeSlotIndex).toBeNull();
    expect(edited.slotAdjustments).toEqual([
      { panX: 0, panY: 0, zoom: 1 },
      { panX: 0, panY: 0, zoom: 1 },
      { panX: 0, panY: 0, zoom: 1 },
      { panX: 0, panY: 0, zoom: 1 }
    ]);
  });

  it("resets only the selected slot adjustment", () => {
    const edited = {
      ...editorReducer(createInitialEditorState(), {
        type: "uploadCompleted",
        images: fourImages
      }),
      activeSlotIndex: 1 as const,
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
      activeSlotIndex: 2 as const,
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
    expect(state.selectedImages).toHaveLength(REQUIRED_IMAGE_COUNT);
    expect(state.sourceImages).toEqual(fourImages);
    expect(state.slotAdjustments[2]).toEqual({ panX: 0, panY: 0, zoom: 1 });
  });

  it("replaces a specific slot even when another slot is active", () => {
    const replacement = image("replacement-image");
    const editing = {
      ...editorReducer(createInitialEditorState(), {
        type: "uploadCompleted",
        images: fourImages
      }),
      activeSlotIndex: 3 as const,
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
      activeSlotIndex: 3 as const
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

  it("does not return to edit when no four-image selection exists", () => {
    const selecting = editorReducer(createInitialEditorState(), {
      type: "uploadCompleted",
      images: fiveImages
    });

    const reduced = reduceEditorState(selecting, { type: "backToEdit" });

    expect(reduced.state).toEqual(selecting);
    expect(reduced.state.step).not.toBe("edit");
    expect(reduced.state.selectedImages).toBeNull();
    expect(reduced.cleanup).toEqual([]);
  });

  it("does not export to result and cleans late export URL when no four-image selection exists", () => {
    const selecting = editorReducer(createInitialEditorState(), {
      type: "uploadCompleted",
      images: fiveImages
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

  it("does not start or fail export in upload state", () => {
    const upload = createInitialEditorState();

    const started = reduceEditorState(upload, { type: "exportStarted" });
    const failed = reduceEditorState(upload, { type: "exportFailed" });

    expect(started.state).toEqual(upload);
    expect(started.cleanup).toEqual([]);
    expect(failed.state).toEqual(upload);
    expect(failed.cleanup).toEqual([]);
  });

  it("does not start or fail export in select state", () => {
    const selecting = editorReducer(createInitialEditorState(), {
      type: "uploadCompleted",
      images: fiveImages
    });

    const started = reduceEditorState(selecting, { type: "exportStarted" });
    const failed = reduceEditorState(selecting, { type: "exportFailed" });

    expect(started.state).toEqual(selecting);
    expect(started.cleanup).toEqual([]);
    expect(failed.state).toEqual(selecting);
    expect(failed.cleanup).toEqual([]);
  });

  it("starts over by clearing images, edits, active slot, and export result", () => {
    const result = {
      ...editorReducer(createInitialEditorState(), {
        type: "uploadCompleted",
        images: fourImages
      }),
      step: "result" as const,
      exportState: "success" as const,
      exportBlobUrl: "blob:export-1",
      activeSlotIndex: 1 as const,
      slotAdjustments: [
        { panX: 0.2, panY: 0.1, zoom: 1.5 },
        { panX: -0.1, panY: 0, zoom: 1.2 },
        { panX: 0, panY: -0.3, zoom: 1.1 },
        { panX: 0.4, panY: 0.4, zoom: 0.9 }
      ]
    };

    const reduced = reduceEditorState(result, { type: "startOver" });

    expect(reduced.state).toEqual(createInitialEditorState());
    expect(reduced.cleanup).toEqual([
      { type: "revokeObjectUrl", objectUrl: "blob:export-1" }
    ]);
  });
});
