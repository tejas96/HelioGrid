/** Did a worker actually EXECUTE anything? The only honest test of a poll permission. */
import { Client } from '@temporalio/client';
import { connect, NAMESPACE, TASK_QUEUE } from './connect.mjs';

const connection = await connect('api');
const client = new Client({ connection, namespace: NAMESPACE });
const id = `roundtrip-${Date.now()}`;
const handle = await client.workflow.start('platformHealthcheck', {
  taskQueue: TASK_QUEUE,
  workflowId: id,
  args: [{ eventId: id }],
});
await new Promise((r) => setTimeout(r, 3000));
await handle.signal('finish');
const result = await Promise.race([
  handle.result(),
  new Promise((_, rej) => setTimeout(() => rej(new Error('no worker executed it')), 45000)),
]);
console.log('EXECUTED', JSON.stringify(result.beats.map((b) => b.key)));
await connection.close();
