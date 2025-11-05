import type { Page } from '@playwright/test';
import { deleteRegistrering } from '@/fixtures/registrering/delete-registrering';
import { finish } from '@/fixtures/registrering/steps/finish';
import { selectGosysOppgave } from '@/fixtures/registrering/steps/select-gosys-oppgave';
import { selectJournalpost } from '@/fixtures/registrering/steps/select-journalpost';
import { selectType } from '@/fixtures/registrering/steps/select-type';
import { selectFirstAvailableVedtak } from '@/fixtures/registrering/steps/select-vedtak';
import { setAvsender } from '@/fixtures/registrering/steps/set-avsender';
import { setFristInKabal } from '@/fixtures/registrering/steps/set-frist-in-kabal';
import { setFullmektig } from '@/fixtures/registrering/steps/set-fullmektig';
import { setHjemler } from '@/fixtures/registrering/steps/set-hjemler';
import { setMottattKlageinstans } from '@/fixtures/registrering/steps/set-mottatt-klageinstans';
import { setMottattVedtaksinstans } from '@/fixtures/registrering/steps/set-mottatt-vedtaksinstans';
import { setAnkendePart, setKlager } from '@/fixtures/registrering/steps/set-part';
import { setSakenGjelder } from '@/fixtures/registrering/steps/set-saken-gjelder';
import { setSaksbehandler } from '@/fixtures/registrering/steps/set-saksbehandler';
import {
  addExtraReceiver,
  changeAddressForExtraReceiver,
  changeAddressForPart,
  selectMottaker,
  setSendSvarbrev,
  setSvarbrevDocumentName,
  setSvarbrevFritekst,
  setSvarbrevFullmektigName,
  setSvarbrevInitialFritekst,
  setSvarbrevVarsletFrist,
  setUtskriftTypeForExtraReceiver,
  setUtskriftTypeForPart,
} from '@/fixtures/registrering/steps/svarbrev';
import { verifySakenGjelder } from '@/fixtures/registrering/steps/verify-saken-gjelder';
import { verifySaksId } from '@/fixtures/registrering/steps/verify-saks-id';
import type {
  Country,
  FristExtension,
  Part,
  Sakstype,
  SelectJournalpostParams,
  Utskriftstype,
} from '@/fixtures/registrering/types';

export class RegistreringPage {
  constructor(public readonly page: Page) {}

  setSakenGjelder = async (SAKEN_GJELDER: Part) => setSakenGjelder(this.page, SAKEN_GJELDER);

  selectJournalpostByInnerText = async (params: SelectJournalpostParams) => selectJournalpost(this.page, params);

  selectGosysOppgave = async (gosysOppgaveIndex: number) => selectGosysOppgave(this.page, gosysOppgaveIndex);

  selectType = async (type: Sakstype) => selectType(this.page, type);

  selectFirstAvailableVedtak = (type: Sakstype) => selectFirstAvailableVedtak(this.page, type);

  getYtelse = () => this.page.getByTestId('ytelseId').textContent();

  setMottattVedtaksinstans = async (vedtaksdato: string) => setMottattVedtaksinstans(this.page, vedtaksdato);

  verifySaksId = async (jpSaksId: string, mulighetSaksId: string) => verifySaksId(this.page, jpSaksId, mulighetSaksId);

  setMottattKlageinstans = async (vedtaksdato: string) => setMottattKlageinstans(this.page, vedtaksdato);

  setFristInKabal = async (frist: FristExtension, vedtaksdato: string) =>
    setFristInKabal(this.page, frist, vedtaksdato);

  setHjemler = async (longNames: string[], shortNames: string[]) => setHjemler(this.page, longNames, shortNames);

  verifySakenGjelder = async (part: Part) => verifySakenGjelder(this.page, part);

  setAnkendePart = async (part: Part) => setAnkendePart(this.page, part);

  setKlager = async (part: Part) => setKlager(this.page, part);

  setFullmektig = async (part: Part) => setFullmektig(this.page, part);

  setAvsender = async (part: Part) => setAvsender(this.page, part);

  setSaksbehandler = async (label: string) => setSaksbehandler(this.page, label);

  setSendSvarbrev = async (send: boolean) => setSendSvarbrev(this.page, send);

  setSvarbrevDocumentName = async (documentName: string) => setSvarbrevDocumentName(this.page, documentName);

  setSvarbrevFullmektigName = async (fullmektigName: string) => setSvarbrevFullmektigName(this.page, fullmektigName);

  setSvarbrevVarsletFrist = async (varsletFrist: FristExtension) => setSvarbrevVarsletFrist(this.page, varsletFrist);

  setSvarbrevFritekst = async (fritekst: string) => setSvarbrevFritekst(this.page, fritekst);

  setSvarbrevInitialFritekst = async (fritekst: string) => setSvarbrevInitialFritekst(this.page, fritekst);

  selectMottaker = async (part: Part, type: Sakstype) => selectMottaker(this.page, part, type);

  changeAddressForPart = async (
    part: Part,
    address1?: string,
    address2?: string,
    address3?: string,
    country?: Country,
  ) => changeAddressForPart(this.page, part, address1, address2, address3, country);

  changeAddressForExtraReceiver = async (
    part: Part,
    address1?: string,
    address2?: string,
    address3?: string,
    country?: Country,
  ) => changeAddressForExtraReceiver(this.page, part, address1, address2, address3, country);

  setUtskriftTypeForPart = async (part: Part, type: Utskriftstype) => setUtskriftTypeForPart(this.page, part, type);

  setUtskriftTypeForExtraReceiver = async (part: Part, type: Utskriftstype) =>
    setUtskriftTypeForExtraReceiver(this.page, part, type);

  addExtraReceiver = async (part: Part) => addExtraReceiver(this.page, part);

  finish = async (saksType: Sakstype) => finish(this.page, saksType);

  deleteRegistrering = () => deleteRegistrering(this.page);
}
