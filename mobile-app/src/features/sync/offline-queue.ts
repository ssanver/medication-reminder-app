export type QueueItem = {
  eventId: string;
  eventType: string;
  payloadJson: string;
  clientUpdatedAtIso: string;
};

export class OfflineQueue {
  private readonly items = new Map<string, QueueItem>();

  enqueue(item: QueueItem): void {
    this.items.set(item.eventId, item);
  }

  dequeueBatch(limit = 50): QueueItem[] {
    return Array.from(this.items.values()).slice(0, limit);
  }

  markAsSynced(eventIds: string[]): void {
    for (const eventId of eventIds) {
      this.items.delete(eventId);
    }
  }

  size(): number {
    return this.items.size;
  }
}
