import {
  BACKGROUND_PRESETS,
  MAX_UPLOAD_COUNT,
  MIN_UPLOAD_IMAGE_COUNT
} from "./constants";
import {
  DEFAULT_TEMPLATE_ID,
  getTemplateById,
  getTemplateForImageCount,
  MAX_TEMPLATE_SLOT_COUNT
} from "./templates";
import type {
  EditorState,
  SelectedImages,
  SlotAdjustment,
  SlotAdjustments,
  SourceImage,
  TemplateConfig
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
      slotIndex: number;
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

function defaultSlotAdjustments(slotCount: number): SlotAdjustments {
  return Array.from({ length: slotCount }, defaultSlotAdjustment);
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

function selectImagesForTemplate(
  images: readonly SourceImage[],
  template: TemplateConfig
): SelectedImages | null {
  if (images.length < template.slots.length) {
    return null;
  }

  return images.slice(0, template.slots.length);
}

function selectImagesFromIds(
  sourceImages: readonly SourceImage[],
  imageIds: readonly string[]
): SelectedImages | null {
  const selectedImages = imageIds.flatMap((imageId) => {
    const sourceImage = sourceImages.find((candidate) => candidate.id === imageId);

    return sourceImage === undefined ? [] : [sourceImage];
  });

  return selectedImages.length === imageIds.length ? selectedImages : null;
}

function getImagesForTemplate(
  state: EditorState,
  template: TemplateConfig
): SelectedImages | null {
  if (state.selectedImages && state.selectedImages.length >= template.slots.length) {
    return state.selectedImages.slice(0, template.slots.length);
  }

  return selectImagesForTemplate(state.sourceImages, template);
}

function replaceSlotAdjustment(
  adjustments: SlotAdjustments,
  slotIndex: number,
  adjustment: SlotAdjustment
): SlotAdjustments {
  if (!hasIndex(adjustments, slotIndex)) {
    return adjustments;
  }

  const nextAdjustments = [...adjustments];
  nextAdjustments[slotIndex] = adjustment;
  return nextAdjustments;
}

function replaceSelectedImage(
  selectedImages: SelectedImages,
  slotIndex: number,
  image: SourceImage
): SelectedImages {
  if (!hasIndex(selectedImages, slotIndex)) {
    return selectedImages;
  }

  const nextSelectedImages = [...selectedImages];
  nextSelectedImages[slotIndex] = image;
  return nextSelectedImages;
}

function replaceSourceImage(
  sourceImages: SourceImage[],
  previousImage: SourceImage,
  nextImage: SourceImage
): SourceImage[] {
  const sourceIndex = sourceImages.findIndex(
    (image) => image.objectUrl === previousImage.objectUrl
  );

  if (sourceIndex === -1) {
    return sourceImages;
  }

  const nextSourceImages = [...sourceImages];
  nextSourceImages[sourceIndex] = nextImage;
  return nextSourceImages;
}

function hasIndex<T>(items: readonly T[], index: number): index is number {
  return Number.isInteger(index) && index >= 0 && index < items.length;
}

function canExport(state: EditorState): state is EditorState & {
  selectedImages: SelectedImages;
} {
  const template = getTemplateById(state.templateId);

  return (
    state.selectedImages !== null &&
    state.selectedImages.length === template.slots.length &&
    (state.step === "edit" || state.step === "result")
  );
}

function canUseSelectionCount(count: number) {
  return count >= MIN_UPLOAD_IMAGE_COUNT && count <= MAX_TEMPLATE_SLOT_COUNT;
}

function getEditingState(
  state: EditorState,
  images: SelectedImages,
  template: TemplateConfig
): EditorState {
  return {
    ...clearExportState(state),
    step: "edit",
    sourceImages: images,
    selectedImages: selectImagesForTemplate(images, template),
    templateId: template.id,
    backgroundColor: template.defaultBackground,
    activeSlotIndex: null,
    slotAdjustments: defaultSlotAdjustments(template.slots.length)
  };
}

export function createInitialEditorState(): EditorState {
  const template = getTemplateById(DEFAULT_TEMPLATE_ID);

  return {
    step: "upload",
    sourceImages: [],
    selectedImages: null,
    templateId: DEFAULT_TEMPLATE_ID,
    slotAdjustments: defaultSlotAdjustments(template.slots.length),
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
      if (!canUseSelectionCount(action.images.length)) {
        if (
          action.images.length > MAX_TEMPLATE_SLOT_COUNT &&
          action.images.length <= MAX_UPLOAD_COUNT
        ) {
          return {
            state: {
              ...clearExportState(state),
              step: "select",
              sourceImages: action.images,
              selectedImages: null,
              activeSlotIndex: null,
              slotAdjustments: defaultSlotAdjustments(
                getTemplateById(DEFAULT_TEMPLATE_ID).slots.length
              )
            },
            cleanup: cleanupExportUrl(state)
          };
        }

        return { state, cleanup: [] };
      }

      const template = getTemplateForImageCount(action.images.length);
      const selectedImages = selectImagesForTemplate(action.images, template);

      if (selectedImages === null) {
        return { state, cleanup: [] };
      }

      return {
        state: getEditingState(state, action.images, template),
        cleanup: cleanupExportUrl(state)
      };
    }

    case "selectImages": {
      if (!canUseSelectionCount(action.imageIds.length)) {
        return { state, cleanup: [] };
      }

      const selectedSourceImages = selectImagesFromIds(
        state.sourceImages,
        action.imageIds
      );

      if (selectedSourceImages === null) {
        return { state, cleanup: [] };
      }

      const template = getTemplateForImageCount(selectedSourceImages.length);
      const selectedImages = selectImagesForTemplate(selectedSourceImages, template);

      if (selectedImages === null) {
        return { state, cleanup: [] };
      }

      return {
        state: getEditingState(state, selectedSourceImages, template),
        cleanup: cleanupExportUrl(state)
      };
    }

    case "switchTemplate": {
      const template = getTemplateById(action.templateId);
      const selectedImages = getImagesForTemplate(state, template);

      if (selectedImages === null) {
        return { state, cleanup: [] };
      }

      return {
        state: {
          ...state,
          templateId: template.id,
          selectedImages,
          slotAdjustments: defaultSlotAdjustments(template.slots.length),
          activeSlotIndex: null
        },
        cleanup: []
      };
    }

    case "changeBackground":
      if (!presetColors.has(action.color)) {
        return { state, cleanup: [] };
      }

      return {
        state: { ...state, backgroundColor: action.color },
        cleanup: []
      };

    case "selectActiveSlot": {
      const template = getTemplateById(state.templateId);

      if (
        action.slotIndex !== null &&
        !hasIndex(template.slots, action.slotIndex)
      ) {
        return { state, cleanup: [] };
      }

      return {
        state: { ...state, activeSlotIndex: action.slotIndex },
        cleanup: []
      };
    }

    case "updateActiveSlotAdjustment": {
      if (
        state.activeSlotIndex === null ||
        !hasIndex(state.slotAdjustments, state.activeSlotIndex)
      ) {
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
      if (state.selectedImages === null || !hasIndex(state.selectedImages, action.slotIndex)) {
        return { state, cleanup: [] };
      }

      const previousImage = state.selectedImages[action.slotIndex];

      return {
        state: {
          ...state,
          sourceImages: replaceSourceImage(
            state.sourceImages,
            previousImage,
            action.image
          ),
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
