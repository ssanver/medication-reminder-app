import { describe, expect, it } from 'vitest';
import { isSignUpFormValid } from './signup-validation';

describe('isSignUpFormValid', () => {
  it('tum alanlar dolu ve gecerliyse true doner', () => {
    expect(
      isSignUpFormValid({
        name: 'Hanie',
        email: 'hanie@example.com',
        password: 'secret123',
      }),
    ).toBe(true);
  });

  it('alanlardan biri bos ise false doner', () => {
    expect(
      isSignUpFormValid({
        name: ' ',
        email: 'hanie@example.com',
        password: 'secret123',
      }),
    ).toBe(false);
  });

  it('email gecersiz ise false doner', () => {
    expect(
      isSignUpFormValid({
        name: 'Hanie',
        email: 'hanieexample.com',
        password: 'secret123',
      }),
    ).toBe(false);
  });

  it('sifre dort karakterden kisa ise false doner', () => {
    expect(
      isSignUpFormValid({
        name: 'Hanie',
        email: 'hanie@example.com',
        password: '123',
      }),
    ).toBe(false);
  });
});
