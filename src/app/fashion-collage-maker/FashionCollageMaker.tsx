"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

import styles from "@/features/fashion-collage-maker/FashionCollageMaker.module.css";
import { EditorStep } from "@/features/fashion-collage-maker/components/EditorStep";
import { ResultStep } from "@/features/fashion-collage-maker/components/ResultStep";
import { SelectStep } from "@/features/fashion-collage-maker/components/SelectStep";
import { UploadStep } from "@/features/fashion-collage-maker/components/UploadStep";
import { MIN_UPLOAD_IMAGE_COUNT } from "@/features/fashion-collage-maker/constants";
import { renderCollageToCanvas } from "@/features/fashion-collage-maker/canvasRenderer";
import { trackEvent } from "@/features/fashion-collage-maker/analytics";
import {
  createInitialEditorState,
  reduceEditorState,
  type EditorAction,
  type EditorCleanup
} from "@/features/fashion-collage-maker/editorReducer";
import {
  normalizeImageFile,
  normalizeImageFiles
} from "@/features/fashion-collage-maker/imageNormalization";
import { validateImageFiles } from "@/features/fashion-collage-maker/imageValidation";
import { getTemplateById } from "@/features/fashion-collage-maker/templates";
import type { EditorState, SourceImage } from "@/features/fashion-collage-maker/types";

type UploadStatus = "idle" | "normalizing";
type ReplacementStatus = "idle" | "normalizing";
type LocalFeedbackChange = {
  rating: number | null;
  hasNotes: boolean;
};

function revokeImages(images: SourceImage[]) {
  images.forEach((image) => URL.revokeObjectURL(image.objectUrl));
}

function applyEditorCleanup(
  cleanup: EditorCleanup[],
  ownedObjectUrls: RefObject<Set<string>>
) {
  cleanup.forEach((record) => {
    if (record.type === "revokeObjectUrl") {
      URL.revokeObjectURL(record.objectUrl);
      ownedObjectUrls.current.delete(record.objectUrl);
    }
  });
}

function isImageSelected(selectedImages: SourceImage[] | null, image: SourceImage) {
  return (
    selectedImages?.some(
      (selectedImage) => selectedImage.objectUrl === image.objectUrl
    ) ?? false
  );
}

function canDispatchDuringExport(action: EditorAction) {
  return action.type === "exportSucceeded" || action.type === "exportFailed";
}

function shouldWarnBeforeUnload(state: EditorState) {
  return (
    (state.step === "edit" && state.selectedImages !== null) ||
    (state.step === "result" && state.exportBlobUrl !== null)
  );
}

export function FashionCollageMaker() {
  const [state, setState] = useState<EditorState>(createInitialEditorState);
  const [messages, setMessages] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [replacementStatus, setReplacementStatus] =
    useState<ReplacementStatus>("idle");
  const ownedObjectUrls = useRef<Set<string>>(new Set());
  const stateRef = useRef(state);
  const isNormalizingRef = useRef(false);
  const isReplacingRef = useRef(false);
  const uploadRequestToken = useRef(0);
  const replaceRequestToken = useRef(0);
  const exportRequestToken = useRef(0);
  const isExportRendering = state.exportState === "rendering";
  const isReplacementNormalizing = replacementStatus === "normalizing";

  useEffect(() => {
    const objectUrls = ownedObjectUrls.current;

    return () => {
      uploadRequestToken.current += 1;
      replaceRequestToken.current += 1;
      exportRequestToken.current += 1;
      isNormalizingRef.current = false;
      isReplacingRef.current = false;
      objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
      objectUrls.clear();
    };
  }, []);

  useEffect(() => {
    if (!shouldWarnBeforeUnload(state)) {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [state]);

  function dispatchEditorAction(action: EditorAction) {
    if (
      stateRef.current.exportState === "rendering" &&
      !canDispatchDuringExport(action)
    ) {
      return;
    }

    const previousState = stateRef.current;
    const reduction = reduceEditorState(previousState, action);

    stateRef.current = reduction.state;
    setState(reduction.state);
    applyEditorCleanup(reduction.cleanup, ownedObjectUrls);

    if (
      action.type === "switchTemplate" &&
      reduction.state.templateId !== previousState.templateId
    ) {
      trackEvent("template_selected", {
        templateId: reduction.state.templateId
      });
    }
  }

  function revokeUncommittedImages(images: SourceImage[]) {
    revokeImages(images);
    images.forEach((image) => {
      ownedObjectUrls.current.delete(image.objectUrl);
    });
  }

  function revokeAllOwnedObjectUrls() {
    ownedObjectUrls.current.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    ownedObjectUrls.current.clear();
  }

  async function handleFiles(files: File[]) {
    if (isNormalizingRef.current) {
      return;
    }

    const validation = validateImageFiles(files);
    const validationMessages = [
      ...validation.messages.map((issue) => issue.message),
      ...validation.rejectedFiles.map((issue) => issue.message)
    ];

    if (validation.filesToNormalize.length < MIN_UPLOAD_IMAGE_COUNT) {
      setMessages(validationMessages);
      return;
    }

    isNormalizingRef.current = true;
    uploadRequestToken.current += 1;
    const requestToken = uploadRequestToken.current;

    setUploadStatus("normalizing");
    setMessages(validationMessages);

    try {
      const normalizedResults = await normalizeImageFiles(validation.filesToNormalize);
      const normalizedImages = normalizedResults.flatMap((result) => {
        if (result.ok) {
          return [result.image];
        }

        return [];
      });
      const normalizationMessages = normalizedResults.flatMap((result) => {
        if (result.ok) {
          return [];
        }

        return [result.message];
      });
      const nextMessages = [...validationMessages, ...normalizationMessages];

      normalizedImages.forEach((image) => {
        ownedObjectUrls.current.add(image.objectUrl);
      });

      if (requestToken !== uploadRequestToken.current) {
        revokeUncommittedImages(normalizedImages);
        return;
      }

      if (normalizedImages.length < MIN_UPLOAD_IMAGE_COUNT) {
        revokeUncommittedImages(normalizedImages);
        setMessages([
          ...nextMessages,
          `Add at least ${MIN_UPLOAD_IMAGE_COUNT} valid image to continue.`
        ]);
        return;
      }

      setMessages(nextMessages);
      dispatchEditorAction({ type: "uploadCompleted", images: normalizedImages });
      trackEvent("upload_completed", {
        imageCount: normalizedImages.length,
        step: stateRef.current.step
      });
    } catch {
      if (requestToken !== uploadRequestToken.current) {
        return;
      }

      setMessages([
        ...validationMessages,
        "Those images could not be prepared for editing. Try a different set of photos."
      ]);
    } finally {
      if (requestToken === uploadRequestToken.current) {
        isNormalizingRef.current = false;
        setUploadStatus("idle");
      }
    }
  }

  function handleSelectImages(imageIds: string[]) {
    dispatchEditorAction({ type: "selectImages", imageIds });
  }

  async function handleReplaceActiveSlot(file: File) {
    if (stateRef.current.exportState === "rendering") {
      return;
    }

    const targetSlotIndex = stateRef.current.activeSlotIndex;
    const previousImage =
      targetSlotIndex === null
        ? null
        : stateRef.current.selectedImages?.[targetSlotIndex] ?? null;

    if (
      isReplacingRef.current ||
      targetSlotIndex === null ||
      previousImage === null
    ) {
      return;
    }

    const validation = validateImageFiles([file]);
    const rejectedMessages = validation.rejectedFiles.map((issue) => issue.message);

    if (rejectedMessages.length > 0 || validation.filesToNormalize.length === 0) {
      setMessages(
        rejectedMessages.length > 0
          ? rejectedMessages
          : ["Choose a JPG, PNG, or WebP image to replace this slot."]
      );
      return;
    }

    isReplacingRef.current = true;
    replaceRequestToken.current += 1;
    const requestToken = replaceRequestToken.current;

    setReplacementStatus("normalizing");
    setMessages([]);

    try {
      const result = await normalizeImageFile(validation.filesToNormalize[0]);

      if (requestToken !== replaceRequestToken.current) {
        if (result.ok) {
          URL.revokeObjectURL(result.image.objectUrl);
        }
        return;
      }

      if (!result.ok) {
        setMessages([result.message]);
        return;
      }

      ownedObjectUrls.current.add(result.image.objectUrl);
      dispatchEditorAction({
        type: "replaceSlot",
        slotIndex: targetSlotIndex,
        image: result.image
      });

      if (
        ownedObjectUrls.current.has(previousImage.objectUrl) &&
        !isImageSelected(stateRef.current.selectedImages, previousImage)
      ) {
        URL.revokeObjectURL(previousImage.objectUrl);
        ownedObjectUrls.current.delete(previousImage.objectUrl);
      }
    } catch {
      if (requestToken === replaceRequestToken.current) {
        setMessages([
          "That replacement image could not be prepared. Try a different photo."
        ]);
      }
    } finally {
      if (requestToken === replaceRequestToken.current) {
        isReplacingRef.current = false;
        setReplacementStatus("idle");
      }
    }
  }

  function canvasToPngBlob(canvas: HTMLCanvasElement) {
    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }

  async function handleExport() {
    const exportState = stateRef.current;

    if (
      exportState.selectedImages === null ||
      exportState.exportState === "rendering" ||
      isReplacingRef.current
    ) {
      return;
    }

    exportRequestToken.current += 1;
    const requestToken = exportRequestToken.current;

    setMessages([]);
    dispatchEditorAction({ type: "exportStarted" });

    try {
      const canvas = await renderCollageToCanvas({
        template: getTemplateById(exportState.templateId),
        selectedImages: exportState.selectedImages,
        slotAdjustments: exportState.slotAdjustments,
        backgroundColor: exportState.backgroundColor
      });
      const blob = await canvasToPngBlob(canvas);

      if (blob === null) {
        throw new Error("Canvas PNG encoding failed.");
      }

      const objectUrl = URL.createObjectURL(blob);
      ownedObjectUrls.current.add(objectUrl);

      if (requestToken !== exportRequestToken.current) {
        URL.revokeObjectURL(objectUrl);
        ownedObjectUrls.current.delete(objectUrl);
        return;
      }

      dispatchEditorAction({ type: "exportSucceeded", objectUrl });
      trackEvent("export_succeeded", {
        templateId: exportState.templateId
      });
    } catch {
      if (requestToken === exportRequestToken.current) {
        dispatchEditorAction({ type: "exportFailed" });
        trackEvent("export_failed", {
          templateId: exportState.templateId
        });
      }
    }
  }

  function handleLocalFeedbackChange(feedback: LocalFeedbackChange) {
    trackEvent("local_feedback_changed", {
      rating: feedback.rating,
      hasNotes: feedback.hasNotes
    });
  }

  function handleBackToEdit() {
    setMessages([]);
    dispatchEditorAction({ type: "backToEdit" });
  }

  function handleStartOver() {
    if (stateRef.current.exportState === "rendering") {
      return;
    }

    uploadRequestToken.current += 1;
    replaceRequestToken.current += 1;
    exportRequestToken.current += 1;
    isNormalizingRef.current = false;
    isReplacingRef.current = false;
    setUploadStatus("idle");
    setReplacementStatus("idle");
    setMessages([]);
    dispatchEditorAction({ type: "startOver" });
    revokeAllOwnedObjectUrls();
  }

  return (
    <main className={styles.page}>
      {state.step === "upload" && (
        <UploadStep
          messages={messages}
          onFilesSelected={handleFiles}
          status={uploadStatus}
        />
      )}

      {state.step === "select" && (
        <SelectStep
          images={state.sourceImages}
          messages={messages}
          onContinue={handleSelectImages}
        />
      )}

      {(state.step === "edit" || state.step === "result") && (
        <>
          {state.step === "edit" && (
            <EditorStep
              state={state}
              messages={messages}
              disabled={isExportRendering}
              exportDisabled={isExportRendering || isReplacementNormalizing}
              replacementStatus={replacementStatus}
              onAction={dispatchEditorAction}
              onReplaceActiveSlot={handleReplaceActiveSlot}
              onExport={handleExport}
              onStartOver={handleStartOver}
            />
          )}

          {state.step === "result" && state.exportBlobUrl !== null && (
            <ResultStep
              exportBlobUrl={state.exportBlobUrl}
              onBackToEdit={handleBackToEdit}
              onFeedbackChange={handleLocalFeedbackChange}
              onStartOver={handleStartOver}
            />
          )}
        </>
      )}
    </main>
  );
}
