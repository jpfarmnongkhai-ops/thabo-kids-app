"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// กำหนด Interface เพื่อความแม่นยำของข้อมูล
interface DashboardStats {
  total: number;
  thaSadet: number;
  thaSadetExtra: number;
  namMong: number;
  attendanceToday: number;
}

export default function AdminControlCenter() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    thaSadet: 0,
    thaSadetExtra:0,
    namMong: 0,
    attendanceToday: 0
  });
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    // 1. ตรวจสอบ Session
    const session = localStorage.getItem("user_session");
    if (!session) {
      router.push("/admin/login");
      return;
    }
    try {
      const userData = JSON.parse(session);
      // ตรวจสอบชื่อจากฐานข้อมูล (รองรับทั้ง display_name และ full_name)
      setAdminName(userData.display_name || userData.full_name || "Admin");
    } catch (e) {
      router.push("/admin/login");
    }

    // 2. ดึงข้อมูลสถิติแบบขนาน (Parallel) เพื่อความรวดเร็ว
    const fetchStats = async () => {
      const [totalRes, tsRes, nmRes] = await Promise.all([
        supabase.from("students").select("*", { count: 'exact', head: true }),
        supabase.from("students").select("*", { count: 'exact', head: true }).eq("center_id", "01"),
        supabase.from("students").select("*", { count: 'exact', head: true }).eq("center_id", "02")
      ]);

      setStats({
         total: 0,
    thaSadet: 0,
    thaSadetExtra:0,
    namMong: 0,
    attendanceToday: 0
      });
    };

    fetchStats();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight">Admin Panel 🛠️</h1>
            <p className="text-slate-500 font-bold mt-2 text-lg uppercase tracking-widest">
                ศูนย์พัฒนาเด็กเล็กเทศบาลเมืองท่าบ่อ (สวัสดี, {adminName})
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-10 py-4 bg-white text-red-500 border-4 border-red-50 rounded-[2rem] font-black hover:bg-red-50 transition-all shadow-lg shadow-red-100/50"
          >
            Log Out
          </button>
        </div>

       {/* Quick Stats - ปรับให้แยก 3 ศูนย์ตามจริง */}
<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
  <StatBox label="นักเรียนทั้งหมด" value={stats.total} bgColor="bg-[#BFDBFE]" textColor="text-blue-700" />
  
  {/* แยกศูนย์ 1 */}
  <StatBox label="ศูนย์ 1 ท่าเสด็จ" value={stats.thaSadet} bgColor="bg-[#BBF7D0]" textColor="text-emerald-700" />
  
  {/* แยกศูนย์ 1 (เพิ่มเติม) */}
  <StatBox label="ศูนย์ 1 (เพิ่มเติม)" value={stats.thaSadetExtra} bgColor="bg-[#DCFCE7]" textColor="text-emerald-600" />
  
  {/* แยกศูนย์ 2 */}
  <StatBox label="ศูนย์ 2 บ้านน้ำโมง" value={stats.namMong} bgColor="bg-[#FEF08A]" textColor="text-yellow-700" />
  
  <StatBox label="มาเรียนวันนี้" value={stats.attendanceToday} bgColor="bg-[#FECACA]" textColor="text-red-700" />
</div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <MenuCard 
            title="จัดการนักเรียน" 
            desc="รายชื่อนักเรียน ย้ายห้อง และสถานะ" 
            icon="👶" 
            href="/admin/students" 
            color="rose" 
          />
          <MenuCard 
            title="ลงเวลาเรียน" 
            desc="บันทึกการมาเรียนประจำวัน" 
            icon="📝" 
            href="/admin/attendance" 
            color="amber" 
          />
          <MenuCard 
            title="จัดการบุคลากร" 
            desc="ข้อมูลครูและเบอร์ติดต่อสื่อสาร" 
            icon="👩‍🏫" 
            href="/admin/teachers" 
            color="green" 
          />
          {/* เพิ่มเมนูคลังเอกสารที่หายไป */}
          <MenuCard 
            title="คลังเอกสาร" 
            desc="ระเบียบ สั่งการ และเอกสารราชการ" 
            icon="📁" 
            href="/admin/docs-cdc" 
            color="blue" 
          />
          <MenuCard 
            title="Dashboard" 
            desc="สถิติภาพรวมสำหรับ ผู้อนวยการกองการศึกษา" 
            icon="📊" 
            href="/admin/director" 
            color="purple" 
            isExternal 
          />
        </div>

        <div className="mt-20 text-center">
          <p className="text-slate-300 font-bold text-sm tracking-widest uppercase italic">
            Developed with heart for Thabo Municipality ⚡
          </p>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, bgColor, textColor }: any) {
  return (
    <div className={`${bgColor} p-6 rounded-[2rem] border-2 border-white/50 text-center shadow-sm`}>
      <p className={`text-[10px] font-black ${textColor} uppercase opacity-70 tracking-tighter mb-1`}>{label}</p>
      <p className={`text-3xl font-black ${textColor}`}>{value.toLocaleString()}</p>
    </div>
  );
}

function MenuCard({ title, desc, icon, href, color, isExternal = false }: any) {
  const colors: any = {
    rose: "bg-[#FEE2E2] text-red-600 shadow-red-100",
    amber: "bg-[#FEF3C7] text-amber-600 shadow-amber-100",
    green: "bg-[#DCFCE7] text-emerald-600 shadow-emerald-100",
    blue: "bg-[#DBEAFE] text-blue-600 shadow-blue-100",
    purple: "bg-[#F3E8FF] text-purple-600 shadow-purple-100"
  };

  return (
    <Link 
      href={href} 
      target={isExternal ? "_blank" : "_self"} 
      className="bg-white p-10 rounded-[3.5rem] border-4 border-slate-50 shadow-xl shadow-slate-200/50 hover:-translate-y-3 transition-all group relative overflow-hidden"
    >
      <div className={`w-20 h-20 ${colors[color]} rounded-[2rem] flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">{title}</h3>
      <p className="text-slate-400 font-bold leading-relaxed text-sm">{desc}</p>
      <div className="absolute bottom-10 right-10 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all text-2xl text-slate-300">
        →
      </div>
    </Link>
  );
}