"use client";
import HUDPerformance from "@/components/HUDPerformance";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from "recharts";
import Link from "next/link";
import { Clock3, LayoutDashboard, ShieldCheck, Activity, Users, Radio } from "lucide-react";

// --- HELPERS ---
const getCenterFullName = (id: string) => {
  const names: Record<string, string> = { 
    "01": "ศูนย์ 1 ท่าเสด็จ", 
    "02": "ศูนย์ 2 บ้านน้ำโมง",
    "11": "ศูนย์ 1 ท่าเสด็จ(เพิ่มเติม)"
  };
  return names[id] || `NODE_${id}`;
};

const getRoomFullName = (id: string) => {
  const rooms: Record<string, string> = {
    "11": "เด็กเล็ก 1/1", "12": "เด็กเล็ก 1/2",
    "21": "อนุบาล 1/1", "22": "อนุบาล 1/2"
  };
  return rooms[id] || 'UNKNOWN_ROOM';
};

export default function AdminSciFiDashboard() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchData();
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    const [stdRes, staffRes] = await Promise.all([
      supabase.from("students").select("*"),
      supabase.from("staff").select("*") 
    ]);
    if (stdRes.data) setStudents(stdRes.data);
    if (staffRes.data) setStaff(staffRes.data);
  };

  const getStatsByCenter = (centerId: string) => {
    const filtered = students.filter(s => s.center_id === centerId);
    const boys = filtered.filter(s => s.gender_code === "01").length;
    const girls = filtered.filter(s => s.gender_code === "02").length;
    return { total: filtered.length, boys, girls, data: filtered };
  };

  if (!mounted) return <div className="min-h-screen bg-[#020617]" />;

  return (
    // จากเดิม bg-[#020617] (ดำสนิท)
// เปลี่ยนเป็น bg-[#0f172a] หรือ bg-slate-900 (น้ำเงินเข้ม/เทา) 
<div className="min-h-screen bg-slate-900 text-cyan-300 font-mono p-4 md:p-6 relative overflow-hidden">
  
  {/* ปรับ Grid ให้สว่างขึ้นนิดนึง */}
  <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.15)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
  
  {/* เพิ่มแสงฟุ้ง (Glow) ให้สว่างขึ้น */}
  <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-cyan-400/20 blur-[100px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>

      {/* 🛰️ TOP HUD BAR */}
      <header className="relative z-10 flex flex-col md:flex-row justify-between items-center mb-6 border-b border-cyan-500/30 pb-4 bg-slate-950/50 backdrop-blur-md px-4 py-2 ring-1 ring-cyan-500/20">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-cyan-500 rounded-none blur opacity-25 group-hover:opacity-50 transition"></div>
            <Link href="/admin" className="relative p-2 bg-black border border-cyan-500 flex items-center justify-center">
              <LayoutDashboard size={20} className="text-cyan-400" />
            </Link>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-[0.2em] uppercase text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
              COMMAND_CENTER <span className="text-cyan-500">V1.0</span>
            </h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <p className="text-[12px] text-cyan-700 font-bold uppercase">SYSTEM_OPERATIONAL // SECURE_LINK</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4 md:mt-0">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 border border-cyan-500/20 text-[12px]">
            <Radio size={12} className="text-emerald-400" />
            <span className="tracking-widest">DB_SYNC: OK</span>
          </div>
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 border border-cyan-500/20 text-[12px]">
            <Clock3 size={12} className="text-cyan-500" />
            <span className="tracking-widest">{currentTime.toLocaleTimeString('en-US', { hour12: false })}</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 space-y-6">
        {/* 📊 CORE METRICS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricBox label="รวมทั้งสิ้น" value={students.length} icon={<Users size={14}/>} color="cyan" />
          <MetricBox label="ชายจำนวน" value={students.filter(s => s.gender_code === "01").length} color="blue" />
          <MetricBox label="หญิงจำนวน" value={students.filter(s => s.gender_code === "02").length} color="pink" />
          <MetricBox label="คุณครูจำนวน" value={staff.length} icon={<Activity size={14}/>} color="emerald" />
        </div>

        {/* 🚀 PERFORMANCE ANALYTICS */}
        <div className="p-1 bg-gradient-to-r from-cyan-500/20 via-transparent to-blue-500/20 border border-cyan-500/10">
           <HUDPerformance students={students} /> 
        </div>

        {/* 🤖 NODE INTELLIGENCE (Center Reports) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {["01", "11", "02"].map((centerId) => {
            const stats = getStatsByCenter(centerId);
            const centerStaff = staff.filter(t => t.center_id === centerId);

            return (
              <div key={centerId} className="group relative bg-slate-950/60 border border-cyan-950 p-5 backdrop-blur-sm hover:border-cyan-500/50 transition-all overflow-hidden ring-1 ring-white/5">
                {/* HUD Decorations */}
                <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-cyan-500/20 group-hover:border-cyan-500 transition-colors"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/10 group-hover:border-cyan-500 transition-colors"></div>
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-[12px] text-cyan-700 font-bold tracking-widest uppercase mb-1">ศูนย์พัฒนาเด็กเล็กเทศบาลเมืองท่าบ่อ</p>
                    <h3 className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors">{getCenterFullName(centerId)}</h3>
                  </div>
                  <span className="text-[12px] bg-cyan-500/10 px-2 py-0.5 border border-cyan-500/30 text-cyan-500 font-bold italic">ID_{centerId}</span>
                </div>

                {/* Staff Area */}
                <div className="mb-6 p-3 bg-black/40 border-l-2 border-cyan-500/50 space-y-2">
                  <p className="text-[12px] text-cyan-600 font-bold tracking-[0.3em] uppercase">บุคลากร</p>
                  {centerStaff.slice(0, 2).map((s, i) => (
                    <div key={i} className="flex justify-between text-[12px]">
                      <span className="text-slate-300">ครู {s.first_name}</span>
                      <span className="text-cyan-600 font-bold">{s.position?.substring(0, 10)}</span>
                    </div>
                  ))}
                </div>

                {/* Graph Area */}
<div className="h-32 w-full mb-4 opacity-80 group-hover:opacity-100 transition-opacity">
  <ResponsiveContainer width="100%" height="100%">
    {/* 🔥 เปลี่ยน n จาก 'M', 'F' เป็น 'ชาย', 'หญิง' ตรงนี้ครับ */}
    <BarChart data={[
      { n: 'ชาย', v: stats.boys, c: '#3b82f6' }, 
      { n: 'หญิง', v: stats.girls, c: '#ec4899' }
    ]}>
      <CartesianGrid strokeDasharray="2 2" stroke="#06b6d410" vertical={false} />
      <XAxis dataKey="n" tick={{fill: '#0891b2', fontSize: 10}} axisLine={false} tickLine={false} />
      <Bar dataKey="v" radius={[2, 2, 0, 0]} barSize={30}>
        {/* 🔥 และอย่าลืมเปลี่ยนตรง map เพื่อให้สีตรงกับแถบด้วยครับ */}
        {[
          { n: 'ชาย', v: stats.boys, c: '#3b82f6' }, 
          { n: 'หญิง', v: stats.girls, c: '#ec4899' }
        ].map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.c} fillOpacity={0.6} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
</div>

                {/* Rooms Breakdown */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {["11", "12", "21", "22"].map((roomId) => {
                    const count = stats.data.filter(s => s.room_number === roomId).length;
                    return (
                      <div key={roomId} className="bg-black/40 p-2 border border-white/5 flex flex-col">
                        <span className="text-[12px] text-slate-500 uppercase truncate">{getRoomFullName(roomId)}</span>
                        <span className="text-xl font-bold text-cyan-400">{count} คน</span>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Total */}
                <div className="mt-6 pt-4 border-t border-cyan-900/50 flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-cyan-800 uppercase tracking-[0.4em]">Capacity_Load</span>
                    <div className="w-20 h-1 bg-cyan-900/30 mt-1 overflow-hidden">
                      <div className="h-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]" style={{width: `${Math.min(stats.total * 5, 100)}%`}}></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[28px] font-black leading-none text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]">
                      {stats.total.toString().padStart(2, '0')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function MetricBox({ label, value, icon, color = "cyan" }: { label: string, value: any, icon?: any, color?: string }) {
  const colorMap: any = {
    cyan: "border-cyan-500/30 text-cyan-400 shadow-cyan-500/5",
    blue: "border-blue-500/30 text-blue-400 shadow-blue-500/5",
    pink: "border-pink-500/30 text-pink-400 shadow-pink-500/5",
    emerald: "border-emerald-500/30 text-emerald-400 shadow-emerald-500/5"
  };

  return (
    <div className={`relative bg-black/40 border p-4 backdrop-blur-sm overflow-hidden group transition-all hover:bg-black/60 ${colorMap[color]}`}>
      <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-30 transition-opacity">{icon}</div>
      <p className="text-[8px] font-bold tracking-[0.3em] uppercase opacity-60 mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black italic">{value}</span>
        <span className="text-[10px] opacity-40">คน</span>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-current to-transparent opacity-20"></div>
    </div>
  );
}