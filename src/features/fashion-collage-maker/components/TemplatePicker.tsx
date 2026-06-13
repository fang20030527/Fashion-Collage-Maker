import { TEMPLATES } from "../templates";
import styles from "../FashionCollageMaker.module.css";
import type { TemplateSlot } from "../types";

type TemplatePickerProps = {
  activeTemplateId: string;
  availableImageCount: number;
  disabled: boolean;
  onChange: (templateId: string) => void;
};

function getLayerStyle(slot: TemplateSlot): React.CSSProperties {
  return {
    left: `${slot.x * 100}%`,
    top: `${slot.y * 100}%`,
    width: `${slot.width * 100}%`,
    height: `${slot.height * 100}%`,
    zIndex: slot.zIndex,
    transform: `rotate(${slot.rotation ?? 0}deg)`
  };
}

function formatPhotoCount(slotCount: number) {
  return `${slotCount} photo${slotCount === 1 ? "" : "s"}`;
}

export function TemplatePicker({
  activeTemplateId,
  availableImageCount,
  disabled,
  onChange
}: TemplatePickerProps) {
  return (
    <fieldset className={styles.controlGroup}>
      <legend>Composition</legend>
      <div className={styles.templateList} role="radiogroup">
        {TEMPLATES.map((template) => {
          const isSelected = template.id === activeTemplateId;
          const hasEnoughImages = availableImageCount >= template.slots.length;
          const isDisabled = disabled || !hasEnoughImages;

          return (
            <button
              key={template.id}
              className={`${styles.templateOption} ${
                isSelected ? styles.templateOptionSelected : ""
              }`}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={isDisabled}
              onClick={() => onChange(template.id)}
            >
              <span
                className={styles.templateThumb}
                style={{
                  aspectRatio: `${template.canvasWidth} / ${template.canvasHeight}`,
                  backgroundColor: template.defaultBackground
                }}
                aria-hidden="true"
              >
                {template.slots.map((slot) => (
                  <span
                    key={slot.id}
                    className={styles.templateThumbLayer}
                    style={getLayerStyle(slot)}
                  />
                ))}
              </span>
              <span>
                {template.name} / {formatPhotoCount(template.slots.length)}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
