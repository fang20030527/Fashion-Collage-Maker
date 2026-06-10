import Image from "next/image";
import { useMemo, useState } from "react";

import { REQUIRED_IMAGE_COUNT } from "../constants";
import styles from "../FashionCollageMaker.module.css";
import type { SourceImage } from "../types";

type SelectStepProps = {
  images: SourceImage[];
  messages: string[];
  onContinue: (imageIds: string[]) => void;
};

function getSelectionNumber(imageIds: string[], imageId: string) {
  const selectedIndex = imageIds.indexOf(imageId);

  return selectedIndex === -1 ? null : selectedIndex + 1;
}

export function SelectStep({ images, messages, onContinue }: SelectStepProps) {
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const selectedCount = selectedImageIds.length;
  const canContinue = selectedCount === REQUIRED_IMAGE_COUNT;
  const countText = `${selectedCount} of ${REQUIRED_IMAGE_COUNT} selected`;
  const orderedSelection = useMemo(() => selectedImageIds, [selectedImageIds]);

  function toggleImage(imageId: string) {
    setSelectedImageIds((currentIds) => {
      if (currentIds.includes(imageId)) {
        return currentIds.filter((currentId) => currentId !== imageId);
      }

      if (currentIds.length === REQUIRED_IMAGE_COUNT) {
        return currentIds;
      }

      return [...currentIds, imageId];
    });
  }

  return (
    <section className={styles.selectScreen} aria-labelledby="select-title">
      <header className={styles.selectHeader}>
        <div>
          <p className={styles.kicker}>Choose the final four</p>
          <h1 id="select-title">Fashion Collage Maker</h1>
          <p className={styles.subtitle}>
            Create an editorial outfit collage from 4 photos.
          </p>
          <p className={styles.privacy}>Your photos stay in your browser.</p>
        </div>
        <div className={styles.selectionActions}>
          <p className={styles.selectionCount}>{countText}</p>
          <button
            className={styles.continueButton}
            type="button"
            disabled={!canContinue}
            onClick={() => onContinue(orderedSelection)}
          >
            Continue
          </button>
        </div>
      </header>

      {messages.length > 0 && (
        <div className={styles.errors} role="status">
          {messages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      <div className={styles.thumbnailGrid}>
        {images.map((image) => {
          const selectionNumber = getSelectionNumber(selectedImageIds, image.id);
          const isSelected = selectionNumber !== null;

          return (
            <button
              key={image.id}
              className={`${styles.thumbnailButton} ${
                isSelected ? styles.thumbnailSelected : ""
              }`}
              type="button"
              onClick={() => toggleImage(image.id)}
              aria-pressed={isSelected}
              aria-label={
                isSelected
                  ? `Remove photo ${selectionNumber} from selection`
                  : "Select photo"
              }
            >
              <Image
                src={image.objectUrl}
                alt=""
                width={360}
                height={460}
                unoptimized
              />
              {isSelected && (
                <span className={styles.selectionBadge}>{selectionNumber}</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
