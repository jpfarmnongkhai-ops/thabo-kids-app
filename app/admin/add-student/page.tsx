"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AddStudentPage() {
  const [dbTeachers, setDbTeachers] = useState<any[]>([]);
  const [selectedTeacherData, setSelectedTeacherData] = useState<any>(null);
  const [id10, setId10] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ ฟังก์ชันตัวแปรตามที่เพื่อนขอเป๊ะๆ
  const getCenterFullName = (id: string) => {
    const names: any = { 
      "01": "ศูนย์ 1 ท่าเสด็จ", 
      "11": "ศูนย์ 1 ท่าเสด็จ(เพิ่มเติม)", 
      "02": "ศูนย์ 2 บ้านน้ำโมง", 
      "12": "ศูนย์ 2 บ้านน้ำโมง" 
    };
    return names[id] || `ศูนย์รหัส ${id}`;
  };

  const getRoomFullName = (roomId: string) => {
    const rooms: any = { 
      "11": "เด็กเล็ก 1/1", 
      "12": "เด็กเล็ก 1/2", 
      "21": "อนุบาล 1/1", 
      "22": "อนุบาล 1/2" 
    };
    return rooms[roomId] || `ห้อง ${roomId}`;
  };

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

  // ดึงข้อมูลครูตามห้องที่เลือก
  useEffect(() => {
    const fetchTeachersByRoom = async () => {
      if (!formData.room || formData.room === "00") return;
      const { data } = await supabase
        .from("teachers")
        .select("*")
        .eq("room_number", formData.room)
        .order("first_name", { ascending: true });
      if (data) setDbTeachers(data);
    };
    fetchTeachersByRoom();
  }, [formData.room]);

  // สร้าง ID 10 หลักอัตโนมัติ
  useEffect(() => {
    setId10(`${formData.year}${formData.center}${formData.room}${formData.gender}${formData.sequence}`);
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.room === "00") return alert("❌ กรุณาเลือกห้องเรียน");
    if (!formData.teacherName) return alert("❌ กรุณาเลือกครูประจำชั้น");

    setIsSubmitting(true);
    const cleanPhone = formData.phone_number.trim().replace(/-/g, "");

    try {
      // 1. บันทึกข้อมูลนักเรียน (พร้อมดึงเบอร์โทรครูจาก State)
      const { data: newStudent, error: studentError } = await supabase
        .from("students")
        .insert([{
          student_id_10: id10,
          first_name: formData.firstName,
          last_name: formData.lastName,
          nickname: formData.nickname,
          center_id: formData.center,
          room_number: formData.room,
          gender_code: formData.gender,
          teacher_name: formData.teacherName,
          teacher_phone: selectedTeacherData?.phone_number || "", // ✅ บันทึกเบอร์ครูที่เลือกไว้
          allergies: formData.allergies,
          phone_number: cleanPhone
        }])
        .select().single();

      if (studentError) throw studentError;

      // 2. บันทึกโปรไฟล์สำหรับ Login
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
          center_id: formData.center,
          is_first_login: true
        }]);

      if (profileError) throw profileError;

      alert(`💖 ลงทะเบียน "น้อง${formData.nickname}" เรียบร้อยแล้วค่ะ!`);
      
      // Reset Form และรันลำดับถัดไป
      setFormData({ 
        ...formData, 
        firstName: "", 
        lastName: "", 
        nickname: "", 
        phone_number: "", 
        sequence: String(Number(formData.sequence) + 1).padStart(2, "0") 
      });
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5F7] p-4 md:p-10 flex justify-center items-center font-sans text-slate-800">
      <div className="max-w-xl w-full bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(255,182,193,0.4)] border border-pink-50 overflow-hidden">
        
        {/* Header Pink Modern Style */}
        <div className="bg-gradient-to-br from-[#FF6B95] via-[#FF85A1] to-[#A855F7] p-8 text-white text-center relative">
          <div className="absolute top-4 right-6 text-white/20 text-4xl font-black italic">THABO</div>
          <h2 className="text-3xl font-black tracking-tight">ลงทะเบียนลูกน้อย</h2>
          <p className="text-pink-100 text-sm mt-1 font-medium opacity-90 italic">
            {getCenterFullName(formData.center)} • {getRoomFullName(formData.room)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {/* Student ID Badge */}
          <div className="flex justify-center -mt-14">
            <div className="bg-white px-7 py-3 rounded-2xl shadow-xl border border-pink-100 text-center">
              <span className="block text-[10px] font-bold text-pink-400 uppercase tracking-[0.2em]">Student Identity</span>
              <span className="text-2xl font-mono font-bold text-slate-800 tracking-widest">{id10}</span>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="ชื่อจริง" className="bg-pink-50/40 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-300 transition-all font-medium" required 
                value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              <input placeholder="นามสกุล" className="bg-pink-50/40 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-300 transition-all font-medium" required 
                value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input placeholder="ชื่อเล่น" className="bg-pink-50/40 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-300 font-medium" required
                value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} />
              <input type="tel" placeholder="เบอร์โทรผู้ปกครอง" className="bg-pink-50/40 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-300 font-medium" required
                value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <select className="bg-pink-50/40 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-300 font-medium text-slate-600 appearance-none" 
                value={formData.center} onChange={e => setFormData({...formData, center: e.target.value})}>
                <option value="01">ศูนย์ 1 ท่าเสด็จ</option>
                <option value="11">ศูนย์ 1 (เพิ่มเติม)</option>
                <option value="02">ศูนย์ 2 บ้านน้ำโมง</option>
              </select>
              <select className="bg-pink-50/40 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-300 font-medium text-slate-600 appearance-none" 
                value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})}>
                {roomOptions.map((room) => <option key={room.value} value={room.value}>{room.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <select className="bg-pink-50/40 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-300 font-medium text-slate-600 appearance-none"
                value={formData.teacherName} 
                onChange={e => {
                  const teacher = dbTeachers.find(t => `${t.first_name} ${t.last_name}` === e.target.value);
                  setSelectedTeacherData(teacher); // เก็บข้อมูลครูเพื่อเอาเบอร์โทร
                  setFormData({...formData, teacherName: e.target.value});
                }} required>
                <option value="">เลือกครูประจำชั้น</option>
                {dbTeachers.map((t, i) => (
                  <option key={i} value={`${t.first_name} ${t.last_name}`}>ครู{t.nickname} ({t.first_name})</option>
                ))}
              </select>
              <input placeholder="ลำดับ" className="bg-pink-50/40 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-300 font-medium text-center" 
                value={formData.sequence} onChange={e => setFormData({...formData, sequence: e.target.value})} />
            </div>

            <textarea placeholder="ข้อมูลการแพ้อาหาร..." className="w-full bg-pink-50/40 p-4 rounded-2xl h-20 outline-none focus:ring-2 focus:ring-pink-300 font-medium resize-none" 
              value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})} />
          </div>

          <button type="submit" disabled={isSubmitting}
            className={`w-full py-5 rounded-[2rem] font-black text-xl text-white shadow-xl transition-all active:scale-95 ${
              isSubmitting ? 'bg-slate-300' : 'bg-gradient-to-r from-[#FF6B95] to-[#FDABDD] hover:shadow-pink-200'
            }`}>
            {isSubmitting ? "กำลังบันทึก..." : "ยืนยันการลงทะเบียน"}
          </button>
          
          <div className="text-center pt-1">
            <Link href="/" className="text-pink-300 hover:text-pink-500 text-sm font-bold transition-colors">กลับหน้าหลัก</Link>
          </div>
        </form>
      </div>
    </div>
  );
}