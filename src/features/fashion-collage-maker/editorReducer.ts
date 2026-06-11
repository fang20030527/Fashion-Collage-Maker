import {
  BACKGROUND_PRESETS,
  MAX_UPLOAD_COUNT,
  REQUIRED_IMAGE_COUNT
} from "./constants";
import { DEFAULT_TEMPLATE_ID, getTemplateById } from "./templates";
import type {
  EditorState,
  SelectedImages,
  SlotAdjustment,
  SlotAdjustments,
  SourceImage
} from "./types";

export type EditorCleanup = {
  type: "revokeObjectUrl";
  objectUrl: string;
};

export type EditorAction =
  | { type: "uploadCompleted"; images: SourceImage[] }
  | { type: "selectImages"; imageIds: string[] }
  | { type: "switchTemplate"; templateId: string }
  | { type: "changeBackground"; color: string }
  | { type: "selectActiveSlot"; slotIndex: EditorState["activeSlotIndex"] }
  | {
      type: "updateActiveSlotAdjustment";
      adjustment: Partial<SlotAdjustment>;
    }
  | {
      type: "replaceSlot";
      slotIndex: 0 | 1 | 2 | 3;
      image: SourceImage;
    }
  | { type: "replaceActiveSlot"; image: SourceImage }
  | { type: "resetActiveSlot" }
  | { type: "exportStarted" }
  | { type: "exportSucceeded"; objectUrl: string }
  | { type: "exportFailed" }
  | { type: "backToEdit" }
  | { type: "startOver" };

export type EditorReduction = {
  state: EditorState;
  cleanup: EditorCleanup[];
};

const presetColors = new Set<string>(
  BACKGROUND_PRESETS.map((preset) => preset.color)
);

function defaultSlotAdjustment(): SlotAdjustment {
  return { panX: 0, panY: 0, zoom: 1 };
}

function defaultSlotAdjustments(): SlotAdjustments {
  return [
    defaultSlotAdjustment(),
    defaultSlotAdjustment(),
    defaultSlotAdjustment(),
    defaultSlotAdjustment()
  ];
}

function toSelectedImages(images: SourceImage[]): SelectedImages | null {
  if (images.length !== REQUIRED_IMAGE_COUNT) {
    return null;
  }

  return [images[0], images[1], images[2], images[3]];
}

function cleanupExportUrl(state: EditorState): EditorCleanup[] {
  if (state.exportBlobUrl === null) {
    return [];
  }

  return [{ type: "revokeObjectUrl", objectUrl: state.exportBlobUrl }];
}

function cleanupObjectUrl(objectUrl: string): EditorCleanup[] {
  return [{ type: "revokeObjectUrl", objectUrl }];
}

function clearExportState(state: EditorState): EditorState {
  return {
    ...state,
    exportState: "idle",
    exportBlobUrl: null
  };
}

function replaceSlotAdjustment(
  adjustments: SlotAdjustments,
  slotIndex: 0 | 1 | 2 | 3,
  adjustment: SlotAdjustment
): SlotAdjustments {
  const nextAdjustments: SlotAdjustments = [...adjustments];
  nextAdjustments[slotIndex] = adjustment;
  return nextAdjustments;
}

function replaceSelectedImage(
  selectedImages: SelectedImages,
  slotIndex: 0 | 1 | 2 | 3,
  image: SourceImage
): SelectedImages {
  const nextSelectedImages: SelectedImages = [...selectedImages];
  nextSelectedImages[slotIndex] = image;
  return nextSelectedImages;
}

function appendSourceImageIfNew(
  sourceImages: SourceImage[],
  image: SourceImage
): SourceImage[] {
  if (sourceImages.some((sourceImage) => sourceImage.id === image.id)) {
    return sourceImages;
  }

  return [...sourceImages, image];
}

function canExport(state: EditorState): state is EditorState & {
  selectedImages: SelectedImages;
} {
  return (
    state.selectedImages !== null &&
    (state.step === "edit" || state.step === "result")
  );
}

export function createInitialEditorState(): EditorState {
  const template = getTemplateById(DEFAULT_TEMPLATE_ID);

  return {
    step: "upload",
    sourceImages: [],
    selectedImages: null,
    templateId: DEFAULT_TEMPLATE_ID,
    slotAdjustments: defaultSlotAdjustments(),
    backgroundColor: template.defaultBackground,
    activeSlotIndex: null,
    exportState: "idle",
    exportBlobUrl: null
  };
}

export function reduceEditorState(
  state: EditorState,
  action: EditorAction
): EditorReduction {
  switch (action.type) {
    case "uploadCompleted": {
      const selectedImages = toSelectedImages(action.images);

      if (selectedImages !== null) {
        return {
          state: {
            ...clearExportState(state),
            step: "edit",
            sourceImages: action.images,
            selectedImages,
            activeSlotIndex: null,
            slotAdjustments: defaultSlotAdjustments()
          },
          cleanup: cleanupExportUrl(state)
        };
      }

      if (
        action.images.length > REQUIRED_IMAGE_COUNT &&
        action.images.length <= MAX_UPLOAD_COUNT
      ) {
        return {
          state: {
            ...clearExportState(state),
            step: "select",
            sourceImages: action.images,
            selectedImages: null,
            activeSlotIndex: null,
            slotAdjustments: defaultSlotAdjustments()
          },
          cleanup: cleanupExportUrl(state)
        };
      }

      return { state, cleanup: [] };
    }

    case "selectImages": {
      if (action.imageIds.length !== REQUIRED_IMAGE_COUNT) {
        return { state, cleanup: [] };
      }

      const selectedImages = toSelectedImages(
        action.imageIds.flatMap((imageId) => {
          const sourceImage = state.sourceImages.find(
            (candidate) => candidate.id === imageId
          );
          return sourceImage === undefined ? [] : [sourceImage];
        })
      );

      if (selectedImages === null) {
        return { state, cleanup: [] };
      }

      return {
        state: {
          ...state,
          step: "edit",
          selectedImages,
          activeSlotIndex: null,
          exportState: "idle",
          exportBlobUrl: null
        },
        cleanup: cleanupExportUrl(state)
      };
    }

    case "switchTemplate":
      return {
        state: {
          ...state,
          templateId: getTemplateById(action.templateId).id,
          slotAdjustments: defaultSlotAdjustments(),
          activeSlotIndex: null
        },
        cleanup: []
      };

    case "changeBackground":
      if (!presetColors.has(action.color)) {
        return { state, cleanup: [] };
      }

      return {
        state: { ...state, backgroundColor: action.color },
        cleanup: []
      };

    case "selectActiveSlot":
      return {
        state: { ...state, activeSlotIndex: action.slotIndex },
        cleanup: []
      };

    case "updateActiveSlotAdjustment": {
      if (state.activeSlotIndex === null) {
        return { state, cleanup: [] };
      }

      return {
        state: {
          ...state,
          slotAdjustments: replaceSlotAdjustment(
            state.slotAdjustments,
            state.activeSlotIndex,
            {
              ...state.slotAdjustments[state.activeSlotIndex],
              ...action.adjustment
            }
          )
        },
        cleanup: []
      };
    }

    case "replaceSlot": {
      if (state.selectedImages === null) {
        return { state, cleanup: [] };
      }

      return {
        state: {
          ...state,
          sourceImages: appendSourceImageIfNew(state.sourceImages, action.image),
          selectedImages: replaceSelectedImage(
            state.selectedImages,
            action.slotIndex,
            action.image
          ),
          slotAdjustments: replaceSlotAdjustment(
            state.slotAdjustments,
            action.slotIndex,
            defaultSlotAdjustment()
          )
        },
        cleanup: []
      };
    }

    case "replaceActiveSlot":
      if (state.activeSlotIndex === null) {
        return { state, cleanup: [] };
      }

      return reduceEditorState(state, {
        type: "replaceSlot",
        slotIndex: state.activeSlotIndex,
        image: action.image
      });

    case "resetActiveSlot":
      if (state.activeSlotIndex === null) {
        return { state, cleanup: [] };
      }

      return {
        state: {
          ...state,
          slotAdjustments: replaceSlotAdjustment(
            state.slotAdjustments,
            state.activeSlotIndex,
            defaultSlotAdjustment()
          )
        },
        cleanup: []
      };

    case "exportStarted":
      if (!canExport(state)) {
        return { state, cleanup: [] };
      }

      return {
        state: {
          ...state,
          exportState: "rendering",
          exportBlobUrl: null
        },
        cleanup: cleanupExportUrl(state)
      };

    case "exportSucceeded":
      if (!canExport(state)) {
        return { state, cleanup: cleanupObjectUrl(action.objectUrl) };
      }

      return {
        state: {
          ...state,
          step: "result",
          exportState: "success",
          exportBlobUrl: action.objectUrl
        },
        cleanup: cleanupExportUrl(state)
      };

    case "exportFailed":
      if (!canExport(state)) {
        return { state, cleanup: [] };
      }

      return {
        state: {
          ...state,
          step: "edit",
          exportState: "error",
          exportBlobUrl: null
        },
        cleanup: cleanupExportUrl(state)
      };

    case "backToEdit":
      if (state.selectedImages === null) {
        return { state, cleanup: [] };
      }

      return {
        state: {
          ...state,
          step: "edit",
          exportState: "idle",
          exportBlobUrl: null
        },
        cleanup: cleanupExportUrl(state)
      };

    case "startOver":
      return {
        state: createInitialEditorState(),
        cleanup: cleanupExportUrl(state)
      };
  }
}

export function editorReducer(
  state: EditorState,
  action: EditorAction
): EditorState {
  return reduceEditorState(state, action).state;
}
