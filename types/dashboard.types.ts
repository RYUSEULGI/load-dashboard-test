export type TLogEvent = {
  id: string;
  timestamp: number;
  level: string;
  service: string;
  statusCode: number;
  latencyMs: number;
  message: string;
};

export type THistogram = {
  sec: number;
  count: number;
};