"use client";
import React from 'react';

// แยกส่วน Slider ออกมาเป็น Component ย่อยเพื่อให้โค้ดสะอาด
const HUDSlider = ({ label, val, color }: { label: string, val: number, color: string }) => (
  <div className="relative mb-6">
    <div className="flex justify-between text-[10px] mb-1 tracking-tighter text-cyan-400">
      <span className="font-bold uppercase">{label}</span>
      <span className="text-white opacity-80">{val}%</span>
    </div>
    <div className="h-[2px] w-full bg-slate-800 relative">
      <div className={`absolute h-full ${color} shadow-[0_0_8px_currentColor]`} style={{ width: `${val}%` }} />
      <div className="absolute h-3 w-5 bg-orange-600 -top-[5px] border border-white/30 shadow-[0_0_10px_#ea580c]" style={{ left: `calc(${val}% - 10px)` }} />
    </div>
  </div>
);

export default function HUDPerformance() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 p-8 bg-black/80 border border-cyan-900/30 font-mono">
      {/* ฝั่งซ้าย: Analytics Stream */}
      <div>
        <h3 className="text-cyan-700 text-[11px] tracking-[0.4em] mb-10 uppercase">Attendance_Analytics_Stream</h3>
        <HUDSlider label="Attendance %" val={85} color="bg-orange-500" />
        <HUDSlider label="Score Avg" val={72} color="bg-emerald-400" />
        <HUDSlider label="Health Index" val={91} color="bg-cyan-400" />
        <HUDSlider label="Activity Rate" val={64} color="bg-orange-500" />
        <HUDSlider label="Registration" val={45} color="bg-blue-500" />
        
        {/* กราฟแท่งจำลองด้านล่าง */}
        <div className="mt-12 h-24 flex items-end gap-1 opacity-60">
          {[40, 70, 45, 90, 65, 80, 30, 55, 95].map((h, i) => (
            <div key={i} className="flex-1 bg-gradient-to-t from-cyan-900 to-orange-500" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>

      {/* ฝั่งขวา: Unit Performance */}
      <div className="border-l border-cyan-900/20 pl-8 relative">
        <h2 className="text-2xl font-black italic text-cyan-400 mb-10 tracking-tighter">
          UNIT_PERFORMANCE // <span className="text-orange-500 font-normal">v1.0</span>
        </h2>
        
        <div className="space-y-12">
          {[
            { name: "ศูนย์ 1 ท่าเสด็จ", val: 85, color: "#06b6d4" },
            { name: "ศูนย์ 1 ท่าเสด็จ(เพิ่มเติม)", val: 72, color: "#10b981" },
            { name: "ศูนย์ 2 บ้านน้ำโมง", val: 91, color: "#0ea5e9" }
          ].map((unit, i) => (
            <div key={i} className="flex items-center gap-6">
              <div className="relative w-14 h-14">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="28" cy="28" r="24" stroke="#1e293b" strokeWidth="4" fill="transparent" />
                  <circle cx="28" cy="28" r="24" stroke={unit.color} strokeWidth="4" fill="transparent" 
                    strokeDasharray="150.8" strokeDashoffset={150.8 - (150.8 * unit.val) / 100} 
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{unit.val}%</span>
              </div>
              <div>
                <div className="text-cyan-400 font-bold">{unit.name}</div>
                <div className="text-[9px] text-cyan-900 uppercase tracking-widest mt-1">Status: Monitoring...</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}