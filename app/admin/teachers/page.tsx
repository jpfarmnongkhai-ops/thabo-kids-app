"use client";
import LightHomeButton from "@/components/LightHomeButton";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import TeacherCard from "@/components/teacher/TeacherCard"; // นำ Component ที่เราทำไว้มาใช้

export default function TeacherListPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCenter, setSelectedCenter] = useState("all");

  useEffect(() => {
    async function fetchTeachers() {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .order("center_id", { ascending: true });
      
      if (!error) {
        setTeachers(data || []);
        setFilteredTeachers(data || []);
      }
      setLoading(false);
    }
    fetchTeachers();
  }, []);

  // ระบบ Search & Filter ค้นหาแบบ Real-time
  useEffect(() => {
    let result = teachers;

    if (searchTerm) {
      result = result.filter(t => 
        t.first_name.includes(searchTerm) || 
        t.last_name.includes(searchTerm) || 
        t.nickname.includes(searchTerm)
      );
    }

    if (selectedCenter !== "all") {
      result = result.filter(t => t.center_id === selectedCenter);
    }

    setFilteredTeachers(result);
  }, [searchTerm, selectedCenter, teachers]);

  return (
    <div className="min-h-screen bg-[#FDFCF0] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-6 bg-white p-8 rounded-[3rem] shadow-sm border-4 border-white">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-[2rem] flex items-center justify-center text-4xl shadow-xl shadow-indigo-100 animate-bounce-slow">👩‍🏫</div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-slate-800">ทำเนียบบุคลากร</h1>
              <p className="text-indigo-500 text-xs font-black uppercase tracking-[0.3em] mt-1">Tha Bo Municipality Education</p>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/admin/teachers/add" className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-indigo-600 transition-all shadow-xl active:scale-95 flex items-center gap-2">
              <span>+</span> เพิ่มคุณครูใหม่
            </Link>
          </div>
        </div>

        {/* --- Search & Filter Bar --- */}
        <div className="bg-white/60 backdrop-blur-md p-4 rounded-[2.5rem] mb-8 flex flex-col md:flex-row gap-4 border-2 border-white shadow-sm">
          <div className="flex-1 relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input 
              type="text"
              placeholder="ค้นหาชื่อคุณครู..."
              className="w-full pl-12 pr-6 py-4 bg-white rounded-2xl border-none shadow-inner focus:ring-2 focus:ring-indigo-400 font-bold text-slate-600"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-6 py-4 bg-white rounded-2xl border-none shadow-inner font-bold text-slate-600 focus:ring-2 focus:ring-indigo-400"
            onChange={(e) => setSelectedCenter(e.target.value)}
          >
            <option value="all">ทุกศูนย์พัฒนาเด็กเล็ก</option>
            <option value="01">ศูนย์ 1 ท่าเสด็จ</option>
            <option value="11">ศูนย์ 1 ท่าเสด็จ(เพิ่มเติม)</option>
            <option value="02">ศูนย์ 2 บ้านน้ำโมง</option>
          </select>
        </div>

        {/* --- Content Section --- */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 border-8 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="font-black text-slate-400 animate-pulse">กำลังจัดแถวคุณครู... กรุณารอสักครู่</p>
          </div>
        ) : (
          <>
            {filteredTeachers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredTeachers.map((t) => (
                  <div key={t.id} className="relative group">
                    <TeacherCard teacher={t} />
                    {/* Admin Actions Overlay */}
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                      <Link href={`/admin/teachers/edit/${t.id}`} className="w-10 h-10 bg-white/90 backdrop-blur shadow-lg rounded-xl flex items-center justify-center hover:bg-amber-500 hover:text-white transition-colors">
                        ✏️
                      </Link>
                      <button className="w-10 h-10 bg-white/90 backdrop-blur shadow-lg rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-slate-200">
                <span className="text-6xl block mb-4">💨</span>
                <p className="text-xl font-black text-slate-400">ไม่พบข้อมูลคุณครูที่คุณค้นหา</p>
              </div>
            )}
          </>
        )}
      </div>
      <LightHomeButton />
    </div>
  );
}