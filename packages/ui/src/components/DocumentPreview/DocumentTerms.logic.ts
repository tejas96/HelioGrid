/**
 * The terms body's size in the sheet's own DESIGN SPACE. The sheet is a document drawn at a fixed
 * 480px width and scaled as a whole (`DocumentPreview.css`), so this is not app chrome and the
 * 12px type floor does not reach it — which is exactly why it cannot come from `@heliogrid/theme`,
 * whose scale is the app's. Declared once because both halves hand it to the same `RichTextView`,
 * and a sheet that sets its terms at two sizes is two documents.
 */
export const TERMS_FONT_SIZE = 10;
