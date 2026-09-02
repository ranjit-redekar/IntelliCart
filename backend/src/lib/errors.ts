import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (m: string, d?: unknown) => new ApiError(400, "bad_request", m, d);
export const unauthorized = (m = "Sign in to continue.") => new ApiError(401, "unauthorized", m);
export const forbidden = (m = "You do not have access to this.") => new ApiError(403, "forbidden", m);
export const notFound = (m = "Not found.") => new ApiError(404, "not_found", m);
export const conflict = (m: string, d?: unknown) => new ApiError(409, "conflict", m, d);
export const tooMany = (m = "Too many attempts. Try again shortly.") =>
  new ApiError(429, "rate_limited", m);

/** One error envelope for the whole API. */
export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((err, req, reply) => {
    if (err instanceof ApiError) {
      return reply.code(err.statusCode).send({
        error: { code: err.code, message: err.message, details: err.details ?? undefined },
      });
    }
    // Schema failures are the client's fault and the client needs the detail:
    // which field, and why. Falling through to the generic 500 branch turned
    // every bad form submission into "something went wrong on our side".
    if (err instanceof ZodError) {
      return reply.code(400).send({
        error: {
          code: "bad_request",
          message: "Check the highlighted fields.",
          details: err.flatten().fieldErrors,
        },
      });
    }
    const e = err as { validation?: unknown; statusCode?: number; message?: string };
    if (e.validation) {
      return reply.code(400).send({
        error: { code: "bad_request", message: e.message ?? "Invalid request.", details: e.validation },
      });
    }
    const status = e.statusCode && e.statusCode >= 400 ? e.statusCode : 500;
    if (status >= 500) req.log.error({ err }, "unhandled error");
    return reply.code(status).send({
      error: {
        code: status >= 500 ? "internal" : "request_failed",
        // Never leak an internal message to a client.
        message: status >= 500 ? "Something went wrong on our side." : e.message ?? "Request failed.",
      },
    });
  });

  app.setNotFoundHandler((_req, reply) =>
    reply.code(404).send({ error: { code: "not_found", message: "No such route." } }),
  );
}
