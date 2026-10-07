import { test as base } from '@playwright/test';
import { deleteKabalBehandling } from '@/fixtures/kabal';
import {
  createKlankeSak,
  deleteKlankeSak,
  getUniqueFagsakId,
  isHandledInKabal,
  type KlankeMulighet,
} from '@/fixtures/klanke';
import { RegistreringPage } from '@/fixtures/registrering/registrering-page';
import { StatusPage } from '@/fixtures/registrering/status-page';

/** Saker the test creates outside Kabin. Deleted when the test is done. */
export interface TestSaker {
  /** Creates the mulighet on a unique fagsak, so it cannot be confused with muligheter of other tests or test runs. */
  createKlankeMulighet: (fnr: string, mulighet: Omit<KlankeMulighet, 'fagsakId'>) => Promise<KlankeMulighet>;
  addKabalBehandling: (behandlingId: string) => void;
}

interface Fixtures {
  registreringPage: RegistreringPage;
  statusPage: StatusPage;
  testSaker: TestSaker;
}

export const test = base.extend<Fixtures>({
  registreringPage: async ({ page }, use) => {
    await use(new RegistreringPage(page));
  },

  statusPage: async ({ page }, use) => {
    await use(new StatusPage(page));
  },

  testSaker: async ({ context }, use) => {
    const behandlingIds: string[] = [];
    const klankeSakIds: string[] = [];

    await use({
      createKlankeMulighet: (fnr, mulighet) => {
        const created: KlankeMulighet = { ...mulighet, fagsakId: getUniqueFagsakId() };

        return base.step(`Create Klanke ${created.sakstype} sak on fagsak ${created.fagsakId}`, async () => {
          klankeSakIds.push(await createKlankeSak(fnr, created));

          return created;
        });
      },
      addKabalBehandling: (behandlingId) => {
        behandlingIds.push(behandlingId);
      },
    });

    const cookies = await context.cookies();

    // Throws if a Kabal behandling cannot be deleted. Then the Klanke saker it was created from must be kept.
    for (const behandlingId of behandlingIds) {
      await base.step(`Delete Kabal behandling ${behandlingId}`, () => deleteKabalBehandling(cookies, behandlingId));
    }

    for (const sakId of klankeSakIds) {
      await base.step(`Delete Klanke sak ${sakId}`, async () => {
        // Without a known Kabal behandling, a Kabal behandling may still have been created from the sak.
        if (behandlingIds.length === 0 && (await isHandledInKabal(sakId))) {
          throw new Error(`Klanke sak ${sakId} is used by an unknown Kabal behandling. Not deleting it.`);
        }

        await deleteKlankeSak(sakId);
      });
    }
  },
});
