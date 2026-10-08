import { describe, expect, it } from 'bun:test';
import { parseISO } from 'date-fns';
import { getFagsakCreated, getUniqueFagsakId } from '@/fixtures/klanke';

const FAGSAK_ID_REGEX = /^e2e-20261008-085507-[0-9a-f]{4}$/;

describe('getUniqueFagsakId', () => {
  it('encodes the creation time in UTC', () => {
    expect(getUniqueFagsakId(parseISO('2026-10-08T08:55:07.123Z'))).toMatch(FAGSAK_ID_REGEX);
  });
});

describe('getFagsakCreated', () => {
  it('returns the creation time to the second', () => {
    expect(getFagsakCreated(getUniqueFagsakId(parseISO('2026-10-08T08:55:07.123Z')))).toEqual(
      parseISO('2026-10-08T08:55:07Z'),
    );
  });

  it('returns null for other fagsakIds', () => {
    expect(getFagsakCreated('cde10')).toBeNull();
    expect(getFagsakCreated('')).toBeNull();
    expect(getFagsakCreated('e2e1a2b3c4d5e6f')).toBeNull();
  });

  it('returns null for invalid times', () => {
    expect(getFagsakCreated('e2e-20261308-085507-a1b2')).toBeNull();
  });
});
