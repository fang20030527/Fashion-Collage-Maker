# Fashion Collage Maker MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an English-language browser MVP that lets a fashion creator upload 4 to 9 local photos, select 4, edit crop/zoom in 4 editorial templates, export a 2160x2700 PNG, and review the local-only result.

**Architecture:** Use a client-heavy Next.js App Router app. Keep image validation, normalization, editor state, template definitions, canvas rendering, and UI steps in separate modules so the export renderer remains the source of truth and no server route ever receives user images.

**Tech Stack:** Next.js App Router, TypeScript, CSS Modules, native Canvas 2D API, Vitest for pure module tests, Playwright/manual browser checks for upload, drag, preview, and export behavior.

---

## File Structure

- Create `package.json`: scripts for `dev`, `build`, `lint`, `test`, and optional `test:e2e`.
- Create `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.ts`: project and test configuration.
- Create `src/app/layout.tsx`: root metadata and global shell.
- Create `src/app/page.tsx`: redirect or link to `/fashion-collage-maker`.
- Create `src/app/fashion-collage-maker/page.tsx`: tool route entry.
- Create `src/app/fashion-collage-maker/FashionCollageMaker.tsx`: client-side orchestration component.
- Create `src/app/privacy/page.tsx`: short English privacy page.
- Create `src/app/globals.css`: base styles.
- Create `src/features/fashion-collage-maker/types.ts`: shared domain types.
- Create `src/features/fashion-collage-maker/constants.ts`: canvas size, upload limits, formats, background presets.
- Create `src/features/fashion-collage-maker/templates.ts`: 4 template configs and validation helpers.
- Create `src/features/fashion-collage-maker/editorReducer.ts`: state transitions.
- Create `src/features/fashion-collage-maker/imageValidation.ts`: count, type, and size validation.
- Create `src/features/fashion-collage-maker/exifOrientation.ts`: minimal JPEG EXIF orientation parser.
- Create `src/features/fashion-collage-maker/imageNormalization.ts`: browser decode, orientation, resize, object URL creation.
- Create `src/features/fashion-collage-maker/renderMath.ts`: slot crop/zoom math shared by preview and export.
- Create `src/features/fashion-collage-maker/canvasRenderer.ts`: `renderCollageToCanvas(input)` implementation.
- Create `src/features/fashion-collage-maker/exportFilename.ts`: local date filename formatting.
- Create `src/features/fashion-collage-maker/analytics.ts`: no-op `trackEvent`.
- Create `src/features/fashion-collage-maker/components/UploadStep.tsx`: upload/drop area and upload errors.
- Create `src/features/fashion-collage-maker/components/SelectStep.tsx`: exactly-4 selection UI.
- Create `src/features/fashion-collage-maker/components/EditorStep.tsx`: editor layout and controls.
- Create `src/features/fashion-collage-maker/components/CanvasPreview.tsx`: interactive 4:5 preview and slot dragging.
- Create `src/features/fashion-collage-maker/components/TemplatePicker.tsx`: thumbnail/template chooser.
- Create `src/features/fashion-collage-maker/components/BackgroundPicker.tsx`: 6 preset swatches.
- Create `src/features/fashion-collage-maker/components/SlotControls.tsx`: zoom, replace, reset controls.
- Create `src/features/fashion-collage-maker/components/ResultStep.tsx`: exported preview, download, feedback, navigation.
- Create `src/features/fashion-collage-maker/FashionCollageMaker.module.css`: route-level CSS module.
- Create `public/fashion-collage/examples/*`: 4 local example images.
- Create `public/fashion-collage/templates/*`: 4 static template thumbnails.
- Create `src/features/fashion-collage-maker/__tests__/*.test.ts`: unit tests for templates, validation, reducer, math, filename, and renderer dimensions.

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

**Depends on:** None

- [ ] Scaffold a Next.js App Router TypeScript project in the repository root without Tailwind CSS, shadcn/ui, or a component library.
- [ ] Add scripts: `dev`, `build`, `lint`, `test`.
- [ ] Configure TypeScript path alias `@/*` to `src/*`.
- [ ] Configure Vitest to run TypeScript unit tests in a browser-like environment.
- [ ] Implement `src/app/page.tsx` as a small redirect/link surface to `/fashion-collage-maker`.
- [ ] Run `npm install`.
- [ ] Run `npm run lint`, `npm test`, and `npm run build`.

**Acceptance:**
- Visiting `/` provides a path into `/fashion-collage-maker`.
- `npm run build` completes before feature work begins.
- No Tailwind, shadcn/ui, image editor library, backend image route, database, auth, or upload API exists.

**Suggested commit:** `chore: scaffold fashion collage maker app`

## Task 2: Core Types, Constants, and Template Config

**Files:**
- Create: `src/features/fashion-collage-maker/types.ts`
- Create: `src/features/fashion-collage-maker/constants.ts`
- Create: `src/features/fashion-collage-maker/templates.ts`
- Create: `src/features/fashion-collage-maker/__tests__/templates.test.ts`

**Depends on:** Task 1

- [ ] Define `Step`, `ExportState`, `SourceImage`, `SlotAdjustment`, `EditorState`, `TemplateConfig`, `TemplateSlot`, and render input types.
- [ ] Add constants for `EXPORT_WIDTH = 2160`, `EXPORT_HEIGHT = 2700`, `MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024`, `MAX_UPLOAD_COUNT = 9`, `REQUIRED_IMAGE_COUNT = 4`, supported MIME types, and the 6 background presets from the spec.
- [ ] Add 4 templates: `editorial-hero`, `clean-grid`, `overlapped-print`, `lookbook-strip`.
- [ ] Ensure every template has 4 slots, normalized slot coordinates, a default background from the preset list, and distinct layout characteristics.
- [ ] Add template validation tests that fail if a template has the wrong slot count, invalid background, invalid slot bounds, duplicate id, or missing thumbnail path.
- [ ] Run `npm test -- templates`.

**Acceptance:**
- The template module can be imported by UI and renderer without browser-only APIs.
- At least one template has a dominant hero slot.
- At least one template includes overlap, light rotation, and shadow.
- At least one template is restrained and grid-like.

**Suggested commit:** `feat: define collage templates and domain types`

## Task 3: Upload Validation

**Files:**
- Create: `src/features/fashion-collage-maker/imageValidation.ts`
- Create: `src/features/fashion-collage-maker/__tests__/imageValidation.test.ts`

**Depends on:** Task 2

- [ ] Implement validation for upload count: fewer than 4 valid images produces `too_few_images`; more than 9 selected files keeps the first 9 and returns a visible `too_many_images` message.
- [ ] Implement validation for per-file size over 15MB as `file_too_large`.
- [ ] Implement supported MIME checks for JPG, PNG, and WebP.
- [ ] Treat unknown or HEIC-like files as candidates for browser-native decoding rather than promising support.
- [ ] Return structured validation results with accepted files, rejected files, and visible user messages.
- [ ] Test exactly 4 files, 5 to 9 files, more than 9 files, oversized file rejection, unsupported obvious text/PDF files, and mixed accepted/rejected files.
- [ ] Run `npm test -- imageValidation`.

**Acceptance:**
- Validation never silently drops files.
- The first 9 selected files are the only candidates when users select more than 9.
- Error copy can be rendered without additional mapping logic in the UI.

**Suggested commit:** `feat: validate local image uploads`

## Task 4: Image Decode, EXIF Orientation, and Normalization

**Files:**
- Create: `src/features/fashion-collage-maker/exifOrientation.ts`
- Create: `src/features/fashion-collage-maker/imageNormalization.ts`
- Create: `src/features/fashion-collage-maker/__tests__/exifOrientation.test.ts`

**Depends on:** Task 3

- [ ] Implement a minimal JPEG EXIF orientation parser for orientation values `1`, `3`, `6`, and `8`.
- [ ] Add tests using small ArrayBuffer fixtures for no EXIF, orientation 1, orientation 3, orientation 6, and orientation 8.
- [ ] Implement browser-only normalization that decodes an image, applies supported EXIF orientation when available, resizes so the longest edge is at most 3000px, and returns a `SourceImage` with an object URL.
- [ ] Return `unsupported_format` when browser decode fails.
- [ ] Return `normalization_failed` when canvas resize or blob creation fails.
- [ ] Keep original filenames and EXIF metadata out of `SourceImage`.
- [ ] Run `npm test -- exifOrientation`.

**Acceptance:**
- JPEG orientation failure does not block a decodable image.
- Normalized working images are used for preview/export, not the original file objects.
- Object URLs are created only for browser-local blobs.

**Suggested commit:** `feat: normalize images locally in browser`

## Task 5: Editor State Reducer

**Files:**
- Create: `src/features/fashion-collage-maker/editorReducer.ts`
- Create: `src/features/fashion-collage-maker/__tests__/editorReducer.test.ts`

**Depends on:** Task 2

- [ ] Implement initial state with `step: "upload"`, default template, default background, 4 default slot adjustments, no images, no export result, and no active slot.
- [ ] Implement upload completion: 4 valid images moves directly to `edit`; 5 to 9 valid images moves to `select`.
- [ ] Implement selection order: exactly 4 selected images fill editor slots by user selection order.
- [ ] Implement template switch: preserve images and background, reset all slot pan/zoom, clear active slot.
- [ ] Implement background change using preset colors only.
- [ ] Implement active slot selection, slot pan/zoom update, selected slot replace, selected slot reset, export success/error, back to edit, and start over.
- [ ] Implement state cleanup hooks that callers can use to revoke old export Blob URLs.
- [ ] Test upload-to-edit, upload-to-select, select-to-edit, invalid select count, template switch reset behavior, slot reset behavior, replace behavior, back-to-edit preservation, and start-over clearing.
- [ ] Run `npm test -- editorReducer`.

**Acceptance:**
- `selectedImages` is always exactly 4 in `edit` and `result`.
- No reducer action creates persistent project state or localStorage writes.
- Template switching never asks for confirmation.

**Suggested commit:** `feat: add editor state machine`

## Task 6: Render Math Shared by Preview and Export

**Files:**
- Create: `src/features/fashion-collage-maker/renderMath.ts`
- Create: `src/features/fashion-collage-maker/__tests__/renderMath.test.ts`

**Depends on:** Task 2

- [ ] Implement conversion from normalized slot coordinates to pixel rectangles for any target canvas size.
- [ ] Implement cover-fit image drawing math with pan and zoom.
- [ ] Clamp zoom so a slot is always covered and no transparent gaps appear inside the slot.
- [ ] Add tests for landscape image in portrait slot, portrait image in landscape slot, zoom above minimum, pan offsets, and 2160x2700 target dimensions.
- [ ] Run `npm test -- renderMath`.

**Acceptance:**
- Preview and canvas export can call the same math helpers.
- Math helpers do not import React, DOM components, or Next.js modules.

**Suggested commit:** `feat: share preview and export render math`

## Task 7: Canvas Renderer and PNG Export Source of Truth

**Files:**
- Create: `src/features/fashion-collage-maker/canvasRenderer.ts`
- Create: `src/features/fashion-collage-maker/__tests__/canvasRenderer.test.ts`

**Depends on:** Task 2, Task 6

- [ ] Implement `renderCollageToCanvas(input): HTMLCanvasElement | Promise<HTMLCanvasElement>`.
- [ ] Draw the selected solid background first.
- [ ] Draw all 4 images with slot clipping, pan, zoom, template rotation, template shadows, and template borders where the template config requires them.
- [ ] Ensure the returned canvas width is `2160` and height is `2700`.
- [ ] Fail with an export error if any selected image is missing or cannot be drawn.
- [ ] Add automated tests for output dimensions and required draw sequence using test doubles for canvas context where native canvas is unavailable.
- [ ] Run `npm test -- canvasRenderer`.

**Acceptance:**
- Export uses Canvas, not DOM screenshot, `html2canvas`, WebGL, JPG encoding, or transparent background.
- Renderer accepts normalized local images and never calls a server.

**Suggested commit:** `feat: render collage exports with canvas`

## Task 8: Static Example Images and Template Thumbnails

**Files:**
- Create: `public/fashion-collage/examples/example-1.png`
- Create: `public/fashion-collage/examples/example-2.png`
- Create: `public/fashion-collage/examples/example-3.png`
- Create: `public/fashion-collage/examples/example-4.png`
- Create: `public/fashion-collage/templates/editorial-hero.png`
- Create: `public/fashion-collage/templates/clean-grid.png`
- Create: `public/fashion-collage/templates/overlapped-print.png`
- Create: `public/fashion-collage/templates/lookbook-strip.png`

**Depends on:** Task 2, Task 7

- [ ] Generate or create 4 local example fashion-style images with no celebrity likeness, no influencer photo, no real brand logo, and no hotlinked third-party asset.
- [ ] Generate 4 static thumbnails that visually approximate the final output for each template.
- [ ] Check thumbnails at small size to confirm all 4 templates are visually distinct.
- [ ] Commit the source/license note in `public/fashion-collage/ASSET_NOTES.md`.

**Acceptance:**
- Template thumbnails do not create a bait-and-switch compared with exported output.
- No external image URL is required at runtime.
- Asset notes document that images are self-made or AI-generated local assets.

**Suggested commit:** `feat: add local template preview assets`

## Task 9: Tool Route, Upload Step, and Selection Step

**Files:**
- Create: `src/app/fashion-collage-maker/page.tsx`
- Create: `src/app/fashion-collage-maker/FashionCollageMaker.tsx`
- Create: `src/features/fashion-collage-maker/components/UploadStep.tsx`
- Create: `src/features/fashion-collage-maker/components/SelectStep.tsx`
- Create: `src/features/fashion-collage-maker/FashionCollageMaker.module.css`

**Depends on:** Task 3, Task 4, Task 5

- [ ] Build `/fashion-collage-maker` as the first-screen tool entry, not a marketing landing page.
- [ ] Render the required title `Fashion Collage Maker`, subtitle `Create an editorial outfit collage from 4 photos.`, and privacy note `Your photos stay in your browser.`
- [ ] Implement click upload and drag/drop upload.
- [ ] Show visible validation and normalization errors.
- [ ] Skip selection when exactly 4 valid images are uploaded.
- [ ] Show the selection step when 5 to 9 valid images are available.
- [ ] Implement exactly-4 selection with count text such as `2 of 4 selected`.
- [ ] Disable `Continue` until exactly 4 images are selected.
- [ ] Fill editor slots by selection order.

**Acceptance:**
- First viewport contains the upload experience and a static example/template preview.
- No login, pricing, blog, account navigation, or multiple calls to action appear.
- File input is usable by click and drag/drop.

**Suggested commit:** `feat: build upload and image selection flow`

## Task 10: Editor UI and Interactive Preview

**Files:**
- Create: `src/features/fashion-collage-maker/components/EditorStep.tsx`
- Create: `src/features/fashion-collage-maker/components/CanvasPreview.tsx`
- Create: `src/features/fashion-collage-maker/components/TemplatePicker.tsx`
- Create: `src/features/fashion-collage-maker/components/BackgroundPicker.tsx`
- Create: `src/features/fashion-collage-maker/components/SlotControls.tsx`
- Modify: `src/features/fashion-collage-maker/FashionCollageMaker.module.css`

**Depends on:** Task 2, Task 5, Task 6, Task 8

- [ ] Build desktop layout with preview on the left and controls on the right.
- [ ] Build mobile layout with preview on top and controls below.
- [ ] Keep the preview area in a stable 4:5 ratio while controls expand or collapse.
- [ ] Implement control order: template selection, background color, active slot controls, export action.
- [ ] Implement accessible template selection with static thumbnails.
- [ ] Implement background swatches for the 6 presets with accessible labels.
- [ ] Implement slot selection from the preview.
- [ ] Implement mouse and one-finger drag to adjust crop position only inside the selected slot.
- [ ] Prevent page scroll while dragging inside the preview on touch devices.
- [ ] Implement zoom slider, replace, and reset controls only when a slot is selected.
- [ ] Show adjacent visible text describing the current template and selected slot state.

**Acceptance:**
- Mobile controls do not cover the important canvas area.
- Template change resets pan/zoom and clears active slot.
- Preview interaction does not mutate source image data.

**Suggested commit:** `feat: build editor controls and crop preview`

## Task 11: Replace, Reset, Export, Result, and Feedback Flow

**Files:**
- Create: `src/features/fashion-collage-maker/components/ResultStep.tsx`
- Create: `src/features/fashion-collage-maker/exportFilename.ts`
- Create: `src/features/fashion-collage-maker/__tests__/exportFilename.test.ts`
- Modify: `src/app/fashion-collage-maker/FashionCollageMaker.tsx`
- Modify: `src/features/fashion-collage-maker/components/SlotControls.tsx`
- Modify: `src/features/fashion-collage-maker/components/EditorStep.tsx`

**Depends on:** Task 4, Task 5, Task 7, Task 10

- [ ] Implement selected-slot replacement with one local file, full validation, full normalization, and slot pan/zoom reset.
- [ ] Ensure replacement never uses unused uploaded images as a source pool.
- [ ] Implement `Reset slot` as active slot pan/zoom reset only.
- [ ] Implement `Export PNG`: set rendering state, render 2160x2700 PNG, create local Blob URL, and move to result.
- [ ] Implement `export_failed` UI with Retry and Start over.
- [ ] Implement result preview, `Download PNG`, `Back to edit`, and `Start over`.
- [ ] Implement `<a download>` with filename `fashion-collage-YYYYMMDD.png` using the user's local timezone.
- [ ] Implement local-only feedback UI: `How did it look?`, 1 to 5 rating, optional text field, no submission.
- [ ] Revoke old export Blob URLs when a new export is created, when returning to edit if replaced, and when starting over.
- [ ] Add filename formatting tests for local dates.
- [ ] Run `npm test -- exportFilename`.

**Acceptance:**
- Download is user-initiated and never auto-starts.
- Back to edit preserves current edit state.
- Start over clears images, selected template, edits, export result, and feedback state.

**Suggested commit:** `feat: complete export result flow`

## Task 12: Privacy Page, Metadata, Analytics Stub, and Unsaved Warning

**Files:**
- Create: `src/app/privacy/page.tsx`
- Create: `src/features/fashion-collage-maker/analytics.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/fashion-collage-maker/FashionCollageMaker.tsx`

**Depends on:** Task 5, Task 9, Task 11

- [ ] Add a short English `/privacy` page explaining that user photos stay in the browser and are not uploaded to a server.
- [ ] State that images, image filenames, EXIF metadata, accounts, and saved projects are not collected.
- [ ] Avoid generic legal copy that contradicts the no-upload MVP.
- [ ] Add `trackEvent(name, payload)` as a no-op integration point.
- [ ] Call `trackEvent` at meaningful points such as upload completion, template selection, export success, export failure, and local feedback change without transmitting anything.
- [ ] Add `beforeunload` confirmation in edit/result steps where supported.
- [ ] Add SEO metadata for the tool and privacy pages.

**Acceptance:**
- No real analytics provider is installed or configured.
- No cookies are used for the MVP.
- Privacy copy does not mention planned analytics or server feedback.

**Suggested commit:** `feat: add privacy and no-op analytics`

## Task 13: Automated Test Coverage Pass

**Files:**
- Modify: `src/features/fashion-collage-maker/__tests__/templates.test.ts`
- Modify: `src/features/fashion-collage-maker/__tests__/imageValidation.test.ts`
- Modify: `src/features/fashion-collage-maker/__tests__/editorReducer.test.ts`
- Modify: `src/features/fashion-collage-maker/__tests__/renderMath.test.ts`
- Modify: `src/features/fashion-collage-maker/__tests__/canvasRenderer.test.ts`
- Modify: `src/features/fashion-collage-maker/__tests__/exportFilename.test.ts`

**Depends on:** Task 2 through Task 12

- [ ] Confirm tests cover template config validation.
- [ ] Confirm tests cover upload/select/edit/result state transitions.
- [ ] Confirm tests cover file count and file size validation.
- [ ] Confirm tests cover slot adjustment reset behavior.
- [ ] Confirm tests cover template switch behavior.
- [ ] Confirm tests cover export filename formatting.
- [ ] Confirm tests cover renderer output dimensions.
- [ ] Run `npm test`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

**Acceptance:**
- Automated coverage matches the spec's automated test list.
- Any intentionally manual-only behavior is listed in Task 14.

**Suggested commit:** `test: cover collage maker core behavior`

## Task 14: Browser, Mobile, and Visual QA

**Files:**
- Create: `docs/qa/fashion-collage-maker-manual-checklist.md`
- Modify: `src/features/fashion-collage-maker/FashionCollageMaker.module.css` if layout issues are found
- Modify: feature files only if QA finds a behavior bug

**Depends on:** Task 13

- [ ] Document manual test steps for Desktop Chrome: upload 4 JPG images, switch all 4 templates, export PNG.
- [ ] Document manual test steps for Desktop Safari: same flow, export PNG.
- [ ] Document manual test steps for iOS Safari: upload 4 phone photos, drag crop, adjust zoom, export PNG.
- [ ] Document manual test steps for Android Chrome: upload 4 phone photos, export PNG.
- [ ] Test large image pressure with 4 images close to 15MB each.
- [ ] Compare exported PNG against the main preview for missing images, misalignment, exposed background inside slots, orientation mistakes, transparent areas, and jagged obvious edges.
- [ ] Verify all buttons and controls have accessible labels.
- [ ] Verify template selection is keyboard reachable.
- [ ] Verify background swatches have text or accessible labels.
- [ ] Verify export and error states are announced in visible text.
- [ ] Verify mobile preview remains usable and controls do not cover the composition.
- [ ] Save QA notes with browser/device/date and pass/fail status.

**Acceptance:**
- MVP release is blocked until Chrome, Safari, iOS Safari, Android Chrome, large-image pressure, and export consistency checks have a recorded result.
- Any failure has a linked follow-up change or an explicit release-blocking note.

**Suggested commit:** `docs: add collage maker manual qa checklist`

## Recommended Execution Order

1. Task 1
2. Task 2
3. Task 3 and Task 5 in parallel
4. Task 4
5. Task 6
6. Task 7
7. Task 8
8. Task 9
9. Task 10
10. Task 11
11. Task 12
12. Task 13
13. Task 14

## MVP Non-Goals Guardrail

Do not add these during the tasks above: multi-ratio support, JPG export, runtime template thumbnail rendering, real analytics, feedback backend, image upload API, account system, local project persistence, complex image pool, free layout editor, pinch zoom, text/sticker/filter features, Tailwind CSS, shadcn/ui, or component library migration.

## Self-Review Notes

- Spec coverage: the plan covers routes, upload limits, image validation, normalization, selection, editor layout, editing behavior, background presets, templates, static thumbnails, canvas export, result flow, state model, error classes, privacy, analytics no-op, feedback, accessibility, automated tests, and manual QA.
- Known manual risk areas: iOS Safari memory behavior, browser-specific image decoding, touch drag versus page scroll, preview/export visual drift, and rotated canvas clipping.
- Project state: the repository currently contains the spec document only, so Task 1 starts from a fresh app scaffold rather than modifying an existing Next.js codebase.
