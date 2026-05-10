"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const sessionData = localStorage.getItem("user_session");
    if (!sessionData) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(sessionData);
    setUserRole(user.role);
    setUserName(user.display_name || user.nickname);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    router.push("/login");
  };

  const restrictedAccess = (e: React.MouseEvent, allowedRoles: string[]) => {
    if (!userRole || !allowedRoles.includes(userRole)) {
      e.preventDefault();
      alert("❌ ขออภัยครับ JP! สิทธิ์ของคุณไม่สามารถเข้าถึงส่วนนี้ได้");
    }
  };

  const menus = [
    { title: "ลงทะเบียนเด็กใหม่", icon: "➕", link: "/admin/add-student", color: "bg-[#F3C1E4]", textColor: "text-[#8E4D7E]", roles: ['super_admin', 'admin', 'teacher'] },
    { title: "รายชื่อนักเรียน", icon: "👶", link: "/admin/students", color: "bg-[#FFB7B2]", textColor: "text-[#8E443D]", roles: ['super_admin', 'admin', 'teacher'] },
    { title: "ทำเนียบครู", icon: "👩‍🏫", link: "/admin/teachers", color: "bg-[#FFF4B5]", textColor: "text-[#8B7E2E]", roles: ['super_admin', 'admin'] },
    { title: "Dashboard สถิติ", icon: "📊", link: "/admin/dashboard", color: "bg-[#B4E3B4]", textColor: "text-[#3D6E3D]", roles: ['super_admin', 'admin', 'teacher'] },
    { title: "Admin Panel ", icon: "⚡", link: "/admin", color: "bg-[#336666]", textColor: "text-cyan-400", roles: ['super_admin', 'admin'] },
 { title: "Education Office", icon: "⚡", link: "/admin/education-office", color: "bg-[#003366]", textColor: "text-cyan-400", roles: ['super_admin', 'admin'] },
  ];

  if (!userRole) return null;

  return (
    <div className="min-h-screen bg-[#FDFCF0] p-6 flex flex-col items-center py-12 font-sans">
      <div className="text-center mb-10">
        <div className="w-24 h-24 mx-auto mb-6 drop-shadow-xl">
          <img src="/logo.png" alt="Thabo Kids Logo" className="w-full h-full object-contain" />
        </div>
        <p className="text-pink-500 font-black text-xs uppercase tracking-widest mb-1">ยินดีต้อนรับคุณ {userName} 👋</p>
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter">THABO KIDS SYSTEM</h1>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {menus.map((item, index) => (
          <Link key={index} href={item.link} onClick={(e) => restrictedAccess(e, item.roles)}
            className={`group flex items-center p-5 rounded-[2rem] border-4 border-white shadow-lg transition-all active:scale-95
            ${userRole && item.roles.includes(userRole) ? `${item.color} ${item.textColor}` : 'bg-slate-100 text-slate-300 grayscale opacity-60'}`}>
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm mr-5">{item.icon}</div>
            <div className="flex-1"><h3 className="text-lg font-black leading-none">{item.title}</h3></div>
            <div className="text-xl opacity-30">→</div>
          </Link>
        ))}
      </div>

      <div className="mt-12 text-center">
        <button onClick={handleLogout} className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] hover:text-red-400">Logout from System</button>
      </div>
    </div>
  );
}