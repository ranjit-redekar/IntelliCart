import { Queue } from "bullmq";
import { queueConnection } from "./redis/client.js";
import { QUEUE } from "./redis/keys.js";

const queues = new Map<string, Queue>();

function queue(name: string): Queue {
  let q = queues.get(name);
  if (!q) {
    q = new Queue(name, {
      connection: queueConnection,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 1000,
        // Keep failures around — a silently discarded dead letter is how you
        // find out about a broken worker from a customer instead of a metric.
        removeOnFail: false,
      },
    });
    queues.set(name, q);
  }
  return q;
}

/** Enqueue never fails a request: a dropped side effect beats a failed order. */
export async function enqueue(name: string, jobName: string, data: unknown) {
  try {
    await queue(name).add(jobName, data);
  } catch {
    /* logged by the caller's request log; the order itself is committed */
  }
}

export async function closeQueues() {
  await Promise.allSettled([...queues.values()].map((q) => q.close()));
}

export { QUEUE };
