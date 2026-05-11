// app/students/profiles/page.tsx
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import StudentCard from "@/components/student/StudentCard"; // 👈 ดึง Component มาใช้ตามที่เคยทำ

export default async function StudentProfilePage() {
  // 1. ระบุตัวตน User ที่ Login อยู่
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return notFound();

  // 2. ดึงข้อมูลนักเรียน (ดึงมาทีเดียวให้ครบทุก Field)
  const { data: student, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", user.id) 
    .single();

  if (error || !student) return notFound();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* 3. ส่งข้อมูลนักเรียนเข้าไปใน Component ที่เพื่อนสร้างไว้ */}
        <StudentCard student={student} />
      </div>
    </div>
  );
}