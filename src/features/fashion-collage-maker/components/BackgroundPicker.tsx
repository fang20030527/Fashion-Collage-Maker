import { BACKGROUND_PRESETS } from "../constants";
import styles from "../FashionCollageMaker.module.css";

type BackgroundPickerProps = {
  activeColor: string;
  onChange: (color: string) => void;
};

export function BackgroundPicker({
  activeColor,
  onChange
}: BackgroundPickerProps) {
  return (
    <fieldset className={styles.controlGroup}>
      <legend>Background color</legend>
      <div className={styles.swatchList} role="radiogroup">
        {BACKGROUND_PRESETS.map((preset) => {
          const isSelected = preset.color === activeColor;

          return (
            <button
              key={preset.id}
              className={`${styles.swatchButton} ${
                isSelected ? styles.swatchButtonSelected : ""
              }`}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={preset.name}
              title={preset.name}
              style={{ backgroundColor: preset.color }}
              onClick={() => onChange(preset.color)}
            />
          );
        })}
      </div>
    </fieldset>
  );
}
