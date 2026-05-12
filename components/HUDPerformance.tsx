"use client";
import React from 'react';

interface HUDPerformanceProps {
  students: any[];
}

export default function HUDPerformance({ students }: HUDPerformanceProps) {
  // --- ฟังก์ชันคำนวณ % นักเรียนแต่ละศูนย์เทียบกับทั้งหมด ---
  const getUnitVal = (id: string) => {
    if (!students || students.length === 0) return 0;
    // นับจำนวนเด็กในศูนย์นั้นๆ
    const count = students.filter(s => s.center_id === id).length;
    // คำนวณเป็น % (จำนวนเด็กในศูนย์ / จำนวนเด็กทั้งหมด * 100)
    return Math.round((count / students.length) * 100);
  };

  return (
    <div className="border-l border-cyan-900/20 pl-8 relative">
      <h2 className="text-2xl font-black italic font-cyan-400 mb-10 tracking-tighter">
        UNIT_PERFORMANCE // <span className="text-orange-500 font-normal">v1.0</span>
      </h2>

      <div className="space-y-12">
        {[
          { id: "01", name: "ศูนย์ 1 ท่าเสด็จ", color: "#06b6d4" },
          { id: "11", name: "ศูนย์ 1 ท่าเสด็จ(เพิ่มเติม)", color: "#10b981" },
          { id: "02", name: "ศูนย์ 2 บ้านน้ำโมง", color: "#0ea5e9" },
        ].map((unit, i) => (
          <div key={i} className="flex items-center gap-6 group">
            {/* วงกลม Progress */}
            <div className="relative w-14 h-14">
              <svg className="w-full h-full -rotate-90">
                {/* วงกลมพื้นหลัง (สีมืด) */}
                <circle cx="28" cy="28" r="24" stroke="#1e293b" strokeWidth="4" fill="transparent" />
                {/* วงกลมความก้าวหน้า (สีตามศูนย์) */}
                <circle 
                  cx="28" cy="28" r="24" 
                  stroke={unit.color} 
                  strokeWidth="4" 
                  fill="transparent" 
                  strokeDasharray="150.8" 
                  // 150.8 คือเส้นรอบวง (2 * PI * r)
                  strokeDashoffset={150.8 - (150.8 * getUnitVal(unit.id)) / 100} 
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              {/* ตัวเลข % ตรงกลางวงกลม */}
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white group-hover:text-cyan-400 transition-colors">
                {getUnitVal(unit.id)}%
              </span>
            </div>

            {/* ข้อมูลชื่อศูนย์ */}
            <div>
              <div className="text-cyan-400 font-bold group-hover:translate-x-1 transition-transform cursor-default">
                {unit.name}
              </div>
              <div className="text-[9px] text-cyan-900 uppercase tracking-widest mt-1">
                Status: <span className="text-emerald-500 animate-pulse">Monitoring...</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}