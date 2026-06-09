# Fashion Collage Maker MVP Design

Date: 2026-06-09

## Decision Summary

Build the narrowest useful MVP for validating one claim:

> A fashion creator will upload 4 outfit photos and complete export because the templates look editorial enough.

This is not a general collage editor. The first version deliberately avoids multi-size support, free layout, complex image pools, persistent projects, analytics, and backend image processing.

## Product Goal

Fashion Collage Maker is an English-language browser tool for creating one Instagram feed-ready fashion collage from 4 photos.

Primary user:

- Fashion creator, blogger, or visual social media user.
- Has 4 outfit, street-style, detail, or travel-fashion photos.
- Wants a polished editorial collage quickly.
- Does not want to upload photos to a server.

Primary validation:

- Users upload photos, choose a template, adjust crop/scale, export a PNG, and rate the result as visually acceptable.

Primary success signal:

- Upload-to-export completion rate.

Reserved signals if analytics is added after MVP:

- Template selection.
- Export failure rate.
- Local-only feedback rating.
- Qualitative visual review of exported images.

## Route and Page Scope

Routes:

- `/fashion-collage-maker`: the tool.
- `/privacy`: short English privacy page describing current MVP behavior.

The tool route uses internal step state rather than multiple app routes.

Steps:

1. `upload`
2. `select` when more than 4 valid images are available
3. `edit`
4. `result`

The first viewport of `/fashion-collage-maker` is the tool entry, not a marketing landing page.

Allowed first-screen content:

- Small brand/header bar.
- Tool upload area.
- Title: `Fashion Collage Maker`.
- Subtitle: `Create an editorial outfit collage from 4 photos.`
- Privacy note: `Your photos stay in your browser.`
- Static example or template preview.

Not included:

- Marketing hero page.
- Feature-card sections in the first viewport.
- Login, pricing, blog, or account navigation.
- Multiple calls to action.

## MVP Scope

Included:

- Fixed canvas ratio: `4:5`.
- Fixed export size: `2160x2700` PNG.
- Upload 4 to 9 images.
- Select exactly 4 images when more than 4 are uploaded.
- 4 editorial templates.
- Per-slot crop position by drag.
- Per-slot zoom by slider.
- Per-slot replace by selecting a new local file.
- Background color from 6 presets.
- Canvas-based export.
- Static template thumbnails.
- Short `/privacy` page.
- No-op analytics function.
- Local-only feedback UI after export.

Not included:

- Other canvas ratios.
- JPG export.
- 1x/2x selector.
- 3, 6, or 9 image layouts.
- Full image pool inside the editor.
- Drag-and-drop image reassignment between slots.
- Slot ordering UI.
- Free layout editing.
- User-controlled spacing, radius, shadow, rotation, or borders.
- Text, stickers, filters, video, Live Photo support, or multi-page collages.
- Undo/redo history.
- Project saving or restore after refresh.
- Login, payment, database, or image upload API.
- Real analytics provider.
- Real feedback submission.
- Cookie banner.
- Dark mode.
- Multilingual UI.

## Technical Stack

- Next.js App Router.
- TypeScript.
- CSS Modules.
- Native Canvas 2D API for final rendering.
- No Tailwind CSS.
- No shadcn/ui.
- No heavy image editor library.
- Allowed lightweight helper libraries: EXIF orientation parsing and file download helpers, only after implementation shows the native API path is brittle.

Server responsibility:

- Serve pages and static assets.
- Provide SEO metadata.
- Never receive, process, store, or proxy user images.

Client responsibility:

- Decode and normalize images.
- Manage editing state.
- Render previews.
- Export PNG.

## Image Handling

Supported formats:

- JPG.
- PNG.
- WebP.

HEIC:

- Not promised as supported.
- The app attempts browser-native decoding; if decoding succeeds, the image can continue through normal validation.
- If decoding fails, show a clear error asking the user to use JPG, PNG, or WebP.

File limit:

- Reject any single file over `15MB`.

Upload count:

- Accept up to 9 images.
- If more than 9 are selected, only the first 9 are considered and the rest are ignored with a visible message.

Normalization:

- Each accepted image is normalized locally in the browser before entering the editor.
- The normalized working image has a longest edge of at most `3000px`.
- Editing and export use the normalized working image, not the original file.
- For JPEG images, attempt to read EXIF Orientation and apply it during normalization. If EXIF cannot be read, keep the browser-decoded orientation and do not block the image for that reason alone.
- Export does not preserve EXIF metadata.

Failure behavior:

- If normalization fails, the app lets the user remove that image and upload a replacement.
- The app does not claim that every device can export every valid image set.

## Image Selection Flow

When 4 valid images are uploaded:

- Skip selection.
- Fill the 4 editor slots by upload order.

When 5 to 9 valid images are uploaded:

- Show a selection step.
- User selects exactly 4 images.
- Show count text such as `2 of 4 selected`.
- Enable `Continue` only when exactly 4 images are selected.
- Fill editor slots by selection order.

Not included:

- Sorting after selection.
- Drag ordering.
- AI hero image selection.
- Automatic quality-based selection.

## Editor Layout

Desktop:

- Main canvas preview on the left.
- Controls on the right.

Mobile:

- Canvas preview on top.
- Controls below.

Control order:

1. Template selection.
2. Background color.
3. Active slot controls.
4. Export action.

Active slot controls appear only when a slot is selected:

- Zoom slider.
- Replace.
- Reset slot.

Canvas preview area must keep a stable `4:5` visual ratio and not jump when controls expand.

## Editing Behavior

Each template has 4 fixed slots.

User can:

- Select a slot.
- Drag with mouse or one finger to adjust crop position.
- Use a slider to adjust image zoom.
- Replace the selected slot image using a local file picker.
- Reset the selected slot.
- Change background color using presets.
- Switch templates.
- Export PNG.
- Start over.

User cannot:

- Pinch zoom.
- Rotate images.
- Move, resize, or rotate template slots.
- Edit template spacing, radius, shadows, borders, or layout structure.
- Reassign images by dragging between slots.

Template switch behavior:

- Preserve the 4 selected images.
- Preserve the selected background color.
- Reset all slot pan and zoom.
- Clear active slot selection.
- Do not show a confirmation dialog.

Replace behavior:

- Opens local file picker.
- Accepts exactly one new image.
- Runs the same file validation and normalization.
- Replaces the current slot image.
- Resets that slot pan and zoom.
- Does not use unused uploaded images as a replacement source.

Reset behavior:

- `Reset slot` resets only the active slot pan and zoom.
- `Start over` clears all state and returns to upload.

## Background Colors

The first version uses only presets.

Presets:

- Warm White: `#F7F3ED`
- Soft Gray: `#E9E7E2`
- Pale Blush: `#F3E6E2`
- Ink Black: `#111111`
- Olive Gray: `#777568`
- Dusty Blue: `#DDE5EA`

Rules:

- Each template has a default background color.
- User can choose one of the 6 presets.
- No custom color picker.
- No transparent background.
- Exported PNG uses the selected solid background.

## Templates

The first version includes 4 templates, all for 4 images and `4:5` output.

Template hypotheses:

1. `Editorial Hero`: one dominant image with three supporting detail images.
2. `Clean Grid`: restrained layout with generous spacing for outfit details.
3. `Overlapped Print`: light overlap, subtle rotation, and shadow for a magazine clipping feel.
4. `Lookbook Strip`: vertical rhythm suited for full-body street-style photos.

Template implementation:

- Use lightweight template configuration plus one shared renderer.
- Template config defines required structural values such as id, name, slots, default background, rotation, and shadow.
- The renderer can use small `template.id` branches for visual details that do not justify a full template engine.

Not included:

- Backend template management.
- Full extensible schema.
- User-editable template structure.
- Runtime-generated template thumbnails.
- Parameterized paper texture system.
- Style tags or hero slot metadata unless directly needed by the renderer.

Thumbnail behavior:

- Use 4 static pre-generated thumbnails.
- Thumbnails must visually approximate the final template output closely enough that selecting a template does not feel like a bait-and-switch.
- Thumbnails use local bundled example images.
- Do not hotlink external image assets.

Example image rules:

- Use self-made or AI-generated local assets.
- Do not use celebrity or influencer photos.
- Do not include real brand logos.
- Do not use third-party images unless explicit commercial usage rights are documented in the project.

## Canvas Rendering and Export

Final export uses Canvas, not DOM screenshot.

Export function:

- `renderCollageToCanvas(input): HTMLCanvasElement | Promise<HTMLCanvasElement>`

Export target:

- Width: `2160`.
- Height: `2700`.
- Format: PNG.

Canvas renderer must draw:

- Solid background.
- All 4 images.
- Slot clipping.
- Pan and zoom.
- Template rotation.
- Template shadows.
- Template borders if used by a template.

Not included:

- `html2canvas`.
- DOM screenshot export.
- WebGL export.
- JPG encoding.
- Transparent PNG.
- Quality slider.

Preview:

- Interactive preview may use HTML/CSS layers where practical.
- The export renderer is the source of truth.
- Visual QA compares exported PNG against the main preview.

Memory handling:

- Use normalized images for rendering.
- Release old export Blob URLs when a new export is created or the result view is left.

## Export Result Flow

When user clicks `Export PNG`:

1. Set export state to `rendering`.
2. Render a `2160x2700` PNG.
3. Create a local Blob URL.
4. Move to `result` step.

Result step:

- Show exported preview.
- Show `Download PNG`.
- Show `Back to edit`.
- Show `Start over`.
- Show local-only feedback UI: `How did it look?` with 1 to 5 rating and a text field the user can leave blank.

Download:

- User must click `Download PNG`.
- Do not auto-download.
- Use `<a download>`.
- Filename: `fashion-collage-YYYYMMDD.png`.
- Date uses the user's local timezone.
- Filename does not include source file names, template name, or time-of-day.

Back to edit:

- Preserve current edit state.

Start over:

- Clear current images, selected template, edits, export result, and feedback state.

## State Model

Core state:

```ts
type Step = "upload" | "select" | "edit" | "result";
type ExportState = "idle" | "rendering" | "success" | "error";

type SourceImage = {
  id: string;
  objectUrl: string;
  width: number;
  height: number;
  originalFileSize: number;
  mimeType: string;
};

type SlotAdjustment = {
  panX: number;
  panY: number;
  zoom: number;
};

type EditorState = {
  step: Step;
  sourceImages: SourceImage[];
  selectedImages: [SourceImage, SourceImage, SourceImage, SourceImage] | null;
  templateId: string;
  slotAdjustments: [SlotAdjustment, SlotAdjustment, SlotAdjustment, SlotAdjustment];
  backgroundColor: string;
  activeSlotIndex: 0 | 1 | 2 | 3 | null;
  exportState: ExportState;
  exportBlobUrl: string | null;
};
```

State constraints:

- `selectedImages` is always exactly 4 images in edit and result steps.
- `sourceImages` is only used before editing and for diagnostics; it is not an editable image pool.
- No undo/redo history.
- No persistence to localStorage.
- Refreshing or closing the page loses the current edit.
- In edit and result steps, use a browser `beforeunload` confirmation where supported to warn that the current collage is not saved.

## Error Handling

The first version defines 6 recoverable error classes.

1. `too_few_images`
   - Trigger: fewer than 4 valid images.
   - Action: prompt user to upload more images.

2. `too_many_images`
   - Trigger: user selects more than 9 files.
   - Action: accept the first 9 and tell the user the rest were not added.

3. `file_too_large`
   - Trigger: single file over `15MB`.
   - Action: reject that file and ask for a smaller image.

4. `unsupported_format`
   - Trigger: image cannot be decoded.
   - Action: ask user to use JPG, PNG, or WebP.

5. `normalization_failed`
   - Trigger: local resizing or orientation correction fails.
   - Action: let user remove that image and upload a replacement.

6. `export_failed`
   - Trigger: Canvas rendering or PNG creation fails.
   - Action: show Retry and Start over.

The app must not hide export failure behind a generic loading state.

## Privacy and Analytics

Privacy promise:

- User photos stay in the browser.
- Photos are not uploaded to the server.

The app does not collect:

- Images.
- Image filenames.
- EXIF metadata.
- Accounts.
- Saved projects.

Analytics:

- Define a `trackEvent(name, payload)` integration point.
- MVP implementation is no-op.
- No real analytics provider is connected.
- No analytics events are transmitted.

Feedback:

- The result page shows a rating/text UI.
- MVP feedback is local-only.
- No feedback is submitted to a server.

Cookies:

- The app does not use cookies for the MVP.
- No cookie banner is needed for the MVP.

`/privacy` page content:

- Short English explanation of the current MVP behavior.
- No claims about planned analytics.
- No generic legal copy that contradicts the no-upload MVP.

## Accessibility and Usability

Minimum requirements:

- All buttons and controls have accessible labels.
- Template selection is keyboard reachable.
- Background swatches include text or accessible labels.
- File input is usable by click and drag/drop.
- Export and error states are announced in visible text.
- Canvas preview has adjacent text describing the current template and selected slot state.

Mobile usability:

- One-finger drag adjusts crop only inside the selected slot.
- The page must not accidentally scroll while dragging inside the canvas.
- Main controls must not cover the important canvas area.

## Visual Acceptance Criteria

Templates and UI must pass these checks:

- The 4 templates are visually distinct at thumbnail size.
- At least one template has a clear hero image.
- At least one template uses overlap, light rotation, and shadow.
- At least one template is restrained and grid-like.
- Default backgrounds feel editorial and are not plain browser white by default.
- Exported images do not show missing images, visible clipping gaps, unintended transparent areas, jagged obvious edges, or wrong orientation.
- With 4 real outfit photos, visual review must reject any template result that reads as a generic grid collage.
- Mobile preview keeps the canvas usable without controls covering the composition.

## Technical Acceptance Criteria

Before release, verify:

1. Desktop Chrome: upload 4 JPG images, switch all 4 templates, export PNG successfully.
2. Desktop Safari: same flow, export PNG successfully.
3. iOS Safari: upload 4 phone photos, drag crop, adjust zoom, export PNG successfully.
4. Android Chrome: upload 4 phone photos and export PNG successfully.
5. Large image pressure: 4 images close to `15MB` each either normalize and enter edit or show a clear recoverable error.
6. Export consistency: exported PNG visually matches the main preview with no missing images, obvious misalignment, exposed background inside slots, or rotation/orientation mistakes.

Automated tests must cover, where the code boundary can run outside a real browser:

- Template config validation.
- State transitions between upload/select/edit/result.
- File count and file size validation.
- Slot adjustment reset behavior.
- Template switch behavior.
- Export filename formatting.
- Rendering function basic output dimensions.

Manual tests cover:

- Real mobile browser behavior.
- Drag interactions.
- Visual quality of exported templates.
- Browser-specific file decoding behavior.

## Implementation Boundaries

The implementation will be split into focused modules:

- Template definitions.
- Image validation and normalization.
- Editor state management.
- Canvas rendering.
- UI steps.
- Privacy page.
- No-op analytics.

Each module must expose a small interface and avoid owning unrelated behavior.

Expected high-risk areas:

- iOS Safari memory behavior.
- EXIF orientation handling.
- Preview/export visual drift.
- Touch drag versus page scroll.
- Canvas clipping for rotated slots.

Development starts with a runnable Canvas template/export prototype before polishing the full editor UI.

## Explicit Non-Goals

Do not add these during MVP implementation:

- Multi-ratio support.
- JPG export.
- Runtime template thumbnail rendering.
- Real analytics.
- Feedback backend.
- Image upload API.
- Account system.
- Local project persistence.
- Complex image pool.
- Free layout editor.
- Pinch zoom.
- Text/sticker/filter features.
- Tailwind or component library migration.

If any of these become necessary, they require a separate spec update before implementation.
