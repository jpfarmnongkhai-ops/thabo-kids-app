"use client";
import Link from "next/link";
import { Home, ChevronLeft } from "lucide-react";

export default function HUDHomeButtonII() {
  return (
    <Link href="/">
      <div className="group relative flex items-center gap-3 cursor-pointer active:scale-95 transition-all">
        {/* เอฟเฟกต์เรืองแสงพื้นหลัง (Glow Layer) */}
        <div className="absolute inset-0 bg-cyan-500/20 blur-md rounded-lg group-hover:bg-cyan-500/40 transition-all"></div>
        
        {/* ตัวปุ่มหลักสไตล์ HUD */}
        <div className="relative flex items-center bg-slate-950/80 border-2 border-cyan-500/50 px-4 py-2 clip-path-hud shadow-[0_0_15px_rgba(6,182,212,0.3)] group-hover:border-cyan-400 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all">
          
          {/* ขีดตกแต่งมุม (Accent Decor) */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400"></div>

          <ChevronLeft className="w-4 h-4 text-cyan-500 group-hover:text-cyan-300 transition-colors" />
          <Home className="w-5 h-5 text-cyan-400 group-hover:animate-pulse" />
          
          <div className="flex flex-col ml-1">
            <span className="text-[10px] font-mono leading-none text-cyan-600 tracking-tighter uppercase">Return to</span>
            <span className="text-sm font-black text-white tracking-[0.2em] font-mono leading-none">HOMECDC</span>
          </div>

          {/* สัญลักษณ์สถานะเล็กๆ */}
          <div className="ml-3 flex gap-1">
            <div className="w-1 h-3 bg-cyan-500/30 animate-bounce"></div>
            <div className="w-1 h-3 bg-cyan-500/60 animate-bounce [animation-delay:0.2s]"></div>
            <div className="w-1 h-3 bg-cyan-500 animate-bounce [animation-delay:0.4s]"></div>
          </div>
        </div>
      </div>
    </Link>
  );
}