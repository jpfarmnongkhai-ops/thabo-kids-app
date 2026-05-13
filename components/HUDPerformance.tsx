// 📁 components/HUDPerformance.tsx
"use client";
import React from 'react';

export default function HUDPerformance({ students = [] }: { students: any[] }) {
  const getUnitData = (id: string) => {
    if (!students || students.length === 0) return { percent: 0, male: 0, female: 0 };
    
    const centerStudents = students.filter(s => String(s.center_id) === String(id));
    const count = centerStudents.length;
    
    return {
      percent: Math.round((count / students.length) * 100) || 0,
      // 🔥 เปลี่ยนจาก s.gender เป็น s.gender_code เพื่อให้ตรงกับ Database ครับ
      male: centerStudents.filter(s => String(s.gender_code) === "01").length,
      female: centerStudents.filter(s => String(s.gender_code) === "02").length
    };
  };
 
  return (
    <div className="bg-slate-900 border-2 border-cyan-500/30 p-8 rounded-[3rem] shadow-[0_0_30px_rgba(6,182,212,0.1)] relative overflow-hidden">
      {/* ... (ส่วนหัวข้อ UNIT_PERFORMANCE // V2.0) */}
      
      <div className="space-y-10">
        {[
          { id: "01", name: "ศูนย์ 1 ท่าเสด็จ", color: "#06b6d4" },
          { id: "11", name: "ศูนย์ 1 (เพิ่มเติม)", color: "#10b981" }, // ตรวจสอบ ID 11 ใน Supabase ด้วยนะครับ
          { id: "02", name: "ศูนย์ 2 บ้านน้ำโมง", color: "#3b82f6" },
        ].map((unit, i) => {
          const data = getUnitData(unit.id);
          return (
            <div key={i} className="flex items-center gap-6 group">
              <div className="relative w-16 h-16">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="#1e293b" strokeWidth="4" fill="transparent" />
                  <circle 
                    cx="32" cy="32" r="28" 
                    stroke={unit.color} 
                    strokeWidth="5" 
                    fill="transparent" 
                    strokeDasharray="175.9" 
                    strokeDashoffset={175.9 - (175.9 * data.percent) / 100} 
                    className="transition-all duration-1000 ease-out" 
                    strokeLinecap="round" 
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white">
                  {(data.percent || 0).toLocaleString()}%
                </span>
              </div>
              <div className="flex-1">
                <div className="text-cyan-400 font-black tracking-tight group-hover:text-white transition-colors">{unit.name}</div>
                <div className="flex gap-3 mt-2">
                  <div className="text-[9px] text-blue-400 font-black bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    ชาย: {(data.male || 0).toLocaleString()}
                  </div>
                  <div className="text-[9px] text-pink-400 font-black bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                    หญิง: {(data.female || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-500 font-bold self-center animate-pulse tracking-widest uppercase">Monitoring</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}