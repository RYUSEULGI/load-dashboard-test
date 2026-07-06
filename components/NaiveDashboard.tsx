"use client";

import {
  Generator,
  LOAD_RATES,
  LoadLevel,
  LogEvent,
  startGenerator,
} from "@/lib/eventGenerator";
import { Fragment, useEffect, useRef, useState } from "react";

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

/** 최근 60초 초당 발생 건수 (매 렌더마다 전체 로그를 다시 집계) */
function buildHistogram(logs: LogEvent[]): { sec: number; count: number }[] {
  const now = Math.floor(Date.now() / 1000);
  const counts = new Map<number, number>();

  for (const e of logs) {
    const sec = Math.floor(e.timestamp / 1000);

    if (now - sec < 60) {
      counts.set(sec, (counts.get(sec) ?? 0) + 1);
    }
  }

  const out: { sec: number; count: number }[] = [];

  for (let s = now - 59; s <= now; s++) {
    out.push({ sec: s, count: counts.get(s) ?? 0 });
  }
  return out;
}

export default function NaiveDashboard() {
  const generatorRef = useRef<Generator | null>(null);
  const waitingLineRef = useRef<LogEvent[]>([])

  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [loadLevel, setLoadLevel] = useState<LoadLevel>("normal");
  const [running, setRunning] = useState(true);

  useEffect(() => {
    const gen = startGenerator((e) => {
      waitingLineRef.current?.push(e);
    });

    const intervalId = setInterval(() => {
      if (waitingLineRef.current.length === 0) {
        return; 
      }
    
      const batch = waitingLineRef.current; 
      waitingLineRef.current = [];         
    
      setLogs((prev) => [...prev, ...batch]);
    }, 100);

    generatorRef.current = gen;

    return () => {
      clearInterval(intervalId);
      waitingLineRef.current = [];
      gen.stop();
    }
  }, []);

  const changeLoad = (level: LoadLevel) => {
    setLoadLevel(level);
    generatorRef.current?.setRate(LOAD_RATES[level]);
  };

  const toggleRunning = () => {
    // 비상 정지 (탭이 버벅일 때 탈출용)
    if (running) {
      generatorRef.current?.setRate(0);
    } else {
      generatorRef.current?.setRate(LOAD_RATES[loadLevel]);
    }

    setRunning(!running);
  };

  const histogram = buildHistogram(logs);
  const maxCount = Math.max(100, ...histogram.map((h) => h.count));
  const newestFirst = [...logs].reverse();

  return (
    <main className="dashboard">
      <header className="header">
        <div>
          <h1>Log Dashboard (v1)</h1>
          <p className="muted">누적 {logs.length.toLocaleString()}건</p>
        </div>
        <div className="simulator">
          <span className="sim-label">부하 시뮬레이터</span>
          <div className="sim-buttons">
            <button
              className={`sim-btn ${loadLevel === "normal" ? "active" : ""}`}
              onClick={() => changeLoad("normal")}
            >
              평상시<small>{LOAD_RATES.normal}/s</small>
            </button>
            <button
              className={`sim-btn ${loadLevel === "spike10" ? "active" : ""}`}
              onClick={() => changeLoad("spike10")}
            >
              스파이크 ×10<small>{LOAD_RATES.spike10}/s</small>
            </button>
            <button
              className={`sim-btn danger ${loadLevel === "spike100" ? "active" : ""}`}
              onClick={() => changeLoad("spike100")}
            >
              스파이크 ×100
              <small>{LOAD_RATES.spike100.toLocaleString()}/s</small>
            </button>
            <button className="sim-btn" onClick={toggleRunning}>
              {running ? "⏸ 정지" : "▶ 재개"}
              <small>비상 탈출</small>
            </button>
          </div>
        </div>
      </header>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-header">
            <h2>초당 발생 건수 (최근 60초)</h2>
          </div>
          <svg viewBox="0 0 560 160" style={{ width: "100%" }}>
            {histogram.map((h, i) => {
              const barH = (h.count / maxCount) * 140;
              return (
                <rect
                  key={h.sec}
                  x={i * 9.3}
                  y={150 - barH}
                  width={7}
                  height={barH}
                  fill="#34d399"
                />
              );
            })}
          </svg>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>실시간 로그 스트림</h2>
            <span className="muted">
              {logs.length.toLocaleString()}행 렌더 중
            </span>
          </div>
          <div className="log-viewport" style={{ height: 420 }}>
            {newestFirst.map((e) => (
              <div className="log-row-static" key={e.id}>
                <span className="c-time">{fmtTime(e.timestamp)}</span>
                <span className={`c-level ${LEVEL_CLASS[e.level]}`}>
                  {e.level}
                </span>
                <span className="c-service">{e.service}</span>
                <span className="c-status">{e.statusCode}</span>
                <span className="c-latency">{e.latencyMs}ms</span>
                <span className="c-msg">{e.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
