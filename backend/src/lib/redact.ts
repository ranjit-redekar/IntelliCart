// Settings are free-form JSON written by the admin UI; drop anything that looks
// like a credential so a webhook signing secret never ends up in a download.
const SECRET_KEY = /secret|token|password|hash|apikey|api_key|private/i;
export const redact = (v: unknown): unknown =>
  Array.isArray(v) ? v.map(redact)
  : v && typeof v === "object"
    ? Object.fromEntries(Object.entries(v).filter(([k]) => !SECRET_KEY.test(k)).map(([k, x]) => [k, redact(x)]))
    : v;
