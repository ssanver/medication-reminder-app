import { describe, expect, it } from 'vitest';
import { OfflineQueue } from './offline-queue';

describe('offline-queue', () => {
  it('event-id bazli idempotent kuyruklama yapmali', () => {
    const queue = new OfflineQueue();

    queue.enqueue({
      eventId: 'evt-1',
      eventType: 'dose-action',
      payloadJson: '{}',
      clientUpdatedAtIso: new Date().toISOString(),
    });

    queue.enqueue({
      eventId: 'evt-1',
      eventType: 'dose-action',
      payloadJson: '{"retry":1}',
      clientUpdatedAtIso: new Date().toISOString(),
    });

    expect(queue.size()).toBe(1);
  });

  it('sync sonrasi eventleri kuyruktan dusmeli', () => {
    const queue = new OfflineQueue();

    queue.enqueue({
      eventId: 'evt-1',
      eventType: 'dose-action',
      payloadJson: '{}',
      clientUpdatedAtIso: new Date().toISOString(),
    });
    queue.enqueue({
      eventId: 'evt-2',
      eventType: 'dose-action',
      payloadJson: '{}',
      clientUpdatedAtIso: new Date().toISOString(),
    });

    queue.markAsSynced(['evt-1']);

    expect(queue.size()).toBe(1);
    expect(queue.dequeueBatch()[0]?.eventId).toBe('evt-2');
  });
});
