import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  // 1. ดึงข้อมูลนักเรียนจาก UUID ที่ส่งมาทาง URL
  const { data: student, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", params.id)
    .single();

  // 2. ถ้าไม่เจอข้อมูล หรือ ID ผิด ให้เด้งไปหน้า 404 ของ Next.js
  if (error || !student) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        
        {/* ปุ่มย้อนกลับ */}
        <Link href="/admin/students" className="inline-flex items-center text-slate-500 hover:text-blue-500 font-bold mb-6 transition-all">
          ⬅️ กลับไปหน้ารายชื่อ
        </Link>

        {/* Card ข้อมูลนักเรียน */}
        <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-slate-100">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-10 text-white text-center">
            <div className="w-24 h-24 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-inner">
              👶
            </div>
            <h1 className="text-3xl font-black">น้อง {student.nickname}</h1>
            <p className="opacity-80 font-bold">รหัสประจำตัว: {student.student_id_10}</p>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">ชื่อ-นามสกุล</label>
              <p className="text-xl font-bold text-slate-700">{student.first_name} {student.last_name}</p>
              
              <hr className="border-slate-50" />
              
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">คุณครูประจำชั้น</label>
              <p className="text-xl font-bold text-blue-600">{student.teacher_name}</p>
            </div>

            <div className="bg-blue-50 rounded-[2.5rem] p-6 text-center flex flex-col justify-center">
              <p className="text-xs font-black text-blue-400 uppercase mb-2">เบอร์โทรติดต่อครู/ผู้ปกครอง</p>
              <a href={`tel:${student.phone_number}`} className="text-2xl font-black text-blue-500 hover:scale-105 transition-transform inline-block">
                📞 {student.phone_number || "ไม่ได้ระบุ"}
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}