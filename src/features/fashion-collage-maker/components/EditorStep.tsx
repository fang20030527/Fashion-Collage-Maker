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
            onChange={(templateId) =>
              onAction({ type: "switchTemplate", templateId })
            }
          />
          <BackgroundPicker
            activeColor={state.backgroundColor}
            onChange={(color) => onAction({ type: "changeBackground", color })}
          />
          <SlotControls
            activeSlotIndex={state.activeSlotIndex}
            adjustment={getActiveAdjustment(state)}
            isReplacing={replacementStatus === "normalizing"}
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
            {state.exportState === "error" && (
              <div className={styles.errors} role="alert">
                <p>Export failed. Retry or start over.</p>
              </div>
            )}
            <button
              className={styles.continueButton}
              type="button"
              onClick={onExport}
              disabled={state.exportState === "rendering"}
            >
              {state.exportState === "rendering"
                ? "Preparing export"
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
