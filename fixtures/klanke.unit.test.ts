import { describe, expect, it } from 'bun:test';
import { parseISO } from 'date-fns';
import { getUniqueFagsakId } from '@/fixtures/klanke';

const FAGSAK_ID_REGEX = /^e2e-20261008-085507-[0-9a-f]{4}$/;

describe('getUniqueFagsakId', () => {
  it('encodes the creation time in UTC', () => {
    expect(getUniqueFagsakId(parseISO('2026-10-08T08:55:07.123Z'))).toMatch(FAGSAK_ID_REGEX);
  });
});
