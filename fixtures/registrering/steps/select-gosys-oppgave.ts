import test, { expect, type Page } from '@playwright/test';

/**
 * The select button, in both of its states. Kabin swaps the label and the text for a checkmark icon
 * once the oppgave is selected, so matching only the unselected state makes the locator stop
 * resolving to the row the moment it is clicked.
 */
const SELECT_BUTTON_NAME = /^(Velg oppgave|Oppgave er valgt)/;

/**
 * Selects a Gosys-oppgave, if the registrering needs one.
 *
 * Whether it does is decided by the API.
 * Kabin renders the heading only when a Gosys-oppgave is required.
 */
export const selectGosysOppgave = async (page: Page, gosysOppgaveIndex: number) => {
  const heading = page.getByRole('heading', { name: 'Velg oppgave i Gosys' });

  if (!(await heading.isVisible())) {
    return test.step('Kabin ba ikke om en Gosys-oppgave', () => expect(heading).toBeHidden());
  }

  return test.step(`Velg ledig Gosys-oppgave nummer ${gosysOppgaveIndex + 1}`, async () => {
    // While the oppgaver load, a skeleton renders a table of its own holding a single empty row.
    // Only the loaded table is labelled, so scoping to it keeps the index off that placeholder.
    const table = page.getByRole('table', { name: 'Gosys-oppgaver', exact: true });

    // Every oppgave renders two rows: the oppgave itself and its collapsed beskrivelse. Only the
    // former holds the select button, and matching it in both states keeps the set of rows - and
    // thus the index - identical before and after the click.
    const rows = table
      .locator('tbody')
      .getByRole('row')
      .filter({ has: page.getByRole('button', { name: SELECT_BUTTON_NAME }) });

    const oppgave = rows.nth(gosysOppgaveIndex);
    const button = oppgave.getByRole('button', { name: SELECT_BUTTON_NAME });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();

    await oppgave.click(); // The whole row is clickable, make sure it works. Not just the button.

    await expect(button).toHaveAttribute('title', 'Valgt');
  });
};
