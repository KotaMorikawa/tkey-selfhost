"use client";

import { useState } from "react";

interface LogEntry {
  timestamp: string;
  message: string;
  id: number;
}

export const useLogger = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (...args: unknown[]): void => {
    const timestamp = new Date().toLocaleTimeString("ja-JP");
    const message: string = args
      .map((arg) => {
        if (typeof arg === "string") return arg;
        if (typeof arg === "number" || typeof arg === "boolean")
          return String(arg);
        if (arg === null || arg === undefined) return String(arg);
        try {
          if (typeof arg === "object") {
            if (Array.isArray(arg)) {
              return `[${arg.length} items]`;
            }
            const simplified = Object.keys(arg).reduce(
              (acc: Record<string, unknown>, key) => {
                if (
                  key.length < 20 &&
                  typeof (arg as Record<string, unknown>)[key] !== "function"
                ) {
                  acc[key] = (arg as Record<string, unknown>)[key];
                }
                return acc;
              },
              {}
            );
            return JSON.stringify(simplified, null, 2);
          }
          return JSON.stringify(arg, null, 2);
        } catch (e: unknown) {
          console.error("Failed to stringify argument:", e);
          return String(arg);
        }
      })
      .join(" ");

    const logEntry = {
      timestamp,
      message,
      id: Date.now() + Math.random(),
    };

    setLogs((prevLogs) => [logEntry, ...prevLogs]);
    console.log(...args);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log("Copied:", text);
    } catch (err) {
      console.error("Copy failed:", err);
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  return {
    logs,
    addLog,
    clearLogs,
    copyToClipboard,
  };
};
