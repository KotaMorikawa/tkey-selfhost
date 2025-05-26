"use client";

import Link from "next/link";
import { FileKey2 } from "lucide-react";

export const GradientHeadline = () => (
  <h1 className="text-center text-4xl font-extrabold mb-4 leading-tight">
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
      Web3Auth tKey
    </span>
    <div className="flex justify-center mt-4">
      <Link
        href="https://github.com/Web3Auth/mpc-core-kit-examples/tree/main/mpc-core-kit-web/quick-starts/mpc-core-kit-nextjs-quick-start"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
      >
        <FileKey2 size={14} />
        View Source Code
      </Link>
    </div>
  </h1>
);
