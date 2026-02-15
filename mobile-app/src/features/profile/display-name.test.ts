import { describe, expect, it } from 'vitest';
import { toShortDisplayName } from './display-name';

describe('toShortDisplayName', () => {
  it('ad ve soyadi bas harf formatina cevirir', () => {
    expect(toShortDisplayName('Suleyman Şanver')).toBe('Suleyman Ş.');
  });

  it('tek kelimeli adlarda ayni degeri doner', () => {
    expect(toShortDisplayName('Suleyman')).toBe('Suleyman');
  });

  it('bos girdide bos doner', () => {
    expect(toShortDisplayName('   ')).toBe('');
  });
});
