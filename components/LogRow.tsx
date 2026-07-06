import { LogEvent } from "@/lib/eventGenerator";
import { memo } from "react";

const LEVEL_CLASS: Record<string, string> = {
  ERROR: "lv-error",
  WARN: "lv-warn",
  INFO: "lv-info",
  DEBUG: "lv-debug",
};

function fmtTime(ts: number): string {
  const d = new Date(ts);

  return (
    d.toLocaleTimeString("en-GB", { hour12: false }) +
    "." +
    String(d.getMilliseconds()).padStart(3, "0")
  );
}

const LogRow = memo(function LogRow({
  log,
  style,
}: {
  log: LogEvent;
  /** react-window가 계산해 주는 행 위치/크기 (position: absolute 등) */
  style?: React.CSSProperties;
}) {
  return (
    <div className="log-row-static" style={style}>
      <span className="c-time">{fmtTime(log.timestamp)}</span>
      <span className={`c-level ${LEVEL_CLASS[log.level]}`}>{log.level}</span>
      <span className="c-service">{log.service}</span>
      <span className="c-status">{log.statusCode}</span>
      <span className="c-latency">{log.latencyMs}ms</span>
      <span className="c-msg">{log.message}</span>
    </div>
  );
});

export default LogRow;
