"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import StudentCardII from "@/components/student/StudentCardII"; // ✅ มั่นใจว่า Import ตัวท็อปมาแล้ว

export default function StudentDashboard({ params }: { params: { id: string } }) {
  const [student, setStudent] = useState<any>(null); // ✅ ตัวแปรชื่อ student

  // app/students/dashboard/[id]/page.tsx

useEffect(() => {
  async function fetchStudent() {
    const { data, error } = await supabase
      .from("students")
      .select("*") // ✅ ดึงทุกอย่างในตารางเดียว จบสวย!
      .eq("id", params.id)
      .single();

    if (data) {
      setStudent(data);
    }
    if (error) console.error("Error:", error.message);
  }
  fetchStudent();
}, [params.id]);

  if (!student) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
       <div className="p-10 text-center font-black text-indigo-500 animate-pulse tracking-[0.3em]">
         INITIALIZING DATA...
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
      {/* 🚀 ใช้ชื่อตัวแปร student ให้ตรงกับข้างบนครับเพื่อน! */}
      <StudentCardII student={student} /> 
    </div>
  );
}