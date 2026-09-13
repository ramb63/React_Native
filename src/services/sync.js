import { enqueue, pendingOperations, removePending } from '../database';
import { reservasApi } from './api';

export async function syncPending() {
  const operations = await pendingOperations();
  let processed = 0;
  let failed = null;
  for (const item of operations) {
    try {
      const payload = JSON.parse(item.payload);
      if (item.operation === 'create') await reservasApi.create(payload);
      if (item.operation === 'update') await reservasApi.update(item.reservaId, payload);
      if (item.operation === 'delete') await reservasApi.remove(item.reservaId);
      await removePending(item.id);
      processed += 1;
    } catch (error) {
      failed = error;
      break;
    }
  }
  return { processed, failed, remaining: operations.length - processed };
}

export { enqueue };
