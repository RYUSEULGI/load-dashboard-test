"use client";

import { LogEvent } from "@/lib/eventGenerator";
import { List, RowComponentProps } from "react-window";
import LogRow from "./LogRow";

function LogStreamRow({
  index,
  style,
  logs,
}: RowComponentProps<{ logs: LogEvent[] }>) {
  const log = logs[logs.length - 1 - index];
  return <LogRow log={log} style={style} />;
}

export default function LogStreamPanel({ logs }: {logs: LogEvent[]}) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2>실시간 로그 스트림</h2>
        <span className="muted">
          {logs.length.toLocaleString()}건 · 보이는 행만 렌더
        </span>
      </div>
      <List
        className="log-viewport"
        style={{ height: 420 }}
        rowComponent={LogStreamRow}
        rowCount={logs.length}
        rowHeight={28}
        rowProps={{ logs }}
      />
    </div>
  );
}
