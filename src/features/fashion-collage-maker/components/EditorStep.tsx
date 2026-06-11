import { BACKGROUND_PRESETS } from "../constants";
import type { EditorAction } from "../editorReducer";
import { getTemplateById } from "../templates";
import styles from "../FashionCollageMaker.module.css";
import type { EditorState, SlotAdjustment } from "../types";
import { BackgroundPicker } from "./BackgroundPicker";
import { CanvasPreview } from "./CanvasPreview";
import { SlotControls } from "./SlotControls";
import { TemplatePicker } from "./TemplatePicker";

type EditorStepProps = {
  state: EditorState;
  messages: string[];
  disabled: boolean;
  exportDisabled: boolean;
  replacementStatus: "idle" | "normalizing";
  onAction: (action: EditorAction) => void;
  onReplaceActiveSlot: (file: File) => void;
  onExport: () => void;
  onStartOver: () => void;
};

function getSelectedSlotText(activeSlotIndex: EditorState["activeSlotIndex"]) {
  if (activeSlotIndex === null) {
    return "No slot selected. Select a photo in the preview to adjust crop and zoom.";
  }

  return `Slot ${activeSlotIndex + 1} selected. Drag inside the selected photo to adjust its crop.`;
}

function getActiveAdjustment(state: EditorState): SlotAdjustment | null {
  if (state.activeSlotIndex === null) {
    return null;
  }

  return state.slotAdjustments[state.activeSlotIndex];
}

export function EditorStep({
  state,
  messages,
  disabled,
  exportDisabled,
  replacementStatus,
  onAction,
  onReplaceActiveSlot,
  onExport,
  onStartOver
}: EditorStepProps) {
  const template = getTemplateById(state.templateId);
  const backgroundName =
    BACKGROUND_PRESETS.find((preset) => preset.color === state.backgroundColor)?.name ??
    "Custom color";
  const selectedImages = state.selectedImages;
  const isReplacing = replacementStatus === "normalizing";

  if (selectedImages === null) {
    return (
      <section className={styles.editorScreen} aria-labelledby="editor-title">
        <div className={styles.editorStatusPanel}>
          <p className={styles.kicker}>Editor unavailable</p>
          <h1 id="editor-title">Fashion Collage Maker</h1>
          <p className={styles.privacy}>Select 4 photos before editing.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.editorScreen} aria-labelledby="editor-title">
      <div className={styles.editorHeader}>
        <div>
          <p className={styles.kicker}>Local editor</p>
          <h1 id="editor-title">Fashion Collage Maker</h1>
        </div>
        <p className={styles.privacy}>Your photos stay in your browser.</p>
      </div>

      <div className={styles.editorWorkspace}>
        <div className={styles.previewColumn}>
          <CanvasPreview
            activeSlotIndex={state.activeSlotIndex}
            backgroundColor={state.backgroundColor}
            disabled={disabled}
            selectedImages={selectedImages}
            slotAdjustments={state.slotAdjustments}
            template={template}
            onSelectSlot={(slotIndex) =>
              onAction({ type: "selectActiveSlot", slotIndex })
            }
            onUpdateActiveSlot={(adjustment) =>
              onAction({ type: "updateActiveSlotAdjustment", adjustment })
            }
          />
          <div className={styles.editorStateText} aria-live="polite">
            <p>
              Template: {template.name}. Background: {backgroundName}.
            </p>
            <p>{getSelectedSlotText(state.activeSlotIndex)}</p>
          </div>
        </div>

        <aside className={styles.controlsPanel} aria-label="Collage controls">
          <TemplatePicker
            activeTemplateId={template.id}
            disabled={disabled}
            onChange={(templateId) =>
              onAction({ type: "switchTemplate", templateId })
            }
          />
          <BackgroundPicker
            activeColor={state.backgroundColor}
            disabled={disabled}
            onChange={(color) => onAction({ type: "changeBackground", color })}
          />
          <SlotControls
            activeSlotIndex={state.activeSlotIndex}
            adjustment={getActiveAdjustment(state)}
            disabled={disabled}
            isReplacing={isReplacing}
            onAction={onAction}
            onReplaceFile={onReplaceActiveSlot}
          />

          {messages.length > 0 && (
            <div className={styles.errors} role="status">
              {messages.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          )}

          <section className={styles.controlGroup} aria-labelledby="export-title">
            <h2 id="export-title">Export</h2>
            {disabled && (
              <p className={styles.status} role="status">
                Preparing export. Editing controls are disabled until it finishes.
              </p>
            )}
            {isReplacing && (
              <p className={styles.status} role="status">
                Replacing photo. Export will be available when it finishes.
              </p>
            )}
            {state.exportState === "error" && (
              <div className={styles.errors} role="alert">
                <p>Export failed. Retry or start over.</p>
              </div>
            )}
            <button
              className={styles.continueButton}
              type="button"
              onClick={onExport}
              disabled={exportDisabled}
            >
              {state.exportState === "rendering"
                ? "Preparing export"
                : isReplacing
                  ? "Replacing photo"
                : state.exportState === "error"
                  ? "Retry export"
                  : "Export PNG"}
            </button>
            {state.exportState === "error" && (
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={onStartOver}
              >
                Start over
              </button>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}
