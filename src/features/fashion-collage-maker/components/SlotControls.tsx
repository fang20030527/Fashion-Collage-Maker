import { useId, useRef } from "react";

import type { EditorAction } from "../editorReducer";
import styles from "../FashionCollageMaker.module.css";
import type { EditorState, SlotAdjustment } from "../types";

type SlotControlsProps = {
  activeSlotIndex: EditorState["activeSlotIndex"];
  adjustment: SlotAdjustment | null;
  disabled: boolean;
  isReplacing: boolean;
  onAction: (action: EditorAction) => void;
  onReplaceFile: (file: File) => void;
};

export function SlotControls({
  activeSlotIndex,
  adjustment,
  disabled,
  isReplacing,
  onAction,
  onReplaceFile
}: SlotControlsProps) {
  const replaceInputId = useId();
  const replaceInputRef = useRef<HTMLInputElement>(null);

  if (activeSlotIndex === null || adjustment === null) {
    return (
      <section className={styles.controlGroup} aria-labelledby="slot-controls-title">
        <h2 id="slot-controls-title">Selected slot</h2>
        <p className={styles.mutedText}>Select a photo on the preview to adjust it.</p>
      </section>
    );
  }

  function handleZoomChange(event: React.ChangeEvent<HTMLInputElement>) {
    onAction({
      type: "updateActiveSlotAdjustment",
      adjustment: { zoom: Number(event.currentTarget.value) }
    });
  }

  function handleReplaceChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;

    event.currentTarget.value = "";

    if (file === null || isReplacing || disabled) {
      return;
    }

    onReplaceFile(file);
  }

  return (
    <section className={styles.controlGroup} aria-labelledby="slot-controls-title">
      <h2 id="slot-controls-title">Selected slot</h2>
      <p className={styles.mutedText}>Slot {activeSlotIndex + 1} is active.</p>

      <label className={styles.rangeLabel} htmlFor="slot-zoom">
        Zoom
        <span>{adjustment.zoom.toFixed(2)}x</span>
      </label>
      <input
        id="slot-zoom"
        className={styles.zoomSlider}
        type="range"
        min="1"
        max="2.5"
        step="0.01"
        value={adjustment.zoom}
        disabled={disabled}
        onChange={handleZoomChange}
      />

      <div className={styles.slotActions}>
        <input
          id={replaceInputId}
          ref={replaceInputRef}
          className={styles.fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/*"
          disabled={isReplacing || disabled}
          tabIndex={-1}
          onChange={handleReplaceChange}
        />
        <button
          className={`${styles.secondaryButton} ${
            isReplacing || disabled ? styles.secondaryButtonDisabled : ""
          }`}
          type="button"
          disabled={isReplacing || disabled}
          aria-controls={replaceInputId}
          onClick={() => replaceInputRef.current?.click()}
        >
          {isReplacing ? "Replacing..." : "Replace"}
        </button>
        <button
          className={`${styles.secondaryButton} ${
            disabled ? styles.secondaryButtonDisabled : ""
          }`}
          type="button"
          disabled={disabled}
          onClick={() => onAction({ type: "resetActiveSlot" })}
        >
          Reset crop
        </button>
      </div>
    </section>
  );
}
