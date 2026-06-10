"use client";

import { useEffect, useReducer, useRef, useState } from "react";

import styles from "@/features/fashion-collage-maker/FashionCollageMaker.module.css";
import { SelectStep } from "@/features/fashion-collage-maker/components/SelectStep";
import { UploadStep } from "@/features/fashion-collage-maker/components/UploadStep";
import { REQUIRED_IMAGE_COUNT } from "@/features/fashion-collage-maker/constants";
import {
  createInitialEditorState,
  editorReducer
} from "@/features/fashion-collage-maker/editorReducer";
import { normalizeImageFiles } from "@/features/fashion-collage-maker/imageNormalization";
import { validateImageFiles } from "@/features/fashion-collage-maker/imageValidation";
import type { SourceImage } from "@/features/fashion-collage-maker/types";

type UploadStatus = "idle" | "normalizing";

function revokeImages(images: SourceImage[]) {
  images.forEach((image) => URL.revokeObjectURL(image.objectUrl));
}

export function FashionCollageMaker() {
  const [state, dispatch] = useReducer(editorReducer, undefined, createInitialEditorState);
  const [messages, setMessages] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const ownedObjectUrls = useRef<Set<string>>(new Set());

  useEffect(() => {
    const objectUrls = ownedObjectUrls.current;

    return () => {
      objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
      objectUrls.clear();
    };
  }, []);

  async function handleFiles(files: File[]) {
    if (uploadStatus === "normalizing") {
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

      if (normalizedImages.length < REQUIRED_IMAGE_COUNT) {
        revokeImages(normalizedImages);
        normalizedImages.forEach((image) => {
          ownedObjectUrls.current.delete(image.objectUrl);
        });
        setMessages([
          ...nextMessages,
          `Add at least ${REQUIRED_IMAGE_COUNT} valid images to continue.`
        ]);
        return;
      }

      setMessages(nextMessages);
      dispatch({ type: "uploadCompleted", images: normalizedImages });
    } catch {
      setMessages([
        ...validationMessages,
        "Those images could not be prepared for editing. Try a different set of photos."
      ]);
    } finally {
      setUploadStatus("idle");
    }
  }

  function handleSelectImages(imageIds: string[]) {
    dispatch({ type: "selectImages", imageIds });
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
        <section className={styles.editorPlaceholder} aria-labelledby="editor-title">
          <p className={styles.kicker}>Local editor</p>
          <h1 id="editor-title">Fashion Collage Maker</h1>
          <p>{state.selectedImages?.length ?? 0} of 4 photos loaded.</p>
          <p className={styles.privacy}>Editor coming next.</p>
        </section>
      )}
    </main>
  );
}
