import type { UploadFile } from '@/fixtures/registrering/types';

const PDF_MIME_TYPE = 'application/pdf';

const PDF_HEADER = '%PDF-1.7\n';

/** First cross-reference entry, pointing at the head of the free object list. */
const XREF_FREE_ENTRY = '0000000000 65535 f \n';

/** Cross-reference entry for an in-use object. Must be exactly 20 bytes. */
const toXrefEntry = (offset: number): string => `${offset.toString(10).padStart(10, '0')} 00000 n \n`;

/**
 * Builds a small, valid, single-page PDF displaying `text`. Generated at runtime to keep the
 * fixtures readable, and structurally valid because Kabin API scans and converts every file.
 *
 * `text` must be ASCII only, so string length equals byte length when computing offsets.
 */
const createPdf = (text: string): Buffer => {
  const contents = `BT /F1 24 Tf 72 750 Td (${text}) Tj ET\n`;

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${contents.length} >>\nstream\n${contents}endstream`,
  ];

  const offsets: number[] = [];
  let pdf = PDF_HEADER;

  for (const [index, object] of objects.entries()) {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }

  const startxref = pdf.length;
  const size = objects.length + 1; // Object 0 is the free object.

  pdf += `xref\n0 ${size}\n${XREF_FREE_ENTRY}${offsets.map(toXrefEntry).join('')}`;
  pdf += `trailer\n<< /Size ${size} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  return Buffer.from(pdf, 'ascii');
};

const createPdfUploadFile = (name: string, text: string): UploadFile => ({
  name,
  mimeType: PDF_MIME_TYPE,
  buffer: createPdf(text),
});

export const HOVEDDOKUMENT = createPdfUploadFile('E2E-hoveddokument.pdf', 'E2E hoveddokument');
export const VEDLEGG_1 = createPdfUploadFile('E2E-vedlegg-1.pdf', 'E2E vedlegg 1');
export const VEDLEGG_2 = createPdfUploadFile('E2E-vedlegg-2.pdf', 'E2E vedlegg 2');

/** Uploaded only to be deleted again. */
export const SLETTES = createPdfUploadFile('E2E-skal-slettes.pdf', 'E2E skal slettes');

/** The name `VEDLEGG_2` is renamed to. */
export const VEDLEGG_2_NYTT_NAVN = 'E2E-vedlegg-2-nytt-navn.pdf';

/** Rejected before upload: only PDF, JPG, PNG and TIFF are supported. */
export const UGYLDIG_FILTYPE: UploadFile = {
  name: 'E2E-ugyldig-filtype.txt',
  mimeType: 'text/plain',
  buffer: Buffer.from('E2E ugyldig filtype', 'ascii'),
};

/** Harmless test signature every antivirus recognises. Escaped for the backslash. */
const EICAR_SIGNATURE = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

/** Fails the virus scan. Declared as PDF to get past the content type check and be scanned. */
export const VIRUS: UploadFile = {
  name: 'E2E-virus.pdf',
  mimeType: PDF_MIME_TYPE,
  buffer: Buffer.from(EICAR_SIGNATURE, 'ascii'),
};
