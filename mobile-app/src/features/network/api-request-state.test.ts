import { beforeEach, describe, expect, it } from 'vitest';
import {
  beginApiMutation,
  clearApiError,
  endApiMutation,
  getApiRequestStateSnapshot,
  reportApiError,
  resetApiRequestStateForTests,
} from './api-request-state';

describe('api-request-state', () => {
  beforeEach(() => {
    resetApiRequestStateForTests();
    clearApiError();
  });

  it('tracks pending mutation count', () => {
    const first = beginApiMutation('POST', '/api/test-one');
    const second = beginApiMutation('PUT', '/api/test-two');

    expect(getApiRequestStateSnapshot().pendingMutations).toBe(2);

    endApiMutation(first);
    expect(getApiRequestStateSnapshot().pendingMutations).toBe(1);

    endApiMutation(second);
    expect(getApiRequestStateSnapshot().pendingMutations).toBe(0);
  });

  it('clears previous error when a new mutation begins', () => {
    reportApiError({
      method: 'PUT',
      path: '/api/medications/1',
      status: 500,
      message: 'Server error.',
    });

    expect(getApiRequestStateSnapshot().lastError?.message).toBe('Server error.');

    const mutationId = beginApiMutation('POST', '/api/feedback');

    expect(getApiRequestStateSnapshot().lastError).toBeNull();

    endApiMutation(mutationId);
  });
});
