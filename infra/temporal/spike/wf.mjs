/**
 * Tiny driver so the shell rehearsals can start, inspect and finish a workflow without
 * embedding SDK code in bash.
 *
 *   node wf.mjs start  <id>    start one and leave it running
 *   node wf.mjs status <id>    print its status
 *   node wf.mjs finish <id>    signal it, await the result, print the effects applied
 */
import { Client } from '@temporalio/client';
import { connect, NAMESPACE, TASK_QUEUE } from './connect.mjs';

const [action, id] = process.argv.slice(2);
const connection = await connect('api');
const client = new Client({ connection, namespace: NAMESPACE });

if (action === 'start') {
  await client.workflow.start('platformHealthcheck', {
    taskQueue: TASK_QUEUE,
    workflowId: id,
    args: [{ eventId: id }],
    workflowIdConflictPolicy: 'USE_EXISTING',
  });
  console.log(`started ${id}`);
} else if (action === 'status') {
  const d = await client.workflow.getHandle(id).describe();
  console.log(d.status.name);
} else if (action === 'finish') {
  const handle = client.workflow.getHandle(id);
  await handle.signal('finish');
  const result = await Promise.race([
    handle.result(),
    new Promise((_, rej) => setTimeout(() => rej(new Error('timed out')), 60000)),
  ]);
  console.log(result.beats.map((b) => b.key).join(' '));
}
await connection.close();
