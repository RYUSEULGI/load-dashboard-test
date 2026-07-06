"use client";

import {
  Generator,
  LOAD_RATES,
  LoadLevel,
  LogEvent,
  startGenerator,
} from "@/lib/eventGenerator";
import {
  addBatchToLedger,
  buildBars,
  evictOldBuckets
} from "@/lib/histogram";
import { THistogram } from "@/types/dashboard.types";
import { useEffect, useRef, useState } from "react";
import LogStreamPanel from "./LogStreamPanel";

export default function NaiveDashboard() {
  const generatorRef = useRef<Generator | null>(null);
  const waitingLineRef = useRef<LogEvent[]>([])
  const ledgerRef = useRef(new Map<number, number>());

  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [loadLevel, setLoadLevel] = useState<LoadLevel>("normal");
  const [running, setRunning] = useState(true);
  const [histogram, setHistogram] = useState<THistogram[]>([]);

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

      const nowSec = Math.floor(Date.now() / 1000);
      addBatchToLedger(ledgerRef.current, batch);
      evictOldBuckets(ledgerRef.current, nowSec);
      setHistogram(buildBars(ledgerRef.current, nowSec));

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
    if (running) {
      generatorRef.current?.setRate(0);
    } else {
      generatorRef.current?.setRate(LOAD_RATES[loadLevel]);
    }

    setRunning(!running);
  };

  const maxCount = Math.max(100, ...histogram.map((h) => h.count));

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

        <LogStreamPanel logs={logs} />
      </div>
    </main>
  );
}