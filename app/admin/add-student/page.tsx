"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
export default function AddStudentPage() {
  const [dbTeachers, setDbTeachers] = useState<any[]>([]);

  const roomOptions = [
    { label: "เลือกห้องเรียน", value: "00" },
    { label: "เด็กเล็ก 1/1", value: "11" },
    { label: "เด็กเล็ก 1/2", value: "12" },
    { label: "อนุบาล 1/1", value: "21" },
    { label: "อนุบาล 1/2", value: "22" },
  ];

  const [formData, setFormData] = useState({
    year: "69",
    center: "01", // รหัสตั้งต้น
    room: "11",
    gender: "01",
    sequence: "01",
    firstName: "",
    lastName: "",
    nickname: "",
    teacherName: "",
    allergies: "ไม่มี",
    parentPhone: "",
  });

  const [id10, setId10] = useState("");

  // --- 🚀 ดึงข้อมูลครูจาก Supabase ---
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

  // --- 🛠️ Logic การสร้างรหัส 10 หลัก (งานละเอียด) ---
  useEffect(() => {
    // กรณีเป็นศูนย์เพิ่มเติม (11) เราจะใช้รหัส "01" ในส่วนของ ID10 แต่ Dashboard จะรู้ว่าเป็น (เพิ่มเติม) จากค่า center_id
    // หรือคุณพ่อจะใช้ "11" ตรงๆ ในรหัส 10 หลักเลยก็ได้ครับ (ในที่นี้อิงตาม formData.center)
    setId10(`${formData.year}${formData.center}${formData.room}${formData.gender}${formData.sequence}`);
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.room === "00") return alert("กรุณาเลือกห้องเรียน");
    if (!formData.teacherName) return alert("กรุณาเลือกครูประจำชั้น");

    // เตรียมค่า center_id สำหรับบันทึก (แปลง 11 เป็น 01_extra เพื่อให้ Dashboard อ่านง่าย)
    const finalCenterId = formData.center === "11" ? "01_extra" : formData.center;

    const { error } = await supabase.from("students").insert([{
      student_id_10: id10,
      first_name: formData.firstName,
      last_name: formData.lastName,
      nickname: formData.nickname,
      center_id: finalCenterId, // บันทึกเป็น 01, 02 หรือ 01_extra
      room_number: formData.room,
      gender_code: formData.gender,
      teacher_name: formData.teacherName,
      allergies: formData.allergies,
      parent_phone: formData.parentPhone,
    }]);

    if (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } else {
      alert("✅ บันทึกข้อมูลเรียบร้อยแล้ว!\nรหัสประจำตัว: " + id10);
      setFormData({ 
        ...formData, 
        firstName: "", 
        lastName: "", 
        nickname: "", 
        parentPhone: "",
        sequence: String(Number(formData.sequence) + 1).padStart(2, "0") 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF69B4]/5 via-[#BA55D3]/5 to-[#DDA0DD]/5 p-6 flex justify-center items-center font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-[2.5rem] shadow-2xl border-2 border-white">
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black bg-gradient-to-r from-[#FF69B4] to-[#BA55D3] bg-clip-text text-transparent">
            ลงทะเบียนนักเรียนใหม่
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-bold tracking-widest uppercase">Thabo CMS Entry Form</p>
        </div>
        
        {/* รหัส 10 หลักโชว์สวยๆ */}
        <div className="bg-slate-50 rounded-2xl py-5 text-center mb-6 border border-slate-100 shadow-inner">
          <p className="text-sm font-black text-slate-500 uppercase tracking-wide mb-1">รหัสประจำตัวนักเรียน</p>
          <p className="font-mono text-2xl font-medium text-slate-600 tracking-widest">{id10}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
             <input placeholder="ชื่อจริง" className="border-2 border-slate-50 bg-slate-50 p-3 rounded-xl w-full outline-none focus:border-[#BA55D3] focus:bg-white transition-all text-sm font-medium" required 
               value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
             <input placeholder="นามสกุล" className="border-2 border-slate-50 bg-slate-50 p-3 rounded-xl w-full outline-none focus:border-[#BA55D3] focus:bg-white transition-all text-sm font-medium" required 
               value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="ชื่อเล่น" className="border-2 border-slate-50 bg-slate-50 p-3 rounded-xl w-full outline-none focus:border-[#BA55D3] focus:bg-white transition-all text-sm font-medium" required
              value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} />
            <input type="text" placeholder="เบอร์โทรผู้ปกครอง" className="border-2 border-slate-50 bg-slate-50 p-3 rounded-xl w-full outline-none focus:border-[#FF69B4] focus:bg-white transition-all text-sm font-medium" required
              value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select className="w-full border-2 border-slate-50 bg-slate-50 p-3 rounded-xl outline-none focus:border-[#BA55D3] text-sm font-medium text-slate-500 cursor-pointer" 
              value={formData.center} onChange={e => setFormData({...formData, center: e.target.value})}>
              <option value="01">ศูนย์ 1 ท่าเสด็จ</option>
              <option value="11">ศูนย์ 1 (เพิ่มเติม)</option> {/* ปรับชื่อตามที่คุณพ่อต้องการ */}
              <option value="02">ศูนย์ 2 บ้านน้ำโมง</option>
            </select>
            
            <select className="w-full border-2 border-slate-50 bg-slate-50 p-3 rounded-xl outline-none focus:border-[#BA55D3] text-sm font-medium text-slate-500 cursor-pointer" 
              value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})}>
              {roomOptions.map((room) => (
                <option key={room.value} value={room.value}>{room.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select className="w-full border-2 border-slate-50 bg-slate-50 p-3 rounded-xl outline-none focus:border-[#BA55D3] text-sm font-medium text-slate-500 cursor-pointer" 
              value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
              <option value="01">เด็กชาย</option>
              <option value="02">เด็กหญิง</option>
            </select>
            
            <select 
              className="w-full border-2 border-slate-50 bg-slate-50 p-3 rounded-xl outline-none focus:border-[#DDA0DD] focus:bg-white transition-all text-sm font-medium text-slate-500 cursor-pointer"
              value={formData.teacherName}
              onChange={e => setFormData({...formData, teacherName: e.target.value})}
              required
            >
              <option value="">เลือกครูประจำชั้น</option>
              {dbTeachers.map((teacher, index) => (
                <option key={index} value={`${teacher.first_name} ${teacher.last_name}`}>
                  ครู{teacher.nickname || teacher.first_name} ({teacher.first_name})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1">
            <input placeholder="ลำดับที่ (เช่น 01, 02)" className="border-2 border-slate-50 bg-slate-50 p-3 rounded-xl w-full text-center outline-none focus:border-[#BA55D3] focus:bg-white transition-all text-sm font-medium text-slate-700" 
              value={formData.sequence} onChange={e => setFormData({...formData, sequence: e.target.value})} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-[#BA55D3] ml-2 uppercase tracking-tighter">แพ้อาหาร/โรคประจำตัว</label>
            <textarea 
              placeholder="ระบุข้อมูล (ถ้าไม่มีให้ใส่ว่า - )" 
              className="w-full border-2 border-slate-50 bg-slate-50 p-3 rounded-xl h-16 outline-none focus:border-[#DDA0DD] focus:bg-white transition-all text-sm font-medium text-slate-700 shadow-inner" 
              value={formData.allergies} 
              onChange={e => setFormData({...formData, allergies: e.target.value})} 
            />
          </div>

          <button type="submit" className="w-full bg-gradient-to-r from-[#FF69B4] to-[#BA55D3] text-white p-4 rounded-2xl font-black text-lg hover:shadow-lg hover:translate-y-[-2px] transition-all mt-2 shadow-lg shadow-pink-100">
            ลงทะเบียนนักเรียน
          </button>
          
        
          <div className="flex justify-center mt-6">
              <Link href="/" className="p-3 bg-slate-100 rounded-full hover:bg-[#FFDAC1] transition-colors shadow-inner flex items-center justify-center w-12 h-12 text-xl">
                🏠
              </Link>
          </div>
          
        </form>
      </div>
    </div>
  );
}