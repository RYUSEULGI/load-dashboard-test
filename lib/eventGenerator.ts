export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogEvent {
  id: number;
  timestamp: number;
  level: LogLevel;
  service: string;
  message: string;
  latencyMs: number;
  statusCode: number;
}

export type LoadLevel = "normal" | "spike10" | "spike100";

export const LOAD_RATES: Record<LoadLevel, number> = {
  normal: 50,
  spike10: 500,
  spike100: 5000,
};

const SERVICES = [
  "api-gateway",
  "auth",
  "orders",
  "payments",
  "search",
  "cdn-edge",
];
const MESSAGES: Record<LogLevel, string[]> = {
  DEBUG: ["cache lookup", "token parsed", "query planned", "conn reused"],
  INFO: [
    "request completed",
    "user session started",
    "job enqueued",
    "healthcheck ok",
  ],
  WARN: [
    "slow query detected",
    "retry attempted",
    "rate limit near",
    "stale cache served",
  ],
  ERROR: [
    "upstream timeout",
    "db connection refused",
    "5xx from payment provider",
    "OOM killed worker",
  ],
};

let nextId = 1;

function pick<T>(arr: T[]): T {
  return arr[(Math.random() * arr.length) | 0];
}

function makeEvent(now: number, errorBias: number): LogEvent {
  const r = Math.random();
  const level: LogLevel =
    r < 0.02 + errorBias
      ? "ERROR"
      : r < 0.1 + errorBias * 2
        ? "WARN"
        : r < 0.45
          ? "INFO"
          : "DEBUG";
  const isErr = level === "ERROR";

  return {
    id: nextId++,
    timestamp: now,
    level,
    service: pick(SERVICES),
    message: pick(MESSAGES[level]),
    latencyMs: Math.round(
      isErr ? 800 + Math.random() * 4200 : 5 + Math.random() * 300,
    ),
    statusCode: isErr
      ? pick([500, 502, 503, 504])
      : level === "WARN"
        ? pick([200, 429])
        : 200,
  };
}

export interface Generator {
  setRate(perSec: number): void;
  getRate(): number;
  stop(): void;
}

export function startGenerator(onEvent: (e: LogEvent) => void): Generator {
  let ratePerSec = 50;
  let carry = 0;

  const TICK_MS = 50;
  const timer = setInterval(() => {
    const now = Date.now();
    const exact = (ratePerSec * TICK_MS) / 1000 + carry;
    const n = Math.floor(exact);
    carry = exact - n;
    const errorBias = Math.min(0.06, ratePerSec / 100000);
    for (let i = 0; i < n; i++) onEvent(makeEvent(now, errorBias));
  }, TICK_MS);

  return {
    setRate: (r) => (ratePerSec = r),
    getRate: () => ratePerSec,
    stop: () => clearInterval(timer),
  };
}
