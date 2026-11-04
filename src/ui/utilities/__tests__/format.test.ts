import { describe, expect, it } from 'vitest';

import { toGradeTitle } from '../format';

describe('toGradeTitle', () => {
  it('capitalizes a single-word grade', () => {
    expect(toGradeTitle('cadet')).toBe('Cadet');
  });

  it('splits hyphenated grades into title-case words', () => {
    expect(toGradeTitle('major-general')).toBe('Major General');
  });
});
