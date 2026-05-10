'use client'; // จำเป็นต้องใช้ client component สำหรับ animation

import { useState, useEffect } from 'react';

// ฟังก์ชันสำหรับสุ่มตัวเลข Loading ให้ดูสมจริง
function getRandomProgress() {
  // สุ่มค่าระหว่าง 70 ถึง 98 เพื่อไม่ให้ถึง 100 ทันที
  return Math.floor(Math.random() * (98 - 70 + 1)) + 70;
}

export default function Loading() {
  const [progress, setProgress] = useState(0);

  // เอฟเฟกต์ทำให้ % วิ่งตอนโหลดหน้า
  useEffect(() => {
    // เริ่มต้นให้ % วิ่งไปที่ค่าสุ่ม
    const timer = setTimeout(() => {
      setProgress(getRandomProgress());
    }, 200); // ดีเลย์นิดนึงก่อนเริ่มวิ่ง

    // Cleanup function
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center bg-black h-screen font-mono p-4">
      {/* ส่วนหัว: ข้อความ DOWNLOADING สไตล์ HUD */}
      <div className="flex items-center space-x-2 text-cyan-400 mb-6 animate-pulse uppercase tracking-[0.2em] text-sm">
        <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
        <span>Initializing Thabo Grid Connection</span>
      </div>

      {/* Progress Bar กรอบล้ำๆ แบบที่ JP ชอบ */}
      <div className="w-full max-w-sm h-12 border-2 border-cyan-900 relative p-1 rounded-sm shadow-[0_0_15px_rgba(6,182,212,0.2)]">
        {/* ส่วนที่เติมเต็ม (Cyan Fill) มีแสงเงา (Neon Glow) และ Transition ที่นุ่มนวล */}
        <div 
          className="h-full bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.9)] transition-all duration-[1000ms] ease-out rounded-sm relative overflow-hidden"
          style={{ width: `${progress}%` }}
        >
          {/* แอนิเมชันเส้นสแกน (Scanline Effect) วิ่งผ่าน */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-40 animate-scan"></div>
        </div>
        
        {/* ข้อความบอก % ตรงกลาง Bar */}
        <div className="absolute inset-0 flex items-center justify-center text-cyan-100 font-bold text-lg drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
          {progress}%
        </div>
      </div>

      {/* ข้อความบอกสถานะการทำงาน */}
      <div className="mt-8 flex flex-col items-center space-y-2 text-center">
        <p className="text-cyan-400 text-3xl font-extrabold tracking-tight drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
          INSTALLING SYSTEM
        </p>
        <p className="text-cyan-800 text-xs uppercase tracking-wider animate-pulse">
          CONFIGURING ADMIN CORE & LOCAL DATABASE...
        </p>
      </div>

      {/* เครดิตเล็กๆ มุมล่าง */}
      <div className="absolute bottom-4 right-4 text-cyan-950 text-[10px] font-thin uppercase">
        Thabo Kids • JPFNK Tech Division
      </div>

      {/* CSS สำหรับ Animation (ใส่ไว้ท้ายสุดของไฟล์ globals.css ก็ได้ครับ) */}
      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-scan {
          animation: scan 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
}