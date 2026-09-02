import test, { type Page } from '@playwright/test';
import { finishExpectingSaksdataErrors } from '@/fixtures/registrering/steps/finish';
import { selectSource } from '@/fixtures/registrering/steps/select-source';
import {
  addDokumenter,
  UNSUPPORTED_TYPE_LABEL,
  UploadMethod,
  VIRUS_FOUND_LABEL,
} from '@/fixtures/registrering/steps/upload/add-dokumenter';
import { deleteDokument } from '@/fixtures/registrering/steps/upload/delete-dokument';
import { renameDokument } from '@/fixtures/registrering/steps/upload/rename-dokument';
import { setInngaaendeKanal } from '@/fixtures/registrering/steps/upload/set-inngaaende-kanal';
import {
  dragDokumentOnto,
  moveDokumentDown,
  moveDokumentUp,
  setHoveddokument,
  verifyHoveddokument,
  verifyMoveDokumentLimits,
} from '@/fixtures/registrering/steps/upload/sort-dokumenter';
import {
  HOVEDDOKUMENT,
  SLETTES,
  UGYLDIG_FILTYPE,
  VEDLEGG_1,
  VEDLEGG_2,
  VEDLEGG_2_NYTT_NAVN,
  VIRUS,
} from '@/fixtures/registrering/steps/upload/upload-files';
import { verifyDokumentCount, verifyDokumentOrder } from '@/fixtures/registrering/steps/upload/verify-dokumenter';
import { verifyEmptyUpload } from '@/fixtures/registrering/steps/upload/verify-empty-upload';
import {
  verifyKlageIsUnavailable,
  verifyNoSakstypeBeforeUpload,
} from '@/fixtures/registrering/steps/upload/verify-sakstype';
import { DocumentSource, type Dokumenter, type InngaaendeKanal, type Sakstype } from '@/fixtures/registrering/types';

/**
 * Steps for uploading documents.
 *
 * Mutations are optimistic and rolled back on failure, so every mutating step asserts both the
 * response and the UI.
 */

/** The field document validation errors are listed under in the validation summary. */
const DOKUMENTER_FIELD_NAME = 'Opplastede dokumenter';

/** The reasons a document can be permanently unusable. */
const UNSUPPORTED_TYPE_REASON = 'Fjern dokumenter med filtype som ikke støttes.';
const VIRUS_FOUND_REASON = 'Fjern dokumenter der det ble funnet virus.';

/** The documents the registrering is finished with, in order. */
const VALID_DOKUMENT_NAMES = [HOVEDDOKUMENT.name, VEDLEGG_1.name, VEDLEGG_2_NYTT_NAVN];

/** The document count the registrering is left with. */
const DOKUMENT_COUNT = '1 hoveddokument med 2 vedlegg';

/**
 * Switches to uploaded documents and exercises the upload editor - upload, reorder, rename and
 * delete. Two documents that cannot be journalført are left behind on purpose, blocking finishing
 * until `deleteInvalidDokumenter` removes them.
 *
 * Returns what the status page is expected to show for the valid documents afterwards.
 */
export const uploadDokumenter = async (page: Page, inngaaendeKanal: InngaaendeKanal): Promise<Dokumenter> =>
  test.step('Last opp dokumenter', async () => {
    await selectSource(page, DocumentSource.UPLOAD);

    await verifyEmptyUpload(page);
    await verifyNoSakstypeBeforeUpload(page);

    await setInngaaendeKanal(page, inngaaendeKanal);

    await addDokumenter(page, [HOVEDDOKUMENT, VEDLEGG_1, VEDLEGG_2], UploadMethod.DRAG_AND_DROP);
    await verifyDokumentCount(page, DOKUMENT_COUNT);
    // Documents are ordered by upload order, the first one becoming the hoveddokument.
    await verifyDokumentOrder(page, [HOVEDDOKUMENT.name, VEDLEGG_1.name, VEDLEGG_2.name]);
    await verifyHoveddokument(page, HOVEDDOKUMENT.name);
    await verifyMoveDokumentLimits(page);

    // Moving the hoveddokument down promotes the document taking its place.
    await moveDokumentDown(page, HOVEDDOKUMENT.name, [VEDLEGG_1.name, HOVEDDOKUMENT.name, VEDLEGG_2.name]);
    await verifyHoveddokument(page, VEDLEGG_1.name);

    await moveDokumentUp(page, VEDLEGG_2.name, [VEDLEGG_1.name, VEDLEGG_2.name, HOVEDDOKUMENT.name]);

    // Dragging a row onto the first one moves it from the bottom to the top.
    await dragDokumentOnto(page, HOVEDDOKUMENT.name, VEDLEGG_1.name, [
      HOVEDDOKUMENT.name,
      VEDLEGG_1.name,
      VEDLEGG_2.name,
    ]);
    await verifyHoveddokument(page, HOVEDDOKUMENT.name);

    // Any document can be promoted directly. Promoting the old hoveddokument back restores the order.
    await setHoveddokument(page, VEDLEGG_1.name);
    await verifyDokumentOrder(page, [VEDLEGG_1.name, HOVEDDOKUMENT.name, VEDLEGG_2.name]);

    await setHoveddokument(page, HOVEDDOKUMENT.name);
    await verifyDokumentOrder(page, [HOVEDDOKUMENT.name, VEDLEGG_1.name, VEDLEGG_2.name]);

    await renameDokument(page, VEDLEGG_2.name, VEDLEGG_2_NYTT_NAVN);
    await verifyDokumentOrder(page, [HOVEDDOKUMENT.name, VEDLEGG_1.name, VEDLEGG_2_NYTT_NAVN]);

    // Documents are appended after the ones already uploaded.
    await addDokumenter(page, [SLETTES], UploadMethod.FILE_INPUT);
    await verifyDokumentCount(page, '1 hoveddokument med 3 vedlegg');
    await verifyDokumentOrder(page, [HOVEDDOKUMENT.name, VEDLEGG_1.name, VEDLEGG_2_NYTT_NAVN, SLETTES.name]);

    await deleteDokument(page, SLETTES.name);
    await verifyDokumentCount(page, DOKUMENT_COUNT);
    await verifyDokumentOrder(page, VALID_DOKUMENT_NAMES);

    // Added last, so deleting them later restores the order of the valid documents exactly.
    await addDokumenter(page, [UGYLDIG_FILTYPE], UploadMethod.DRAG_AND_DROP, UNSUPPORTED_TYPE_LABEL);
    await addDokumenter(page, [VIRUS], UploadMethod.FILE_INPUT, VIRUS_FOUND_LABEL);
    // Failed documents count towards the total.
    await verifyDokumentCount(page, '1 hoveddokument med 4 vedlegg');
    await verifyDokumentOrder(page, [...VALID_DOKUMENT_NAMES, UGYLDIG_FILTYPE.name, VIRUS.name]);

    await verifyKlageIsUnavailable(page);

    return {
      source: DocumentSource.UPLOAD,
      uploadedDocuments: {
        inngaaendeKanal,
        dokumentCount: DOKUMENT_COUNT,
        dokumentNames: VALID_DOKUMENT_NAMES,
      },
    };
  });

/**
 * Verifies that the failed documents block finishing, and that the validation summary says why -
 * one error per failing status, not per document.
 */
export const verifyInvalidDokumenterBlockFinish = async (page: Page, type: Sakstype) =>
  finishExpectingSaksdataErrors(page, type, [
    { fieldName: DOKUMENTER_FIELD_NAME, reason: UNSUPPORTED_TYPE_REASON },
    { fieldName: DOKUMENTER_FIELD_NAME, reason: VIRUS_FOUND_REASON },
  ]);

/** Removes the failed documents, leaving the registrering ready to be finished. */
export const deleteInvalidDokumenter = async (page: Page) =>
  test.step('Slett dokumentene som feilet', async () => {
    await deleteDokument(page, UGYLDIG_FILTYPE.name);
    await deleteDokument(page, VIRUS.name);

    await verifyDokumentCount(page, DOKUMENT_COUNT);
    await verifyDokumentOrder(page, VALID_DOKUMENT_NAMES);
  });
