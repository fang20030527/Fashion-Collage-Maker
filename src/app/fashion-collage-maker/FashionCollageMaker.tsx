"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

import styles from "@/features/fashion-collage-maker/FashionCollageMaker.module.css";
import { EditorStep } from "@/features/fashion-collage-maker/components/EditorStep";
import { SelectStep } from "@/features/fashion-collage-maker/components/SelectStep";
import { UploadStep } from "@/features/fashion-collage-maker/components/UploadStep";
import { REQUIRED_IMAGE_COUNT } from "@/features/fashion-collage-maker/constants";
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
import type {
  EditorState,
  SourceImage
} from "@/features/fashion-collage-maker/types";

type UploadStatus = "idle" | "normalizing";
type ReplacementStatus = "idle" | "normalizing";

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

  useEffect(() => {
    const objectUrls = ownedObjectUrls.current;

    return () => {
      uploadRequestToken.current += 1;
      replaceRequestToken.current += 1;
      isNormalizingRef.current = false;
      isReplacingRef.current = false;
      objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
      objectUrls.clear();
    };
  }, []);

  function dispatchEditorAction(action: EditorAction) {
    const reduction = reduceEditorState(stateRef.current, action);

    stateRef.current = reduction.state;
    setState(reduction.state);
    applyEditorCleanup(reduction.cleanup, ownedObjectUrls);
  }

  function revokeUncommittedImages(images: SourceImage[]) {
    revokeImages(images);
    images.forEach((image) => {
      ownedObjectUrls.current.delete(image.objectUrl);
    });
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

    if (validation.filesToNormalize.length < REQUIRED_IMAGE_COUNT) {
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

      if (normalizedImages.length < REQUIRED_IMAGE_COUNT) {
        revokeUncommittedImages(normalizedImages);
        setMessages([
          ...nextMessages,
          `Add at least ${REQUIRED_IMAGE_COUNT} valid images to continue.`
        ]);
        return;
      }

      setMessages(nextMessages);
      dispatchEditorAction({ type: "uploadCompleted", images: normalizedImages });
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
    if (isReplacingRef.current || stateRef.current.activeSlotIndex === null) {
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
      dispatchEditorAction({ type: "replaceActiveSlot", image: result.image });
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

  function handleExportPlaceholder() {
    setMessages(["Export rendering is coming in the next task."]);
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
        <EditorStep
          state={state}
          messages={messages}
          replacementStatus={replacementStatus}
          onAction={dispatchEditorAction}
          onReplaceActiveSlot={handleReplaceActiveSlot}
          onExport={handleExportPlaceholder}
        />
      )}
    </main>
  );
}
