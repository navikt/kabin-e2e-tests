import test, { expect, type Page } from '@playwright/test';

export const selectGosysOppgave = async (page: Page, gosysOppgaveIndex: number) => {
  const heading = page.getByRole('heading', { name: 'Velg oppgave i Gosys' });

  if (!(await heading.isVisible())) {
    return test.step('Kabin ba ikke om en Gosys-oppgave', () => expect(heading).toBeHidden());
  }

  return test.step(`Velg ledig Gosys-oppgave nummer ${gosysOppgaveIndex + 1}`, async () => {
    // While the oppgaver load, a skeleton renders a table of its own holding a single empty row.
    // Only the loaded table is labelled, so scoping to it keeps the index off that placeholder.
    const table = page.getByRole('table', { name: 'Gosys-oppgaver', exact: true });
    const rows = table.locator('tbody').getByRole('row');

    const oppgave = rows.filter({ has: page.locator('button', { hasText: 'Velg' }) }).nth(gosysOppgaveIndex);

    await oppgave.waitFor();
    await oppgave.click(); // The whole row is clickable, make sure it works. Not just the button.

    await expect(table.getByRole('button', { name: VALGT_OPPGAVE_LABEL, exact: true })).toHaveCount(1);
  });
};

const VALGT_OPPGAVE_LABEL = 'Oppgave er valgt. Klikk for å fjerne valg.';
