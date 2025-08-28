import type { Page } from 'playwright/test';
import { finishedRequest } from '@/fixtures/finished-request';
import { selectAnke } from '@/fixtures/registrering/steps/select-anke';
import { selectKlage } from '@/fixtures/registrering/steps/select-klage';
import { selectOmgjøringskrav } from '@/fixtures/registrering/steps/select-omgjøringskrav';
import { Sakstype } from '@/fixtures/registrering/types';

export const selectType = async (page: Page, type: Sakstype) => {
  const selectRegistreringTypeRequest = page.waitForRequest('**/registreringer/**/type-id');

  switch (type) {
    case Sakstype.KLAGE:
      await selectKlage(page);
      break;
    case Sakstype.ANKE:
      await selectAnke(page);
      break;
    case Sakstype.OMGJØRINGSKRAV:
      await selectOmgjøringskrav(page);
      break;
  }

  await finishedRequest(selectRegistreringTypeRequest, `Failed to select registrering type "${type}"`);
};
