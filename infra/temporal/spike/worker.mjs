/**
 * The spike worker. Track 7 replaces `apps/worker/src/worker.module.ts`'s BullMQ wiring with
 * this lifecycle inside Nest; here it runs standalone so the connection, the identity and the
 * task queue are proven before any product code depends on them.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities.mjs';
import { ADDRESS, NAMESPACE, TASK_QUEUE, tlsFor, token } from './connect.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

const connection = await NativeConnection.connect({
  address: ADDRESS,
  tls: tlsFor('worker'),
  apiKey: token('worker').replace(/^Bearer /, ''),
});

const worker = await Worker.create({
  connection,
  namespace: NAMESPACE,
  taskQueue: TASK_QUEUE,
  workflowsPath: join(HERE, 'workflows.mjs'),
  activities,
  // Named so a running worker is identifiable in the UI and in a task-queue description —
  // "which build is holding this task queue" is the first question during a bad deploy.
  identity: `spike-worker@${process.env.WORKER_BUILD ?? 'v1'}`,
});

process.on('SIGINT', () => worker.shutdown());
process.on('SIGTERM', () => worker.shutdown());

console.log(`worker ready · queue=${TASK_QUEUE} · identity=${worker.options.identity}`);
await worker.run();
console.log('worker stopped cleanly');
