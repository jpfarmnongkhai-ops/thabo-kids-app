"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AddStudentPage() {
  const [dbTeachers, setDbTeachers] = useState<any[]>([]);
  const [id10, setId10] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ 1. เพิ่มตัวแปรนี้กลับเข้าไปให้ถูกต้อง (สาเหตุที่ Error)
  const roomOptions = [
    { label: "เลือกห้องเรียน", value: "00" },
    { label: "เด็กเล็ก 1/1", value: "11" },
    { label: "เด็กเล็ก 1/2", value: "12" },
    { label: "อนุบาล 1/1", value: "21" },
    { label: "อนุบาล 1/2", value: "22" },
  ];

  const [formData, setFormData] = useState({
    year: "69",
    center: "01",
    room: "11",
    gender: "01",
    sequence: "01",
    firstName: "",
    lastName: "",
    nickname: "",
    teacherName: "",
    allergies: "ไม่มี",
    phone_number: "",
  });

  // ... (โค้ด useEffect และ handleSubmit เหมือนเดิมที่ผมให้ไปล่าสุดได้เลยครับ)

  // --- 🚀 ดึงข้อมูลครู ---
  useEffect(() => {
    const fetchTeachers = async () => {
      const { data } = await supabase
        .from("teachers")
        .select("first_name, last_name, nickname")
        .order("first_name", { ascending: true });
      if (data) setDbTeachers(data);
    };
    fetchTeachers();
  }, []);

  // --- 🛠️ รันเลข 10 หลัก ---
  useEffect(() => {
    setId10(`${formData.year}${formData.center}${formData.room}${formData.gender}${formData.sequence}`);
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.room === "00") return alert("❌ กรุณาเลือกห้องเรียน");
    if (!formData.teacherName) return alert("❌ กรุณาเลือกครูประจำชั้น");

    setIsSubmitting(true);

    const finalCenterId = formData.center === "11" ? "01_extra" : formData.center;
    const cleanPhone = formData.phone_number.trim().replace(/-/g, "");

    try {
      // 1. บันทึกข้อมูลลงตาราง students (ดึง ID UUID กลับมา)
      const { data: newStudent, error: studentError } = await supabase
        .from("students")
        .insert([{
          student_id_10: id10,
          first_name: formData.firstName,
          last_name: formData.lastName,
          nickname: formData.nickname,
          center_id: finalCenterId,
          room_number: formData.room,
          gender_code: formData.gender,
          teacher_name: formData.teacherName,
          allergies: formData.allergies,
          phone_number: cleanPhone
        }])
        .select()
        .single();

      if (studentError) throw studentError;

      // 2. บันทึกโปรไฟล์ (ใช้ UUID จาก Step 1)
      const { error: profileError } = await supabase
        .from("profiles")
        .insert([{
          id: newStudent.id,
          phone_number: cleanPhone,
          password: "123456",
          role: "student",
          display_name: formData.nickname,
          first_name: formData.firstName,
          last_name: formData.lastName,
          center_id: finalCenterId,
          is_first_login: true
        }]);

      if (profileError) throw profileError;

      alert(`✅ ลงทะเบียน "น้อง${formData.nickname}" สำเร็จ!`);
      
      // ล้างฟอร์ม
      setFormData({ 
        ...formData, 
        firstName: "", 
        lastName: "", 
        nickname: "", 
        phone_number: "",
        sequence: String(Number(formData.sequence) + 1).padStart(2, "0") 
      });

    } catch (error: any) {
      console.error(error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 flex justify-center items-center font-sans">
      <div className="max-w-xl w-full bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden">
        
        {/* Header ส่วนบนสุดแบบเท่ๆ */}
        <div className="bg-gradient-to-r from-[#6366F1] to-[#A855F7] p-8 text-white text-center relative">
          <div className="absolute top-4 right-6 text-white/20 text-4xl font-black italic">THABO</div>
          <h2 className="text-3xl font-black tracking-tight">ลงทะเบียนนักเรียน</h2>
          <p className="text-indigo-100 text-sm mt-1 font-medium opacity-80">ระบบบริหารจัดการศูนย์พัฒนาเด็กเล็ก</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* Badge รหัสประจำตัวแบบเก๋ๆ */}
          <div className="flex justify-center -mt-14">
            <div className="bg-white px-6 py-3 rounded-2xl shadow-xl border border-indigo-50 text-center">
              <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Student ID (10-Digit)</span>
              <span className="text-2xl font-mono font-bold text-slate-800 tracking-widest">{id10}</span>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-2">ชื่อจริง</label>
                <input placeholder="กรอกชื่อจริง" className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 transition-all font-medium text-slate-700" required 
                  value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-2">นามสกุล</label>
                <input placeholder="กรอกนามสกุล" className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 transition-all font-medium text-slate-700" required 
                  value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-2">ชื่อเล่น</label>
                <input placeholder="ชื่อเล่น" className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 transition-all font-medium text-slate-700" required
                  value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-2">เบอร์โทรผู้ปกครอง</label>
                <input type="tel" placeholder="08x-xxx-xxxx" className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 transition-all font-medium text-slate-700" required
                  value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-2">ศูนย์พัฒนาเด็กเล็ก</label>
                <select className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-slate-600 appearance-none" 
                  value={formData.center} onChange={e => setFormData({...formData, center: e.target.value})}>
                  <option value="01">ศูนย์ 1 ท่าเสด็จ</option>
                  <option value="11">ศูนย์ 1 (เพิ่มเติม)</option>
                  <option value="02">ศูนย์ 2 บ้านน้ำโมง</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-2">ห้องเรียน</label>
                <select className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-slate-600 appearance-none" 
                  value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})}>
                  {roomOptions.map((room) => (
                    <option key={room.value} value={room.value}>{room.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-2">ครูประจำชั้น</label>
                <select className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-slate-600 appearance-none"
                  value={formData.teacherName} onChange={e => setFormData({...formData, teacherName: e.target.value})} required>
                  <option value="">เลือกครูประจำชั้น</option>
                  {dbTeachers.map((teacher, index) => (
                    <option key={index} value={`${teacher.first_name} ${teacher.last_name}`}>
                      ครู{teacher.nickname || teacher.first_name} ({teacher.first_name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-2">ลำดับนักเรียน</label>
                <input placeholder="01" className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-slate-700 text-center" 
                  value={formData.sequence} onChange={e => setFormData({...formData, sequence: e.target.value})} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-indigo-500 ml-2 uppercase">แพ้อาหาร/โรคประจำตัว</label>
              <textarea placeholder="ระบุข้อมูลสำคัญ..." className="w-full bg-slate-50 p-4 rounded-2xl h-24 outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-slate-700 resize-none" 
                value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})} />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full py-5 rounded-[2rem] font-black text-xl text-white shadow-xl transition-all active:scale-95 ${
              isSubmitting ? 'bg-slate-400' : 'bg-gradient-to-r from-[#6366F1] to-[#A855F7] hover:shadow-indigo-200'
            }`}
          >
            {isSubmitting ? "กำลังบันทึก..." : "ยืนยันการลงทะเบียน"}
          </button>
          
          <div className="text-center pt-2">
            <Link href="/" className="text-slate-400 hover:text-indigo-500 text-sm font-bold transition-colors">
              กลับหน้าหลัก
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}