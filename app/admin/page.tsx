"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HUDHomeButtonII from "@/components/HUDHomeButtonII";
import { Users, UserPlus, FileBarChart, Settings, ShieldCheck, Clock3, LayoutDashboard, UserPlus2 } from "lucide-react";
import Image from "next/image";

export default function AdminCDCPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // ✅ อ่านค่าจาก localStorage โดยตรง (แก้ปัญหา GUEST)
    const sessionData = localStorage.getItem("user_session");
    if (!sessionData) {
      router.push("/login");
    } else {
      setUserProfile(JSON.parse(sessionData));
    }

    return () => clearInterval(timer);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    router.push("/login");
  };

  const allMenus = [
    { 
      title: "แผงควบคุมระบบ", 
      desc: "ภาพรวมสถิติและข้อมูลทั้งหมด", 
      icon: <LayoutDashboard className="w-8 h-8 text-cyan-400" />, 
      href: "/admin/dashboard", 
      roles: ["teacher", "admin", "super_admin"] 
    },
    { 
      title: "จัดการข้อมูลนักเรียน", 
      desc: "ดูรายชื่อ และสถานะ", 
      icon: <Users className="w-8 h-8 text-cyan-400" />, 
      href: "/admin/students", 
      roles: ["teacher", "admin", "super_admin"] 
    },
    { 
      title: "เพิ่มข้อมูลนักเรียนใหม่", 
      desc: "ลงทะเบียนนักเรียน", 
      icon: <UserPlus2 className="w-8 h-8 text-cyan-400" />, 
      href: "/admin/add-student", 
      roles: ["teacher", "admin", "super_admin"] 
    },
    { 
      title: "จัดการทำเนียบครู", 
      desc: "ข้อมูลบุคลากร", 
      icon: <UserPlus className="w-8 h-8 text-cyan-400" />, 
      href: "/admin/teachers", 
      roles: ["admin", "super_admin"] 
    },
    // ✅ เพิ่มเมนูรายงานกลับเข้าไปตรงนี้ครับ
    { 
      title: "รายงานและสถิติ", 
      desc: "สรุปจำนวนเด็กแยกตามศูนย์", 
      icon: <FileBarChart className="w-8 h-8 text-cyan-400" />, 
      href: "/admin/admin-dashboard", 
      roles: ["teacher", "admin", "super_admin"] 
    },
    { 
      title: "Education Office", 
      desc: "กองการศึกษาเทศบาลเมืองท่าบ่อ", 
      icon: <Users className="w-8 h-8 text-cyan-400" />, 
      href: "/admin/education-office", 
      roles: ["super_admin"] 
    },
  ];
  const adminMenus = allMenus.filter(item => item.roles.includes(userProfile?.role));

  if (!mounted || !userProfile) return null;

  return (
    <div className="min-h-screen bg-black p-6 flex flex-col items-center relative font-mono">
      <div className="absolute inset-4 border-2 border-cyan-500/30 rounded-lg pointer-events-none"></div>

      <div className="w-full max-w-5xl flex justify-between items-center mb-10 z-10">
        <HUDHomeButtonII />
        <div className="flex gap-4">
          <div className="bg-slate-900 px-4 py-2 border border-cyan-500/30 rounded-md">
            <span className="text-[10px] text-cyan-300 font-bold uppercase">AUTH_LEVEL: {userProfile.role}</span>
          </div>
          <div className="bg-slate-900 px-4 py-2 border border-cyan-500/30 rounded-md">
            <span className="text-xs text-white">{currentTime.toLocaleTimeString('th-TH')}</span>
          </div>
        </div>
      </div>

      <div className="text-center mb-10 z-10 flex flex-col items-center">
        <Image src="/logo.png" alt="Logo" width={100} height={100} />
        <h1 className="text-4xl font-black text-white mt-4">ADMIN <span className="text-cyan-400">PANEL</span></h1>
      </div>

      <div className="w-full max-w-xl space-y-4 z-10">
        {adminMenus.map((item, idx) => (
          <Link href={item.href} key={idx} className="no-underline">
            <div className="group bg-slate-950/80 p-5 rounded-lg border border-cyan-500/30 flex items-center gap-6 hover:border-cyan-400 transition-all">
              <div className="bg-slate-900 p-3 rounded-md">{item.icon}</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-300">{item.title}</h3>
                <p className="text-[10px] text-cyan-600 uppercase">{item.desc}</p>
              </div>
              <div className="text-xl text-cyan-400 opacity-50 group-hover:opacity-100">→</div>
            </div>
          </Link>
        ))}
      </div>

      <button onClick={handleLogout} className="mt-12 text-slate-500 text-[10px] hover:text-red-400 z-10">LOGOUT FROM SYSTEM</button>
    </div>
  );
}