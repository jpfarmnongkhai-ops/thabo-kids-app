// components/HUDHomeButton.tsx
"use client"; // อย่าลืมใส่บรรทัดนี้ด้วยนะเพื่อน เพราะเรามี animation
import Link from "next/link";

export default function HUDHomeButton({ href = "/" }: { href?: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center group">
      <Link href={href}>
        <div className="relative px-12 py-3 bg-black/90 backdrop-blur-xl border border-cyan-500/40 hover:border-cyan-400 transition-all duration-500 shadow-[0_0_20px_rgba(34,211,238,0.2)] group-hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] overflow-hidden cursor-pointer">
          {/* HUD Decor */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent h-[200%] animate-[scan_4s_linear_infinite] pointer-events-none"></div>

          <div className="relative flex flex-col items-center">
            <span className="text-[8px] tracking-[0.6em] text-cyan-400/60 group-hover:text-cyan-300 transition-colors uppercase font-black mb-1">
              System_Recovery
            </span>
            <div className="flex items-center gap-3 font-mono">
              <span className="text-sm font-black tracking-[0.3em] text-white group-hover:text-cyan-300 transition-all italic uppercase">
                Back_To_Main_Hub
              </span>
            </div>
          </div>
        </div>
      </Link>
      
      <div className="mt-2 flex gap-6 opacity-30 group-hover:opacity-80 transition-opacity duration-500 font-mono">
        <span className="text-[7px] tracking-[0.2em] text-cyan-400">THABO_MUNICIPALITY_SYSTEM</span>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
}