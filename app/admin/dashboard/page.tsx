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
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    total: { all: 0, male: 0, female: 0 },
    thaSadet: { all: 0, male: 0, female: 0 },
    thaSadetExtra: { all: 0, male: 0, female: 0 },
    namMong: { all: 0, male: 0, female: 0 },
    attendanceToday: 0
  });
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    setMounted(true);
    const session = localStorage.getItem("user_session");
    if (!session) { router.push("/admin/login"); return; }
    try {
      const userData = JSON.parse(session);
      setAdminName(userData.display_name || userData.full_name || "Admin");
    } catch (e) { router.push("/admin/login"); }

    const fetchData = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data: allStudents } = await supabase.from("students").select("*");
      if (allStudents) setStudents(allStudents);

      // 🎯 แก้ไขฟังก์ชันดึงสถิติให้ใช้ gender_code ("01" = ชาย, "02" = หญิง)
      const getStats = async (centerId?: string) => {
        let baseQuery = supabase.from("students").select("*", { count: 'exact', head: true });
        if (centerId) baseQuery = baseQuery.eq("center_id", centerId);

        const [all, male, female] = await Promise.all([
          baseQuery,
          supabase.from("students")
            .select("*", { count: 'exact', head: true })
            .eq("gender_code", "01") // 🎯 เปลี่ยนจาก gender = 'ชาย' เป็น gender_code = '01'
            .match(centerId ? { center_id: centerId } : {}),
          supabase.from("students")
            .select("*", { count: 'exact', head: true })
            .eq("gender_code", "02") // 🎯 เปลี่ยนจาก gender = 'หญิง' เป็น gender_code = '02'
            .match(centerId ? { center_id: centerId } : {})
        ]);
        return { all: all.count || 0, male: male.count || 0, female: female.count || 0 };
      };

      const [total, ts, tsExtra, nm, attendanceCount] = await Promise.all([
        getStats(),
        getStats("01"),
        getStats("11"),
        getStats("02"),
        supabase.from("attendance").select("*", { count: 'exact', head: true }).eq("check_date", today).in("status", ["present", "late"]) 
      ]);

      setStats({ 
        total, 
        thaSadet: ts, 
        thaSadetExtra: tsExtra, 
        namMong: nm, 
        attendanceToday: attendanceCount.count || 0 
      });
    };

    fetchData();
  }, [router]);

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
          {/* บังคับส่งค่า isAttendance เพื่อจัดการการแสดงผลแถบล่างให้สวยงาม */}
          <StatBox label="มาเรียนวันนี้" value={stats.attendanceToday} isAttendance bgColor="bg-[#FECACA]" textColor="text-red-700" />
        </div>

        {/* Menu Grid & HUD Sci-Fi */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MenuCard title="จัดการนักเรียน" desc="รายชื่อนักเรียน ย้ายห้อง และสถานะ" icon="👶" href="/admin/students" color="rose" />
          <MenuCard title="เช็คชื่อเด็กนักเรียน" desc="บันทึกการมาเรียนประจำวัน" icon="📝" href="/admin/attendance" color="amber" />
          <MenuCard title="บันทึกผลการประเมิน" desc="ประเมินพัฒนาการและหน่วยการเรียนรู้" icon="📊" href="/admin/assessment" color="purple" />
          <MenuCard title="จัดการบุคลากร" desc="ข้อมูลครูและเบอร์ติดต่อ" icon="👩‍🏫" href="/admin/teachers" color="green" />
          <MenuCard title="คลังเอกสาร" desc="ระเบียบ สั่งการ และเอกสารราชการ" icon="📁" href="/admin/docs-cdc" color="blue" />
          <HUDPerformance students={students} />
        </div>

      </div>
    </div>
  );
}

function StatBox({ label, stats, value, bgColor, textColor, isAttendance }: any) {
  const displayValue = isAttendance ? (value ?? 0) : (stats?.all ?? 0);
  const male = isAttendance ? 0 : (stats?.male ?? 0);
  const female = isAttendance ? 0 : (stats?.female ?? 0);

  return (
    <div className="flex flex-col gap-1 transition-transform hover:scale-105">
      <div className={`${bgColor} p-6 rounded-t-[2rem] border-x-2 border-t-2 border-white/50 text-center shadow-sm flex-1 flex flex-col justify-center`}>
        <p className={`text-[10px] font-black ${textColor} uppercase opacity-70 tracking-tighter mb-1`}>{label}</p>
        <p className={`text-3xl font-black ${textColor}`}>{displayValue.toLocaleString()}</p>
      </div>
      {/* 🎯 ซ่อนหรือเปลี่ยนรูปแบบแถบสรุปด้านล่างกรณีเป็นกล่องแจ้งยอดเข้าเรียนวันนี้ */}
      <div className={`${isAttendance ? 'bg-red-400/90' : 'bg-[#E9B7FF]'} rounded-b-[1rem] py-2 px-4 flex justify-between text-[10px] font-black text-white shadow-md border-b-2 ${isAttendance ? 'border-red-400' : 'border-purple-300'}`}>
        {isAttendance ? (
          <span className="w-full text-center uppercase tracking-wider">DAILY_ATTENDANCE_LOG</span>
        ) : (
          <>
            <span>ชาย {male} คน</span>
            <span>หญิง {female} คน</span>
          </>
        )}
      </div>
    </div>
  );
}

function MenuCard({ title, desc, icon, href, color }: any) {
  const colors: any = { 
    rose: "bg-[#FEE2E2] text-red-600", 
    amber: "bg-[#FEF3C7] text-amber-600", 
    green: "bg-[#DCFCE7] text-emerald-600", 
    blue: "bg-[#DBEAFE] text-blue-600",
    purple: "bg-[#F3E8FF] text-purple-600" 
  };

  return (
    <Link href={href} className="bg-white p-8 rounded-[3rem] border-4 border-slate-50 shadow-xl hover:-translate-y-2 transition-all group">
      <div className={`w-16 h-16 ${colors[color]} rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-400 font-bold text-xs">{desc}</p>
    </Link>
  );
}