import { BACKGROUND_PRESETS } from "./constants";
import type { TemplateConfig } from "./types";

const thumbnailBasePath = "/fashion-collage/templates";

export const TEMPLATES = [
  {
    id: "editorial-hero",
    name: "Editorial Hero",
    thumbnailSrc: `${thumbnailBasePath}/editorial-hero.png`,
    defaultBackground: BACKGROUND_PRESETS[0].color,
    slots: [
      {
        id: "hero",
        x: 0.08,
        y: 0.06,
        width: 0.58,
        height: 0.64,
        shadow: {
          color: "rgba(17, 17, 17, 0.16)",
          blur: 36,
          offsetX: 0,
          offsetY: 18
        }
      },
      { id: "top-right", x: 0.69, y: 0.1, width: 0.23, height: 0.26 },
      { id: "middle-right", x: 0.69, y: 0.41, width: 0.23, height: 0.26 },
      { id: "bottom-wide", x: 0.18, y: 0.74, width: 0.64, height: 0.18 }
    ]
  },
  {
    id: "clean-grid",
    name: "Clean Grid",
    thumbnailSrc: `${thumbnailBasePath}/clean-grid.png`,
    defaultBackground: BACKGROUND_PRESETS[1].color,
    slots: [
      { id: "top-left", x: 0.08, y: 0.08, width: 0.4, height: 0.39 },
      { id: "top-right", x: 0.52, y: 0.08, width: 0.4, height: 0.39 },
      { id: "bottom-left", x: 0.08, y: 0.53, width: 0.4, height: 0.39 },
      { id: "bottom-right", x: 0.52, y: 0.53, width: 0.4, height: 0.39 }
    ]
  },
  {
    id: "overlapped-print",
    name: "Overlapped Print",
    thumbnailSrc: `${thumbnailBasePath}/overlapped-print.png`,
    defaultBackground: BACKGROUND_PRESETS[2].color,
    slots: [
      {
        id: "left-card",
        x: 0.09,
        y: 0.13,
        width: 0.42,
        height: 0.46,
        rotation: -3,
        borderColor: "#F7F3ED",
        borderWidth: 18,
        shadow: {
          color: "rgba(17, 17, 17, 0.2)",
          blur: 34,
          offsetX: 0,
          offsetY: 18
        }
      },
      {
        id: "right-card",
        x: 0.43,
        y: 0.17,
        width: 0.46,
        height: 0.5,
        rotation: 2.5,
        borderColor: "#F7F3ED",
        borderWidth: 18,
        shadow: {
          color: "rgba(17, 17, 17, 0.18)",
          blur: 30,
          offsetX: 0,
          offsetY: 16
        }
      },
      {
        id: "lower-left",
        x: 0.17,
        y: 0.58,
        width: 0.31,
        height: 0.29,
        rotation: 1.5,
        borderColor: "#F7F3ED",
        borderWidth: 14,
        shadow: {
          color: "rgba(17, 17, 17, 0.14)",
          blur: 24,
          offsetX: 0,
          offsetY: 12
        }
      },
      {
        id: "lower-right",
        x: 0.52,
        y: 0.62,
        width: 0.31,
        height: 0.27,
        rotation: -1.5,
        borderColor: "#F7F3ED",
        borderWidth: 14
      }
    ]
  },
  {
    id: "lookbook-strip",
    name: "Lookbook Strip",
    thumbnailSrc: `${thumbnailBasePath}/lookbook-strip.png`,
    defaultBackground: BACKGROUND_PRESETS[5].color,
    slots: [
      { id: "top-strip", x: 0.12, y: 0.07, width: 0.76, height: 0.22 },
      { id: "upper-middle", x: 0.12, y: 0.32, width: 0.76, height: 0.2 },
      { id: "lower-middle", x: 0.12, y: 0.55, width: 0.76, height: 0.2 },
      { id: "bottom-strip", x: 0.12, y: 0.78, width: 0.76, height: 0.15 }
    ]
  }
] as const satisfies readonly TemplateConfig[];

export type TemplateId = (typeof TEMPLATES)[number]["id"];

export const DEFAULT_TEMPLATE_ID: TemplateId = "editorial-hero";

export function getTemplateById(templateId: string): TemplateConfig {
  return TEMPLATES.find((template) => template.id === templateId) ?? TEMPLATES[0];
}
