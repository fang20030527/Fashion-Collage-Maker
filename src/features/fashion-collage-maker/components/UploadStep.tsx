"use client";

import { useId, useState, type CSSProperties } from "react";

import {
  MAX_TEMPLATE_IMAGE_COUNT,
  MAX_UPLOAD_COUNT,
  MIN_UPLOAD_IMAGE_COUNT
} from "../constants";
import styles from "../FashionCollageMaker.module.css";

type UploadStepProps = {
  messages: string[];
  onFilesSelected: (files: File[]) => void;
  status: "idle" | "normalizing";
};

type ScatterPhotoMotion = {
  offsetX: number;
  offsetY: number;
  rotation: number;
};

type ScatterPhotoStyle = CSSProperties & {
  "--scatter-x": string;
  "--scatter-y": string;
  "--scatter-rotation": string;
};

const SCATTERED_PHOTO_PLACEHOLDERS = [
  "portrait",
  "detail",
  "landscape",
  "square",
  "wide",
  "mini"
] as const;

function filesFromList(fileList: FileList | null) {
  return fileList === null ? [] : Array.from(fileList);
}

function createRandomScatterMotion(): ScatterPhotoMotion {
  const direction = Math.random() * Math.PI * 2;
  const distance = 5 + Math.random() * 9;
  const offsetX = Math.cos(direction) * distance;
  const offsetY = Math.sin(direction) * distance;
  const rotationDirection = offsetX >= 0 ? -1 : 1;
  const rotation = rotationDirection * (1.4 + Math.random() * 3.4);

  return { offsetX, offsetY, rotation };
}

function createScatterPhotoStyle(
  motion: ScatterPhotoMotion | undefined
): ScatterPhotoStyle | undefined {
  if (motion === undefined) {
    return undefined;
  }

  return {
    "--scatter-x": `${motion.offsetX.toFixed(2)}px`,
    "--scatter-y": `${motion.offsetY.toFixed(2)}px`,
    "--scatter-rotation": `${motion.rotation.toFixed(2)}deg`
  };
}

export function UploadStep({
  messages,
  onFilesSelected,
  status
}: UploadStepProps) {
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [scatterMotion, setScatterMotion] = useState<ScatterPhotoMotion[]>();
  const isBusy = status === "normalizing";

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (isBusy) {
      event.currentTarget.value = "";
      return;
    }

    onFilesSelected(filesFromList(event.currentTarget.files));
    event.currentTarget.value = "";
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (isBusy) {
      return;
    }

    onFilesSelected(filesFromList(event.dataTransfer.files));
  }

  function preventDropDefault(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  function handleShufflePreview() {
    setScatterMotion(
      SCATTERED_PHOTO_PLACEHOLDERS.map(() => createRandomScatterMotion())
    );
  }

  return (
    <section className={styles.uploadScreen} aria-labelledby="fashion-title">
      <div className={styles.intro}>
        <h1 id="fashion-title">Fashion Collage Maker</h1>
        <p className={styles.subtitle}>
          Shape a magazine-ready collage from {MIN_UPLOAD_IMAGE_COUNT} to{" "}
          {MAX_TEMPLATE_IMAGE_COUNT} photos.
        </p>
        <p className={styles.privacy}>Your photos stay in your browser.</p>

        <div
          className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            if (isBusy) {
              return;
            }
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDragOver={preventDropDefault}
          onDrop={handleDrop}
          aria-busy={isBusy}
          aria-disabled={isBusy}
        >
          <input
            id={inputId}
            className={styles.fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            multiple
            disabled={isBusy}
            onChange={handleInputChange}
            aria-describedby="upload-help upload-errors"
          />
          <label
            className={`${styles.uploadLabel} ${
              isBusy ? styles.uploadLabelDisabled : ""
            }`}
            htmlFor={inputId}
            aria-disabled={isBusy}
          >
            {isBusy ? "Preparing photos" : "Choose photos"}
          </label>
          <p id="upload-help" className={styles.uploadHint}>
            Drop or choose {MIN_UPLOAD_IMAGE_COUNT} to {MAX_UPLOAD_COUNT} JPG,
            PNG, or WebP images.
          </p>
          {isBusy && <p className={styles.status}>Preparing images...</p>}
        </div>

        {messages.length > 0 && (
          <div id="upload-errors" className={styles.errors} role="status">
            {messages.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        )}
      </div>

      <button
        className={styles.preview}
        type="button"
        onClick={handleShufflePreview}
        aria-label="Shuffle photo placeholders"
      >
        <span className={styles.photoScatter} aria-hidden="true">
          {SCATTERED_PHOTO_PLACEHOLDERS.map((placeholder, index) => (
            <span
              key={placeholder}
              className={styles.scatterPhoto}
              style={createScatterPhotoStyle(scatterMotion?.[index])}
            />
          ))}
        </span>
      </button>
    </section>
  );
}
