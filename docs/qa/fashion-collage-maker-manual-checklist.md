# Fashion Collage Maker Manual QA Checklist

## Release Gate

MVP release is blocked until every required row in the status table has a recorded result. Any unchecked, pending, or failed required row blocks release. A failed row may be marked non-blocking only when the release owner records an explicit approved waiver or de-scope decision in the notes.

Required rows:

- Desktop Chrome full flow
- Desktop Safari full flow
- iOS Safari phone-photo flow
- Android Chrome phone-photo flow
- Large-image pressure test with 4 images close to 15MB each
- Export consistency review against the main preview
- Accessibility and keyboard review
- Mobile layout usability review

## Status Table

| Date | Browser/Device | Scope | Result | Notes/Blocking follow-up |
| --- | --- | --- | --- | --- |
| 2026-06-11 | Local environment | Documentation checklist creation | Pass | Checklist added. Real browser/device QA remains manual. |
| TBD | Desktop Chrome | Required full flow | Pending | Blocks MVP until completed. |
| TBD | Desktop Safari | Required full flow | Pending | Blocks MVP until completed. |
| TBD | iOS Safari on physical iPhone or iPad | Required phone-photo flow | Pending | Blocks MVP until completed. |
| TBD | Android Chrome on physical Android device | Required phone-photo flow | Pending | Blocks MVP until completed. |
| TBD | Desktop Chrome or Safari | Large-image pressure with 4 images close to 15MB each | Pending | Blocks MVP until completed. |
| TBD | Browser used for export testing | Export consistency comparison | Pending | Blocks MVP until completed. |
| TBD | Desktop keyboard and screen-reader-visible text review | Accessibility and keyboard review | Pending | Blocks MVP until completed. |
| TBD | iOS Safari and Android Chrome | Mobile layout usability review | Pending | Blocks MVP until completed. |

## Test Assets

- Use 4 JPG images for desktop browser full-flow checks.
- Use 4 recent phone photos for iOS Safari and Android Chrome checks.
- Use 4 images close to 15MB each for pressure testing. Each file should be under the product limit.
- Prepare 1 separate image over 15MB only for the file-too-large validation case.
- Prefer images with mixed portrait and landscape orientation so orientation mistakes are visible.
- Include at least one bright image edge and one dark image edge to make exposed slot background, transparent areas, and jagged obvious edges easier to see.

## Desktop Chrome Full Flow

Tester:
Date:
Browser and OS:
Result: Pending / Pass / Fail
Follow-up or release-blocking note:

Steps:

1. Open `/fashion-collage-maker` in Desktop Chrome.
2. Upload exactly 4 JPG images.
3. Confirm the app advances to the editor without requiring image selection.
4. Confirm all 4 uploaded images appear in the main preview.
5. Switch through all 4 templates.
6. For each template, confirm the preview updates and all 4 images remain visible.
7. Adjust at least one slot crop by dragging in the preview.
8. Adjust zoom for at least one slot.
9. Change the background swatch once.
10. Export PNG.
11. Confirm visible export progress, success, or error text appears.
12. Download or open the exported PNG.
13. Compare the exported PNG with the main preview using the export consistency checklist below.

Expected result:

- The flow completes without console-blocking behavior or visible app errors.
- The exported file is a PNG.
- Exported composition matches the preview within expected canvas scaling differences.

## Desktop Safari Full Flow

Tester:
Date:
Browser and OS:
Result: Pending / Pass / Fail
Follow-up or release-blocking note:

Steps:

1. Open `/fashion-collage-maker` in Desktop Safari.
2. Upload exactly 4 JPG images.
3. Confirm the app advances to the editor without requiring image selection.
4. Confirm all 4 uploaded images appear in the main preview.
5. Switch through all 4 templates.
6. For each template, confirm the preview updates and all 4 images remain visible.
7. Adjust at least one slot crop by dragging in the preview.
8. Adjust zoom for at least one slot.
9. Change the background swatch once.
10. Export PNG.
11. Confirm visible export progress, success, or error text appears.
12. Download or open the exported PNG.
13. Compare the exported PNG with the main preview using the export consistency checklist below.

Expected result:

- The flow completes without visible app errors.
- The exported file is a PNG.
- Exported composition matches the preview within expected canvas scaling differences.

## iOS Safari Phone-Photo Flow

Tester:
Date:
Device, iOS version, and Safari version:
Result: Pending / Pass / Fail
Follow-up or release-blocking note:

Steps:

1. Open `/fashion-collage-maker` in iOS Safari.
2. Upload exactly 4 phone photos from the photo picker.
3. Confirm the app advances to the editor.
4. Confirm all 4 photos appear in the main preview with correct orientation.
5. Drag crop position inside at least 2 different slots.
6. Adjust zoom for at least 2 different slots.
7. Switch through all 4 templates and confirm the preview remains usable.
8. Export PNG.
9. Confirm visible export progress, success, or error text appears.
10. Open or save the exported PNG if the browser permits.
11. Compare the exported PNG with the main preview using the export consistency checklist below.

Expected result:

- Touch dragging and zoom controls remain usable.
- Controls do not cover the composition in a way that prevents editing.
- Export succeeds or a visible error clearly explains the failure.

## Android Chrome Phone-Photo Flow

Tester:
Date:
Device, Android version, and Chrome version:
Result: Pending / Pass / Fail
Follow-up or release-blocking note:

Steps:

1. Open `/fashion-collage-maker` in Android Chrome.
2. Upload exactly 4 phone photos from the photo picker.
3. Confirm the app advances to the editor.
4. Confirm all 4 photos appear in the main preview with correct orientation.
5. Switch through all 4 templates and confirm the preview remains usable.
6. Export PNG.
7. Confirm visible export progress, success, or error text appears.
8. Open or save the exported PNG if the browser permits.
9. Compare the exported PNG with the main preview using the export consistency checklist below.

Expected result:

- The mobile flow completes without visible app errors.
- Controls do not cover the composition in a way that prevents export.
- Export succeeds or a visible error clearly explains the failure.

## Large-Image Pressure Test

Tester:
Date:
Browser/device:
Result: Pending / Pass / Fail
Follow-up or release-blocking note:

Steps:

1. Prepare 4 image files close to 15MB each and under the product limit.
2. Open `/fashion-collage-maker`.
3. Upload all 4 large images together.
4. Confirm validation accepts files that are within the 15MB limit.
5. Wait for image decoding and normalization to finish.
6. Confirm all 4 accepted images appear in the preview.
7. Switch through all 4 templates.
8. Export PNG.
9. Confirm export succeeds or a visible error clearly explains the failure.
10. In a separate upload attempt, include 1 image over 15MB and confirm it is rejected with visible error text.

Expected result:

- The page remains responsive enough to complete the flow.
- The browser does not crash or reload.
- Export either succeeds or fails with visible user-facing text.

## Export Consistency Checklist

Run this after each successful export:

- No image is missing from the exported PNG.
- Slot positions and proportions match the main preview.
- No exposed background appears inside image slots unless the template intentionally exposes background outside the slot.
- Portrait and landscape photos keep the same orientation shown in preview.
- No unexpected transparent areas appear in the exported PNG.
- Edges do not show obvious jagged artifacts beyond normal scaling.
- Template borders, shadows, rotation, and overlap match the preview.
- Background color matches the selected swatch.
- Exported PNG is 2160 by 2700 pixels.

## Accessibility and Keyboard Checklist

Tester:
Date:
Browser/device:
Result: Pending / Pass / Fail
Follow-up or release-blocking note:

Checks:

- All buttons have visible text or an accessible label.
- Upload controls have clear visible text and can be triggered without a mouse.
- Template selection is keyboard reachable.
- Keyboard focus visibly moves through template options.
- The selected template state is conveyed in text or accessibility state.
- Background swatches have visible text or accessible labels.
- Slot crop, zoom, replace, and reset controls have accessible labels.
- Export progress, export success, export failure, validation errors, and normalization errors are announced in visible text.
- Disabled controls explain their state through visible context where needed.

## Mobile Layout Usability Checklist

Tester:
Date:
Browser/device:
Result: Pending / Pass / Fail
Follow-up or release-blocking note:

Checks:

- Main preview keeps a usable 4:5 composition on small screens.
- Template controls do not cover the composition.
- Slot controls do not cover the composition while dragging crop.
- Export controls remain reachable without horizontal scrolling.
- Text does not overlap or overflow buttons, swatches, template labels, or status areas.
- Touch targets are large enough to tap reliably.
- The page remains usable after rotating the device, if the device allows rotation.

## Automated and Local Checks Performed

| Date | Check | Result | Notes |
| --- | --- | --- | --- |
| 2026-06-11 | `npm run lint` | Pass | ESLint completed without reported issues. |
| 2026-06-11 | `npm test` | Pass | Vitest completed with 8 test files and 61 tests passing. |
| 2026-06-11 | `npm run build` | Pass | Next.js production build completed successfully. |

No real Desktop Chrome, Desktop Safari, iOS Safari, or Android Chrome full-flow checks were completed in this environment when this checklist was created. Those rows must be filled by testers using the named browsers/devices before MVP release.
