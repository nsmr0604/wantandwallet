import { describe, expect, it } from 'vitest';
import { normalizeName } from './text';

describe('normalizeName', () => {
  it('カタカナをひらがなにし、全角を半角にする', () => {
    expect(normalizeName('ハーピィの羽根帚')).toBe('はーぴぃの羽根帚');
    expect(normalizeName('ＢＬＡＣＫ　ＭＡＧＩＣＩＡＮ')).toBe('blackmagician');
  });

  it('空白と記号を除く', () => {
    expect(normalizeName('灰流うらら・')).toBe('灰流うらら');
    expect(normalizeName(' 増殖する G ')).toBe('増殖するg');
  });
});
