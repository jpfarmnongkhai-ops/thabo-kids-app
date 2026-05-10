"use client";
import HUDPerformance from "@/components/HUDPerformance";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from "recharts";
import Link from "next/link";
import { Clock3, Users, LayoutDashboard, ShieldCheck, Activity } from "lucide-react";

// --- CORE LOGIC (ตามที่คุณกำหนดเป้าหมายไว้) ---
const getCenterFullName = (id: string) => {
  const names: Record<string, string> = { 
    "01": "ศูนย์ 1 ท่าเสด็จ", 
    "11": "ศูนย์ 1 ท่าเสด็จ(เพิ่มเติม)", 
    "02": "ศูนย์ 2 บ้านน้ำโมง" 
  };
  return names[id] || `UNKNOWN_UNIT_${id}`;
};

const getRoomFullName = (id: string) => {
  const rooms: Record<string, string> = {
    "11": "เด็กเล็ก 1/1",
    "12": "เด็กเล็ก 1/2",
    "21": "อนุบาล 1/1",
    "22": "อนุบาล 1/2"
  };
  // ปรับให้มีคำว่า [ห้อง] นำหน้าตามโจทย์เป๊ะๆ ครับ
  return `[ห้อง] ${rooms[id] || 'ไม่ระบุห้อง'}`;
};

const COLORS = ["#06b6d4", "#22d3ee", "#0891b2", "#0e7490"]; // Cyan palette

export default function AdminSciFiDashboard() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchData();
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from("students").select("*");
    if (data) setStudents(data);
    setLoading(false);
  };

  // Helper ฟังก์ชันสำหรับคำนวณสถิติ
  const getStatsByCenter = (centerId: string) => {
    const filtered = students.filter(s => s.center_id === centerId);
    const boys = filtered.filter(s => s.gender_code === "01").length;
    const girls = filtered.filter(s => s.gender_code === "02").length;
    return { total: filtered.length, boys, girls, data: filtered };
  };

  if (!mounted) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono p-4 md:p-8 relative overflow-hidden">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      {/* --- TOP HUD BAR --- */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center mb-8 border-b border-cyan-500/30 pb-4">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 border border-cyan-500 hover:bg-cyan-500/20 transition-all">
            <LayoutDashboard size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">Command_Center v1.0</h1>
            <p className="text-[10px] text-cyan-700 tracking-[0.3em]">THABO MUNICIPALITY // ADMINISTRATION_LEVEL_REQUIRED</p>
          </div>
        </div>

        <div className="flex gap-4 mt-4 md:mt-0">
          <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 border border-cyan-500/30">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span className="text-xs">SECURE_CONNECTION</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 border border-cyan-500/30">
            <Clock3 size={16} className="animate-pulse" />
            <span className="text-xs">{currentTime.toLocaleTimeString('th-TH')}</span>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="relative z-10 grid grid-cols-1 gap-8">
        
        {/* สรุปภาพรวมยอดสุทธิ */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="TOTAL_STUDENTS" value={students.length} />
          <StatCard title="TOTAL_MALE" value={students.filter(s => s.gender_code === "01").length} color="text-blue-400" />
          <StatCard title="TOTAL_FEMALE" value={students.filter(s => s.gender_code === "02").length} color="text-pink-400" />
          <StatCard title="SYSTEM_STATUS" value="READY" color="text-emerald-400" isText />
        </section>
<div className="mt-10">
   <HUDPerformance />
</div>
        {/* รายงานแยก 3 ศูนย์ (01, 11, 02) */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {["01", "11", "02"].map((centerId) => {
    const centerStats = getStatsByCenter(centerId);
    return (
      <div key={centerId} className="border border-cyan-500/20 bg-slate-900/20 p-6 rounded-none relative group hover:border-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.05)]">
        <div className="absolute top-0 right-0 p-2 text-[8px] text-cyan-900 tracking-tighter">ID_SECURE: {centerId}</div>
        
        <h3 className="text-xl font-black mb-4 border-l-4 border-cyan-500 pl-3 text-cyan-400 uppercase tracking-tighter">
          {getCenterFullName(centerId)}
        </h3>

        {/* กราฟสถิติรายศูนย์ - ปรับเป็น Dark Theme เต็มตัว */}
        <div className="h-48 w-full mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { name: 'ชาย', value: centerStats.boys },
              { name: 'หญิง', value: centerStats.girls }
            ]}>
              {/* เปลี่ยนเส้น Grid เป็นสีจางๆ ไม่ให้แย่งสายตา */}
              <CartesianGrid strokeDasharray="3 3" stroke="#06b6d410" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{fill: '#0891b2', fontSize: 10}} 
                axisLine={{stroke: '#0891b2', strokeOpacity: 0.2}}
              />
              <YAxis 
                tick={{fill: '#0891b2', fontSize: 10}} 
                axisLine={{stroke: '#0891b2', strokeOpacity: 0.2}}
              />
              <Tooltip 
                cursor={{fill: '#06b6d410'}}
                contentStyle={{backgroundColor: '#020617', border: '1px solid #0891b2', color: '#06b6d4', fontSize: '12px'}} 
              />
              {/* Bar สี Cyan พร้อม Effect Glow เล็กน้อย */}
              <Bar dataKey="value" fill="#06b6d4" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* รายละเอียดรายห้อง - ปรับรูปแบบตามโจทย์ [ห้อง] */}
        <div className="space-y-2 border-t border-cyan-900/50 pt-4">
          {["11", "12", "21", "22"].map((roomId) => {
            const roomCount = centerStats.data.filter(s => s.room_number === roomId).length;
            return (
              <div key={roomId} className="flex justify-between text-[11px] hover:bg-cyan-500/5 p-1 transition-colors border-b border-white/5 last:border-0">
                {/* เรียกใช้ฟังก์ชันที่ปรับใหม่เพื่อให้แสดง [ห้อง] นำหน้า */}
                <span className="text-cyan-600/80">{getRoomFullName(roomId)}</span>
                <span className="font-bold text-cyan-400">{roomCount} คน</span>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-cyan-900 flex justify-between items-baseline">
          <span className="text-[10px] text-cyan-800 uppercase tracking-[0.3em]">Net_Total</span>
          <span className="text-3xl font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">
            {centerStats.total}
          </span>
        </div>
      </div>
    );
  })}
</div>
        
        {/* ส่วนท้ายรายงานสำหรับ ผอ. */}
        <footer className="mt-12 p-6 border border-dashed border-cyan-900 bg-slate-950/50 flex flex-col md:flex-row justify-between items-center text-[10px] text-cyan-800">
          <div className="space-y-1">
            <p>DATA_STREAM: CONNECTED_TO_SUPABASE_DB</p>
            <p>LOCATION: THABO_MUNICIPALITY_CHILD_DEVELOPMENT_CENTER</p>
          </div>
          <div className="mt-4 md:mt-0 text-center md:text-right uppercase tracking-[0.5em]">
             Authorized_By_Director_Office // 2026
          </div>
        </footer>
      </div>
    </div>
  );
}

// --- SUB COMPONENTS (HUD STYLE) ---
function StatCard({ title, value, color = "text-cyan-400", isText = false }: any) {
  return (
    <div className="bg-slate-900/60 border border-cyan-500/20 p-4 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
      <p className="text-[9px] font-bold text-cyan-700 tracking-widest mb-1">{title}</p>
      <p className={`${isText ? 'text-xl' : 'text-3xl'} font-black ${color}`}>
        {value}
      </p>
    
    </div>
    
  );
}