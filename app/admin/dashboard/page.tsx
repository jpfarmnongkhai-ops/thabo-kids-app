"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import HUDPerformance from "@/components/HUDPerformance";

interface DashboardStats {
  total: { all: number; male: number; female: number };
  thaSadet: { all: number; male: number; female: number };
  thaSadetExtra: { all: number; male: number; female: number };
  namMong: { all: number; male: number; female: number };
  attendanceToday: number;
}

export default function AdminControlCenter() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false); // 🔥 สำคัญมาก
  const [stats, setStats] = useState<DashboardStats>({
    total: { all: 0, male: 0, female: 0 },
    thaSadet: { all: 0, male: 0, female: 0 },
    thaSadetExtra: { all: 0, male: 0, female: 0 },
    namMong: { all: 0, male: 0, female: 0 },
    attendanceToday: 0
  });
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    setMounted(true); // บอก Browser ว่าพร้อมแสดงผลแล้ว
    
    const session = localStorage.getItem("user_session");
    if (!session) { router.push("/admin/login"); return; }
    try {
      const userData = JSON.parse(session);
      setAdminName(userData.display_name || userData.full_name || "Admin");
    } catch (e) { router.push("/admin/login"); }

    const fetchData = async () => {
  // --- 1. เตรียมวันที่ให้ตรงกับที่บันทึกในหน้าเช็คชื่อ ---
  const today = new Date().toISOString().split('T')[0];

  // --- 2. ดึงข้อมูลสถิตินักเรียน (ส่วนเดิมของเพื่อน) ---
  const { data: allStudents } = await supabase.from("students").select("*");
  if (allStudents) setStudents(allStudents);

  const getStats = async (centerId?: string) => {
    let baseQuery = supabase.from("students").select("*", { count: 'exact', head: true });
    if (centerId) baseQuery = baseQuery.eq("center_id", centerId);

    const [all, male, female] = await Promise.all([
      baseQuery,
      supabase.from("students").select("*", { count: 'exact', head: true }).eq("gender", "ชาย").match(centerId ? {center_id: centerId} : {}),
      supabase.from("students").select("*", { count: 'exact', head: true }).eq("gender", "หญิง").match(centerId ? {center_id: centerId} : {})
    ]);
    return { all: all.count || 0, male: male.count || 0, female: female.count || 0 };
  };

  // 🔥 3. เพิ่มการนับจำนวนคนมาเรียนวันนี้ (Query จากตาราง attendance)
  const [total, ts, tsExtra, nm, attendanceCount] = await Promise.all([
    getStats(),
    getStats("01"),
    getStats("11"),
    getStats("02"),
    // นับเฉพาะสถานะ 'present' และ 'late' ตามที่เพื่อนเขียนไว้ในหน้าเช็คชื่อ
    supabase.from("attendance")
      .select("*", { count: 'exact', head: true })
      .eq("check_date", today)
      .in("status", ["present", "late"]) 
  ]);

  // --- 4. อัปเดตค่าเข้า Stats (เปลี่ยนจาก 0 เป็น attendanceCount.count) ---
  setStats({ 
    total, 
    thaSadet: ts, 
    thaSadetExtra: tsExtra, 
    namMong: nm, 
    attendanceToday: attendanceCount.count || 0 // 🔥 แก้ตรงนี้ครับ!
  });
};

    fetchData();
  }, [router]);

  // 🔥 ถ้ายังไม่ Mounted ให้ return null เพื่อป้องกัน Hydration Error
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight">Admin Panel 🛠️</h1>
            <p className="text-slate-500 font-bold mt-2 text-lg uppercase tracking-widest">
              ศูนย์พัฒนาเด็กเล็กเทศบาลเมืองท่าบ่อ (สวัสดี, {adminName})
            </p>
          </div>
          <button onClick={() => { localStorage.removeItem("user_session"); router.push("/admin/login"); }}
            className="px-8 py-3 bg-white text-red-500 border-4 border-red-50 rounded-2xl font-black hover:bg-red-50 transition-all shadow-lg">
            Log Out
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
          <StatBox label="นักเรียนทั้งหมด" stats={stats.total} bgColor="bg-[#BFDBFE]" textColor="text-blue-700" />
          <StatBox label="ศูนย์ 1 ท่าเสด็จ" stats={stats.thaSadet} bgColor="bg-[#BBF7D0]" textColor="text-emerald-700" />
          <StatBox label="ศูนย์ 1 (เพิ่มเติม)" stats={stats.thaSadetExtra} bgColor="bg-[#DCFCE7]" textColor="text-emerald-600" />
          <StatBox label="ศูนย์ 2 บ้านน้ำโมง" stats={stats.namMong} bgColor="bg-[#FEF08A]" textColor="text-yellow-700" />
          <StatBox label="มาเรียนวันนี้" value={stats.attendanceToday} isAttendance bgColor="bg-[#FECACA]" textColor="text-red-700" />
        </div>

        {/* Menu Grid & HUD Sci-Fi */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <MenuCard title="จัดการนักเรียน" desc="รายชื่อนักเรียน ย้ายห้อง และสถานะ" icon="👶" href="/admin/students" color="rose" />
            <MenuCard title="ลงเวลาเรียน" desc="บันทึกการมาเรียนประจำวัน" icon="📝" href="/admin/attendance" color="amber" />
            <MenuCard title="จัดการบุคลากร" desc="ข้อมูลครูและเบอร์ติดต่อ" icon="👩‍🏫" href="/admin/teachers" color="green" />
            <MenuCard title="คลังเอกสาร" desc="ระเบียบ สั่งการ และเอกสารราชการ" icon="📁" href="/admin/docs-cdc" color="blue" />
          </div>
          <HUDPerformance students={students} />
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, stats, value, bgColor, textColor, isAttendance }: any) {
  const displayValue = isAttendance ? (value ?? 0) : (stats?.all ?? 0);
  
  // ถ้าเป็นช่องมาเรียนวันนี้ ให้ดึงยอดรวมชาย-หญิงมาโชว์หลอกๆ ไว้ก่อนก็ได้ครับ หรือปล่อยเป็น 0 ไว้
  const male = isAttendance ? 0 : (stats?.male ?? 0);
  const female = isAttendance ? 0 : (stats?.female ?? 0);

  return (
    <div className="flex flex-col gap-1 transition-transform hover:scale-105">
      <div className={`${bgColor} p-6 rounded-t-[2rem] border-x-2 border-t-2 border-white/50 text-center shadow-sm`}>
        <p className={`text-[10px] font-black ${textColor} uppercase opacity-70 tracking-tighter mb-1`}>{label}</p>
        <p className={`text-3xl font-black ${textColor}`}>{displayValue.toLocaleString()}</p>
      </div>
      
      {/* 🔥 เอา !isAttendance ออก เพื่อให้แถบสีม่วงแสดงผลในทุกช่อง */}
      <div className="bg-[#E9B7FF] rounded-b-[1rem] py-2 px-4 flex justify-between text-[10px] font-black text-white shadow-md border-b-2 border-purple-300">
        <span>ชาย {male} คน</span>
        <span>หญิง {female} คน</span>
      </div>
    </div>
  );
}

function MenuCard({ title, desc, icon, href, color }: any) {
  const colors: any = { rose: "bg-[#FEE2E2] text-red-600", amber: "bg-[#FEF3C7] text-amber-600", green: "bg-[#DCFCE7] text-emerald-600", blue: "bg-[#DBEAFE] text-blue-600" };
  return (
    <Link href={href} className="bg-white p-8 rounded-[3rem] border-4 border-slate-50 shadow-xl hover:-translate-y-2 transition-all group">
      <div className={`w-16 h-16 ${colors[color]} rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform`}>{icon}</div>
      <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-400 font-bold text-xs">{desc}</p>
    </Link>
  );
}