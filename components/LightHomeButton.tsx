// components/LightHomeButton.tsx
"use client";
import Link from "next/link";

export default function LightHomeButton({ href = "/" }: { href?: string }) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center group">
      <Link href={href}>
        {/* ปรับพื้นหลังขาว, ขอบสีน้ำเงินอ่อน, และ Soft Glow */}
        <div className="relative px-12 py-3 bg-white/95 backdrop-blur-md border border-sky-300/60 hover:border-sky-400 transition-all duration-500 shadow-[0_4px_15px_rgba(38,198,218,0.1)] group-hover:shadow-[0_8px_30px_rgba(38,198,218,0.25)] overflow-hidden cursor-pointer rounded-xl">
          
          {/* HUD corners - เปลี่ยนเป็นสีน้ำเงินอ่อน */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-sky-400/80 rounded-tl-lg"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-sky-400/80 rounded-br-lg"></div>
          
          {/* ปรับสี Scanline จางๆ */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-200/20 via-transparent to-transparent h-[200%] animate-[scan_4s_linear_infinite] pointer-events-none"></div>

          <div className="relative flex flex-col items-center">
            {/* ข้อความสีน้ำเงินเทา */}
            <span className="text-[9px] tracking-[0.4em] text-sky-700/80 group-hover:text-sky-600 transition-colors uppercase font-bold mb-1.5">
              ระบบศูนย์พัฒนาเด็กเล็ก
            </span>
            <div className="flex items-center gap-2">
              {/* จุดกะพริบสีน้ำเงินฟ้า */}
              <div className="w-2 h-2 bg-sky-400 animate-pulse rounded-full shadow-[0_0_8px_#38bdf8]"></div>
              {/* ข้อความสีน้ำเงินเข้ม ดูมืออาชีพ */}
              <span className="text-sm font-black tracking-[0.15em] text-[#0c4a6e] group-hover:text-black transition-all">
                กลับหน้าหลัก
              </span>
              <div className="w-2 h-2 bg-sky-400 animate-pulse rounded-full shadow-[0_0_8px_#38bdf8]"></div>
            </div>
          </div>
        </div>
      </Link>
      
      {/* ข้อมูลใต้ปุ่ม - ปรับสีให้เข้ากัน */}
      <div className="mt-2 flex gap-5 opacity-40 group-hover:opacity-100 transition-opacity duration-500 font-mono">
        <span className="text-[8px] tracking-[0.1em] text-slate-600">เทศบาลเมืองท่าบ่อ</span>
        <span className="text-[8px] tracking-[0.1em] text-slate-600">| ID: TH-4302</span>
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