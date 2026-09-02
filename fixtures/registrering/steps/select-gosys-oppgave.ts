import test, { expect, type Page } from '@playwright/test';

export const selectGosysOppgave = async (page: Page, gosysOppgaveIndex: number) =>
  test.step(`Velg Gosys-oppgave nummer ${gosysOppgaveIndex + 1}`, async () => {
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
