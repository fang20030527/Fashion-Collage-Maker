import { EXPORT_HEIGHT, EXPORT_WIDTH } from "./constants";
import { getCoverDrawRect, slotToPixelRect } from "./renderMath";
import type { RenderInput, SourceImage } from "./types";

export type RenderableSourceImage = SourceImage & {
  element?: CanvasImageSource;
};

export type RenderableSelectedImages = readonly [
  RenderableSourceImage,
  RenderableSourceImage,
  RenderableSourceImage,
  RenderableSourceImage
];

export type CanvasRenderInput = Omit<
  RenderInput,
  "selectedImages" | "width" | "height"
> & {
  selectedImages: RenderableSelectedImages;
};

export type CollageRenderErrorCode = "export_failed";

export class CollageRenderError extends Error {
  readonly code: CollageRenderErrorCode = "export_failed";

  constructor(message = "Collage export failed.", options?: ErrorOptions) {
    super(message, options);
    this.name = "CollageRenderError";
  }
}

export async function renderCollageToCanvas(
  input: CanvasRenderInput
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");

  canvas.width = EXPORT_WIDTH;
  canvas.height = EXPORT_HEIGHT;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new CollageRenderError("Canvas context is unavailable.");
  }

  context.fillStyle = input.backgroundColor;
  context.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

  for (const [index, slot] of input.template.slots.entries()) {
    const image = input.selectedImages[index];
    assertRenderableImage(image);

    const element = await getDrawableImage(image);
    const slotRect = slotToPixelRect(slot, EXPORT_WIDTH, EXPORT_HEIGHT);
    const slotCenterX = slotRect.x + slotRect.width / 2;
    const slotCenterY = slotRect.y + slotRect.height / 2;
    const localSlotX = -slotRect.width / 2;
    const localSlotY = -slotRect.height / 2;
    const drawRect = getCoverDrawRect({
      imageSize: {
        width: image.width,
        height: image.height
      },
      slotRect,
      adjustment: input.slotAdjustments[index]
    });

    context.save();

    try {
      context.translate(slotCenterX, slotCenterY);
      context.rotate(degreesToRadians(slot.rotation ?? 0));

      if (slot.shadow) {
        context.save();
        context.shadowColor = slot.shadow.color;
        context.shadowBlur = slot.shadow.blur;
        context.shadowOffsetX = slot.shadow.offsetX;
        context.shadowOffsetY = slot.shadow.offsetY;
        context.fillStyle = input.backgroundColor;
        context.fillRect(localSlotX, localSlotY, slotRect.width, slotRect.height);
        context.restore();
      }

      context.beginPath();
      context.rect(localSlotX, localSlotY, slotRect.width, slotRect.height);
      context.clip();

      try {
        context.drawImage(
          element,
          drawRect.x - slotCenterX,
          drawRect.y - slotCenterY,
          drawRect.width,
          drawRect.height
        );
      } catch (error) {
        throw new CollageRenderError("A selected image could not be drawn.", {
          cause: error
        });
      }

      if (slot.borderColor && slot.borderWidth && slot.borderWidth > 0) {
        const inset = slot.borderWidth / 2;

        context.strokeStyle = slot.borderColor;
        context.lineWidth = slot.borderWidth;
        context.strokeRect(
          localSlotX + inset,
          localSlotY + inset,
          Math.max(0, slotRect.width - slot.borderWidth),
          Math.max(0, slotRect.height - slot.borderWidth)
        );
      }
    } finally {
      context.restore();
    }
  }

  return canvas;
}

async function getDrawableImage(
  image: RenderableSourceImage
): Promise<CanvasImageSource> {
  if (image.element) {
    return image.element;
  }

  if (!image.objectUrl) {
    throw new CollageRenderError("A selected image is missing a drawable source.");
  }

  try {
    return await loadImageElement(image.objectUrl);
  } catch (error) {
    throw new CollageRenderError("A selected image could not be loaded.", {
      cause: error
    });
  }
}

function assertRenderableImage(
  image: RenderableSourceImage | undefined
): asserts image is RenderableSourceImage {
  if (!image) {
    throw new CollageRenderError("A selected image is missing.");
  }
}

function loadImageElement(objectUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    if (typeof Image !== "function") {
      reject(new Error("Image constructor is unavailable."));
      return;
    }

    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image decode failed."));
    image.src = objectUrl;
  });
}

function degreesToRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}
