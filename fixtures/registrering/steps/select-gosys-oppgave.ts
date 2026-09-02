import test, { expect, type Page } from '@playwright/test';

/**
 * Selects a Gosys-oppgave, if the registrering needs one.
 *
 * Whether it does is decided by the API.
 * Kabin renders the heading only when a Gosys-oppgave is required.
 */
export const selectGosysOppgave = async (page: Page, gosysOppgaveIndex: number) => {
  const heading = page.getByRole('heading', { name: 'Velg oppgave i Gosys' });

  if (!(await heading.isVisible())) {
    return;
  }

  return test.step(`Velg Gosys-oppgave nummer ${gosysOppgaveIndex + 1}`, async () => {
    // While the oppgaver load, a skeleton renders a table of its own holding a single empty row.
    // Only the loaded table is labelled, so scoping to it keeps the index off that placeholder.
    const table = page.getByRole('table', { name: 'Gosys-oppgaver', exact: true });
    const rows = table.locator('tbody').getByRole('row');
    const oppgave = rows.nth(gosysOppgaveIndex);

    await oppgave.waitFor();

    const selectColumn = oppgave.getByRole('cell').last();

    await expect(selectColumn).not.toContainText('Oppgaven er tilknyttet en annen behandling');

    const button = selectColumn.getByRole('button');
    await expect(button).toHaveText('Velg');

    await oppgave.click(); // The whole row is clickable, make sure it works. Not just the button.

    await expect(button).toHaveAttribute('title', 'Valgt');
  });
};
