import { format, parse } from 'date-fns';
import { toMessage } from '@/fixtures/direct-api-request/direct-api-request';

/**
 * Klanke serves the klage- and ankemuligheter from Infotrygd. In dev it is mocked, and the mock lets tests
 * create and delete saker. See https://klanke-mock.intern.dev.nav.no/v3/api-docs
 */
const KLANKE_MOCK_URL = 'https://klanke-mock.intern.dev.nav.no/mock-data/saker';

/** Kabin sets this saksbehandler on a Klanke sak when it creates a Kabal behandling from it. */
const HANDLED_IN_KABAL_SAKSBEHANDLER = 'KABAL';

export interface KlankeMulighet {
  /** `KLAGE` saker are klagemuligheter, `ANKE` saker are ankemuligheter. */
  sakstype: 'KLAGE' | 'ANKE';
  fagsakId: string;
  /** Tema code, e.g. `SYK`. */
  temaId: string;
  /**
   * Formatted `dd.MM.yyyy`, as Kabin shows it. Kabin requires it, but does not show it for an anke, so
   * only the fagsakId tells ankemuligheter apart.
   */
  vedtaksdato: string;
}

interface KlankeSak {
  id: string;
  saksbehandlerIdent: string | null;
}

const request = async (url: string, method: string, body?: unknown): Promise<Response> => {
  try {
    const res = await fetch(url, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`${res.status}: ${await res.text()}`);
    }

    return res;
  } catch (e) {
    throw new Error(`${method} ${url} - ${toMessage(e)}`, { cause: e });
  }
};

/** Creates a Klanke sak, which Kabin shows as a mulighet for `fnr`. Returns the sak ID. */
export const createKlankeSak = async (fnr: string, { sakstype, fagsakId, temaId, vedtaksdato }: KlankeMulighet) => {
  const res = await request(KLANKE_MOCK_URL, 'POST', {
    fnr,
    fagsakId,
    tema: temaId,
    sakstype,
    vedtaksdatoAsString: format(parse(vedtaksdato, 'dd.MM.yyyy', new Date()), 'yyyyMMdd'),
  });

  const { id }: KlankeSak = await res.json();

  return id;
};

export const deleteKlankeSak = async (id: string) => {
  await request(`${KLANKE_MOCK_URL}/${id}`, 'DELETE');
};

/** Whether Kabin has created a Kabal behandling from the Klanke sak. */
export const isHandledInKabal = async (id: string) => {
  const res = await request(KLANKE_MOCK_URL, 'GET');
  const saker: KlankeSak[] = await res.json();
  const sak = saker.find((s) => s.id === id);

  if (sak === undefined) {
    throw new Error(`Klanke sak ${id} not found`);
  }

  return sak.saksbehandlerIdent === HANDLED_IN_KABAL_SAKSBEHANDLER;
};
