"use client";

import { Copy } from "lucide-react";

interface LogEntry {
  timestamp: string;
  message: string;
  id: number;
}

interface LogViewerProps {
  logs: LogEntry[];
  onCopyToClipboard: (text: string) => void;
}

export const LogViewer = ({ logs, onCopyToClipboard }: LogViewerProps) => (
  <div className="mt-6 h-40 rounded-lg bg-slate-900 shadow-inner overflow-hidden">
    <div className="h-full overflow-y-auto overflow-x-hidden p-4 text-sm text-slate-200 space-y-2 custom-scrollbar">
      {logs.length === 0 ? (
        <div className="text-slate-400 italic">No logs</div>
      ) : (
        logs.map((log) => (
          <div
            key={log.id}
            className="border-b border-slate-700 pb-2 last:border-b-0 group"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="text-slate-400 text-xs mb-1">
                  {log.timestamp}
                </div>
                <div className="text-slate-200 whitespace-pre-wrap break-words break-all overflow-wrap-anywhere">
                  {log.message}
                </div>
              </div>
              <button
                onClick={() => onCopyToClipboard(log.message)}
                className="ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200"
                title="Copy message"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);
