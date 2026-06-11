import Image from "next/image";

import { TEMPLATES } from "../templates";
import styles from "../FashionCollageMaker.module.css";

type TemplatePickerProps = {
  activeTemplateId: string;
  disabled: boolean;
  onChange: (templateId: string) => void;
};

export function TemplatePicker({
  activeTemplateId,
  disabled,
  onChange
}: TemplatePickerProps) {
  return (
    <fieldset className={styles.controlGroup}>
      <legend>Template</legend>
      <div className={styles.templateList} role="radiogroup">
        {TEMPLATES.map((template) => {
          const isSelected = template.id === activeTemplateId;

          return (
            <button
              key={template.id}
              className={`${styles.templateOption} ${
                isSelected ? styles.templateOptionSelected : ""
              }`}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onChange(template.id)}
            >
              <span className={styles.templateThumb}>
                <Image
                  src={template.thumbnailSrc}
                  alt=""
                  width={160}
                  height={200}
                />
              </span>
              <span>{template.name}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
