import test, { type Page } from 'playwright/test';

export const verifySaksId = async (page: Page, jpSaksId: string, mulighetSaksId: string) => {
  if (jpSaksId !== mulighetSaksId) {
    await test.step('Verifiser melding om ny saksId', () => {
      page.getByText(
        `Journalposten er tidligere journalført på fagsak-ID ${jpSaksId}. Ved opprettelse av behandling i Kabal vil innholdet kopieres over i en ny journalpost på fagsak-ID ${mulighetSaksId}.`,
      );
    });
  }
};
