import test, { expect, type Page } from 'playwright/test';

export const selectGosysOppgave = async (page: Page, gosysOppgaveIndex: number) =>
  test.step('Velg Gosys-oppgave', async () => {
    const heading = page.getByRole('heading', { name: 'Velg oppgave i Gosys' });
    const section = page.locator('section', { has: heading });
    const rows = section.locator('tbody').getByRole('row');
    const oppgave = rows.nth(gosysOppgaveIndex);
    const selectColumn = oppgave.getByRole('cell').last();

    await expect(selectColumn).not.toContainText('Oppgaven er tilknyttet en annen behandling');

    const button = selectColumn.getByRole('button');
    await expect(button).toHaveText('Velg');

    await oppgave.click(); // The whole row is clickable, make sure it works. Not just the button.

    await expect(button).toHaveAttribute('title', 'Valgt');
  });
