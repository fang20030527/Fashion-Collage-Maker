import { useRef } from "react";

import { getCoverDrawRect, slotToPixelRect } from "../renderMath";
import styles from "../FashionCollageMaker.module.css";
import type {
  EditorState,
  SlotAdjustment,
  SlotAdjustments,
  SourceImage,
  TemplateConfig,
  TemplateSlot
} from "../types";

const PREVIEW_WIDTH = 1000;

type CanvasPreviewProps = {
  activeSlotIndex: EditorState["activeSlotIndex"];
  backgroundColor: string;
  disabled: boolean;
  selectedImages: SourceImage[];
  slotAdjustments: SlotAdjustments;
  template: TemplateConfig;
  onSelectSlot: (slotIndex: number) => void;
  onUpdateActiveSlot: (adjustment: Partial<SlotAdjustment>) => void;
};

type DragState = {
  pointerId: number;
  slotIndex: number;
  slotWidth: number;
  slotHeight: number;
  startX: number;
  startY: number;
  startPanX: number;
  startPanY: number;
};

function getPreviewHeight(template: TemplateConfig) {
  return PREVIEW_WIDTH * (template.canvasHeight / template.canvasWidth);
}

function getSlotStyle(slot: TemplateSlot): React.CSSProperties {
  return {
    left: `${slot.x * 100}%`,
    top: `${slot.y * 100}%`,
    width: `${slot.width * 100}%`,
    height: `${slot.height * 100}%`,
    zIndex: slot.zIndex,
    transform: `rotate(${slot.rotation ?? 0}deg)`,
    boxShadow: slot.shadow
      ? `${slot.shadow.offsetX / 5}px ${slot.shadow.offsetY / 5}px ${
          slot.shadow.blur / 5
        }px ${slot.shadow.color}`
      : undefined,
    borderColor: slot.borderColor,
    borderWidth: slot.borderWidth ? `${Math.max(1, slot.borderWidth / 5)}px` : undefined
  };
}

function getImageStyle(
  image: SourceImage,
  slot: TemplateSlot,
  adjustment: SlotAdjustment,
  template: TemplateConfig
): React.CSSProperties {
  const slotRect = slotToPixelRect(slot, PREVIEW_WIDTH, getPreviewHeight(template));
  const drawRect = getCoverDrawRect({
    imageSize: {
      width: image.width,
      height: image.height
    },
    slotRect,
    adjustment
  });

  return {
    left: `${((drawRect.x - slotRect.x) / slotRect.width) * 100}%`,
    top: `${((drawRect.y - slotRect.y) / slotRect.height) * 100}%`,
    width: `${(drawRect.width / slotRect.width) * 100}%`,
    height: `${(drawRect.height / slotRect.height) * 100}%`
  };
}

function clampPan(value: number) {
  return Math.min(1, Math.max(-1, value));
}

export function CanvasPreview({
  activeSlotIndex,
  backgroundColor,
  disabled,
  selectedImages,
  slotAdjustments,
  template,
  onSelectSlot,
  onUpdateActiveSlot
}: CanvasPreviewProps) {
  const dragState = useRef<DragState | null>(null);

  function handlePointerDown(
    event: React.PointerEvent<HTMLButtonElement>,
    slotIndex: number
  ) {
    if (disabled) {
      return;
    }

    if (!event.isPrimary) {
      return;
    }

    const slot = event.currentTarget;
    const rect = slot.getBoundingClientRect();
    const adjustment = slotAdjustments[slotIndex];

    onSelectSlot(slotIndex);
    slot.setPointerCapture(event.pointerId);
    dragState.current = {
      pointerId: event.pointerId,
      slotIndex,
      slotWidth: rect.width,
      slotHeight: rect.height,
      startX: event.clientX,
      startY: event.clientY,
      startPanX: adjustment.panX,
      startPanY: adjustment.panY
    };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragState.current;

    if (disabled) {
      dragState.current = null;
      return;
    }

    if (drag === null || drag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();

    onUpdateActiveSlot({
      panX: clampPan(drag.startPanX + (event.clientX - drag.startX) / drag.slotWidth),
      panY: clampPan(drag.startPanY + (event.clientY - drag.startY) / drag.slotHeight)
    });
  }

  function stopDragging(event: React.PointerEvent<HTMLButtonElement>) {
    if (disabled) {
      dragState.current = null;
      return;
    }

    if (dragState.current?.pointerId !== event.pointerId) {
      return;
    }

    dragState.current = null;
  }

  return (
    <div className={styles.previewShell}>
      <div
        className={styles.canvasPreview}
        style={{
          aspectRatio: `${template.canvasWidth} / ${template.canvasHeight}`,
          backgroundColor
        }}
        aria-label={`${template.name} collage preview`}
      >
        {template.slots.map((slot, index) => {
          const slotIndex = index;
          const isActive = activeSlotIndex === slotIndex;
          const image = selectedImages[slotIndex];
          const adjustment = slotAdjustments[slotIndex];

          if (!image || !adjustment) {
            return null;
          }

          return (
            <button
              key={slot.id}
              className={`${styles.previewSlot} ${
                isActive ? styles.previewSlotActive : ""
              }`}
              type="button"
              disabled={disabled}
              aria-disabled={disabled}
              style={getSlotStyle(slot)}
              onPointerDown={(event) => handlePointerDown(event, slotIndex)}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDragging}
              onPointerCancel={stopDragging}
              aria-pressed={isActive}
              aria-label={`Select layer ${slotIndex + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Preview uses blob URLs with dynamic crop rect styles. */}
              <img
                src={image.objectUrl}
                alt=""
                draggable={false}
                style={getImageStyle(image, slot, adjustment, template)}
              />
              <span className={styles.slotNumber}>{slotIndex + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
