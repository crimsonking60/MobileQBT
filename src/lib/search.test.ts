import { describe, expect, it } from 'vitest';
import { nameMatcher } from './search';

describe('nameMatcher', () => {
  it('matches everything for an empty query', () => {
    expect(nameMatcher('  ')('anything')).toBe(true);
    expect(nameMatcher('"" -')('anything')).toBe(true);
  });

  it('ignores punctuation differences between query and name', () => {
    const m = nameMatcher('Paul Halpern - The Allure of the Multiverse');
    expect(m('Paul Halpern - The Allure of the Multiverse')).toBe(true);
    expect(m('Paul.Halpern_-_The.Allure.of.the.Multiverse (epub)')).toBe(true);
    expect(m('Halpern, Paul – The Allure of the Multiverse')).toBe(true); // en dash, reordered
  });

  it('ignores quotes and case', () => {
    expect(nameMatcher('"paul halpern"')('Paul Halpern - Something')).toBe(true);
  });

  it('requires every word', () => {
    expect(nameMatcher('paul smith')('Paul Halpern - Something')).toBe(false);
  });

  it('matches partial words and accents', () => {
    expect(nameMatcher('halp')('Paul Halpern')).toBe(true);
    expect(nameMatcher('bjorn')('Bjørn and Björn')).toBe(true);
    expect(nameMatcher('Bjorn')('Björn')).toBe(true);
  });
});
