"use client";
import LightHomeButton from "@/components/LightHomeButton";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import StudentCard from "@/components/student/StudentCard";
import Link from "next/link";

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) setStudents(data);
      setLoading(false);
    };
    fetchStudents();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-800 ">ระบบดูแล<span className="text-blue-400">นักเรียน</span> 👶</h1>
            <p className="text-slate-400 font-bold mt-1">รายชื่อ และ สถานะนักเรียน</p>
          </div>
          <Link 
            href="/admin/add-student" 
            className="px-8 py-4 bg-blue-500 text-white rounded-[2rem] font-black hover:bg-blue-400 transition-all shadow-lg shadow-blue-200"
          >
            + เพิ่มนักเรียนใหม่
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-bounce text-blue-400 font-black">กำลังโหลดข้อมูล...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {students.map((student) => (
              /** * ✅ แก้ไขเรียบร้อย: ย้าย key มาไว้ที่ <div> ที่เป็นชั้นนอกสุดของ loop 
               * ช่วยให้ React ระบุตัวตนของแต่ละ Card ได้ถูกต้องและ Error หายไปครับ
               */
              <div key={student.id} className="bg-white p-2 rounded-[3.5rem] shadow-sm hover:shadow-xl transition-all"> 
                <StudentCard student={student} /> 
              </div>
            ))}
          </div>
        )}
      </div>
      <LightHomeButton />
    </div>
  );
}