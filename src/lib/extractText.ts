/**
 * Client-side text extraction for the token meter. Everything runs in the
 * browser — files are never uploaded anywhere. Heavy parsers (pdf.js, mammoth)
 * are imported lazily so they only load when a file is actually processed.
 */

export type ExtractKind = 'pdf' | 'docx' | 'text';

export interface ExtractResult {
  text: string;
  kind: ExtractKind;
  /** Page count for PDFs (used for the optional image-token estimate). */
  pages?: number;
}

/** Rough per-page image-token cost when a PDF is sent as page images. */
export const IMAGE_TOKENS_PER_PAGE = 1700;

const PDF_EXT = /\.pdf$/i;
const DOCX_EXT = /\.docx$/i;

export async function extractTextFromFile(file: File): Promise<ExtractResult> {
  if (PDF_EXT.test(file.name) || file.type === 'application/pdf') {
    return extractPdf(file);
  }
  if (DOCX_EXT.test(file.name)) {
    return extractDocx(file);
  }
  // Everything else is treated as plain text (.txt, .md, .csv, .json …).
  return { text: await file.text(), kind: 'text' };
}

async function extractPdf(file: File): Promise<ExtractResult> {
  const pdfjs = await import('pdfjs-dist');
  // Bundled worker URL (Vite emits this as a separate asset).
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).href;

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => (typeof item === 'object' && item && 'str' in item ? (item as { str: string }).str : ''))
      .join(' ');
    parts.push(pageText);
  }
  const pages = doc.numPages;
  await doc.destroy();
  return { text: parts.join('\n\n'), kind: 'pdf', pages };
}

async function extractDocx(file: File): Promise<ExtractResult> {
  const mammoth = await import('mammoth/mammoth.browser.js');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return { text: result.value, kind: 'docx' };
}
