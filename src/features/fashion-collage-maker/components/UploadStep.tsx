import Image from "next/image";
import { useId, useRef, useState } from "react";

import styles from "../FashionCollageMaker.module.css";

type UploadStepProps = {
  messages: string[];
  onFilesSelected: (files: File[]) => void;
  status: "idle" | "normalizing";
};

function filesFromList(fileList: FileList | null) {
  return fileList === null ? [] : Array.from(fileList);
}

export function UploadStep({
  messages,
  onFilesSelected,
  status
}: UploadStepProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isBusy = status === "normalizing";

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    onFilesSelected(filesFromList(event.currentTarget.files));
    event.currentTarget.value = "";
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    onFilesSelected(filesFromList(event.dataTransfer.files));
  }

  function preventDropDefault(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  return (
    <section className={styles.uploadScreen} aria-labelledby="fashion-title">
      <div className={styles.intro}>
        <p className={styles.kicker}>Browser-only collage tool</p>
        <h1 id="fashion-title">Fashion Collage Maker</h1>
        <p className={styles.subtitle}>
          Create an editorial outfit collage from 4 photos.
        </p>
        <p className={styles.privacy}>Your photos stay in your browser.</p>

        <div
          className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDragOver={preventDropDefault}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            id={inputId}
            className={styles.fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            multiple
            onChange={handleInputChange}
            aria-describedby="upload-help upload-errors"
          />
          <label className={styles.uploadLabel} htmlFor={inputId}>
            Choose photos
          </label>
          <p id="upload-help" className={styles.uploadHint}>
            Drop or choose 4 to 9 JPG, PNG, or WebP images.
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

      <aside className={styles.preview} aria-label="Static example template preview">
        <Image
          src="/fashion-collage/templates/editorial-hero.png"
          alt="Editorial collage template preview"
          width={720}
          height={900}
          priority
        />
      </aside>
    </section>
  );
}
