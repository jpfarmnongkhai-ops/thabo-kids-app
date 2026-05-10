"use client";
import { useState, useRef } from "react";
import { supabase } from "../../lib/supabase"; // ดึงตัวแปรเดิมที่ JP เซตไว้ใน lib/supabase.ts

interface StudentProps {
  student: {
    student_id_10: string;   
    first_name: string;      
    last_name: string;       
    nickname: string;        
    gender_code: string;     // 01=ชาย, 02=หญิง
    room_number: string;     
    center_id: string;       
    teacher_name: string;    
    allergies: string;       
    medical_note?: string;   
    parent_phone?: string;   
  };
}

export default function StudentCard({ student }: StudentProps) {
  const [imageError, setImageError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // สร้าง URL รูปภาพพร้อม Timestamp ป้องกัน Browser จำ Cache รูปเก่า
  const [imageUrl, setImageUrl] = useState(
    `https://qcjlohkkcqooenptakdc.supabase.co/storage/v1/object/public/student-profiles/${student.student_id_10}.jpg?t=${Date.now()}`
  );

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // อัปโหลดไฟล์ไปที่ Storage โดยใช้ ID นักเรียนเป็นชื่อไฟล์
      const { error } = await supabase.storage
        .from("student-profiles")
        .upload(`${student.student_id_10}.jpg`, file, {
          upsert: true, // เขียนทับรูปเดิมได้เลย
        });

      if (error) throw error;

      // อัปเดต URL ใหม่ให้แสดงผลทันที
      setImageUrl(`https://qcjlohkkcqooenptakdc.supabase.co/storage/v1/object/public/student-profiles/${student.student_id_10}.jpg?t=${Date.now()}`);
      setImageError(false);
      alert(`อัปเดตรูปของน้อง${student.nickname}เรียบร้อยแล้วครับ!`);

    } catch (error: any) {
      console.error("Upload error:", error.message);
      alert("เกิดข้อผิดพลาดในการอัปโหลด: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const getPrefix = (code: string) => code === "01" ? "เด็กชาย" : "เด็กหญิง";

  const getCenterFullName = (id: string) => {
    const names: any = { "01": "ศูนย์ 1 ท่าเสด็จ", "11": "ศูนย์ 1 ท่าเสด็จ(เพิ่มเติม)", "02": "ศูนย์ 2 บ้านน้ำโมง", "12": "ศูนย์ 2 บ้านน้ำโมง" };
    return names[id] || `ศูนย์รหัส ${id}`;
  };

  const getRoomFullName = (roomId: string) => {
    const rooms: any = { "11": "เด็กเล็ก 1/1", "12": "เด็กเล็ก 1/2", "21": "อนุบาล 1/1", "22": "อนุบาล 1/2" };
    return rooms[roomId] || `ห้อง ${roomId}`;
  };

  return (
    <div className="relative w-full max-w-[320px] bg-white rounded-[3.5rem] p-7 shadow-sm border border-slate-100 flex flex-col items-center gap-4 transition-all hover:shadow-2xl group">
      
      {/* 📸 Profile Section - เพิ่มส่วนการแก้ไขรูป */}
      <div className="relative group/avatar">
        <div className={`w-28 h-28 rounded-full overflow-hidden flex items-center justify-center shadow-xl border-4 ${student.gender_code === "01" ? 'bg-blue-50 border-white' : 'bg-rose-50 border-white'} group-hover:scale-110 transition-all duration-500`}>
          {!imageError ? (
            <img 
              src={imageUrl} 
              alt={student.nickname}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)} 
              loading="lazy"
            />
          ) : (
            <span className="text-6xl">{student.gender_code === "01" ? '👦' : '👧'}</span>
          )}
        </div>

        {/* Overlay สำหรับกดแก้ไขรูป */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300"
        >
          <span className="text-white text-[10px] font-black uppercase">
            {isUploading ? "กำลังอัปโหลด..." : "เปลี่ยนรูป"}
          </span>
        </button>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleUpload}
        />
      </div>

      <div className="bg-slate-100 px-5 py-1.5 rounded-full">
        <p className="text-[11px] font-black text-slate-500 tracking-widest uppercase">ID: {student.student_id_10}</p>
      </div>

      <div className="text-center">
        <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">น้อง{student.nickname}</h3>
        <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-wide">
          {getPrefix(student.gender_code)}{student.first_name} {student.last_name}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 w-full mt-1">
        <div className="bg-slate-50 p-3 rounded-[1.5rem] border border-slate-100 text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">สังกัด</p>
          <p className="text-[11px] font-black text-slate-700 leading-tight">{getCenterFullName(student.center_id)}</p>
        </div>
        <div className="bg-blue-50/50 p-3 rounded-[1.5rem] border border-blue-100 text-center">
          <p className="text-[9px] font-black text-blue-400 uppercase mb-1">ระดับชั้น / ครูประจำชั้น</p>
          <p className="text-[11px] font-black text-blue-700">{getRoomFullName(student.room_number)}</p>
          <p className="text-[10px] font-bold text-blue-400 mt-1 italic">ครู: {student.teacher_name || "ไม่ระบุ"}</p>
        </div>
      </div>

      <div className="w-full space-y-2">
        <div className="bg-amber-50 p-3 rounded-[1.5rem] border border-amber-100 flex items-center gap-3">
          <span className="text-xl">🥣</span>
          <div className="text-left">
            <p className="text-[9px] font-black text-amber-500 uppercase">ประวัติการแพ้</p>
            <p className="text-[11px] font-bold text-amber-700">{student.allergies || "ไม่มี"}</p>
          </div>
        </div>
        <div className="bg-rose-50 p-3 rounded-[1.5rem] border border-rose-100 flex items-center gap-3">
          <span className="text-xl">🏥</span>
          <div className="text-left">
            <p className="text-[9px] font-black text-rose-500 uppercase">โรคประจำตัว</p>
            <p className="text-[11px] font-bold text-rose-700">{student.medical_note || "แข็งแรงดี"}</p>
          </div>
        </div>
      </div>

      {student.parent_phone && (
        <a href={`tel:${student.parent_phone}`} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-[2rem] flex items-center justify-center gap-3 shadow-lg shadow-emerald-200 transition-all active:scale-95">
          <span className="text-lg">📞</span>
          <span className="font-black text-sm uppercase tracking-widest">โทรหาผู้ปกครอง</span>
        </a>
      )}

      <div className="mt-1">
        <p className="text-[8px] font-black text-slate-300 tracking-[0.3em] uppercase">THABO MUNICIPALITY</p>
      </div>
    </div>
  );
}