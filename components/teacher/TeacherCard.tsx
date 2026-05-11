"use client";
import { useState, useRef } from "react";
import { supabase } from "../../lib/supabase"; // เรียกใช้ตัวแปร supabase จากไฟล์ที่มีอยู่แล้ว

interface TeacherProps {
  teacher: {
    id: string;
    prefix: string;
    first_name: string;
    last_name: string;
    nickname: string;
    phone_number: string;
    center_id: string;
    room_number: string;
  };
}

export default function TeacherCard({ teacher }: TeacherProps) {
  const [imageError, setImageError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // สร้าง URL สำหรับรูปภาพ โดยใส่ timestamp ป้องกัน Browser จำ Cache รูปเก่า
  const [imageUrl, setImageUrl] = useState(
    `https://qcjlohkkcqooenptakdc.supabase.co/storage/v1/object/public/teacher-profiles/${teacher.id}.jpg?t=${Date.now()}`
  );

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // อัปโหลดไฟล์ไปที่ Storage โดยใช้ ID ครูเป็นชื่อไฟล์ (ทับไฟล์เดิม)
      const { error } = await supabase.storage
        .from("teacher-profiles")
        .upload(`${teacher.id}.jpg`, file, {
          upsert: true, // อนุญาตให้เขียนทับไฟล์เดิม
        });

      if (error) throw error;

      // อัปเดต URL ใหม่เพื่อให้รูปหน้าเว็บเปลี่ยนทันที
      setImageUrl(`https://qcjlohkkcqooenptakdc.supabase.co/storage/v1/object/public/teacher-profiles/${teacher.id}.jpg?t=${Date.now()}`);
      setImageError(false);
      alert("อัปเดตรูปโปรไฟล์สำเร็จแล้วครับเพื่อน!");

    } catch (error: any) {
      console.error("Error uploading:", error.message);
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

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
      
      {/* ส่วนรูปภาพที่เพิ่มปุ่ม Edit */}
      <div className="relative w-28 h-28 group/avatar">
        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center shadow-xl border-4 border-white bg-indigo-50 group-hover:scale-105 transition-all duration-500">
          {!imageError ? (
            <img 
              src={imageUrl} 
              alt={teacher.nickname}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)} 
            />
          ) : (
            <span className="text-6xl">{teacher.prefix === "นาย" ? '👨‍🏫' : '👩‍🏫'}</span>
          )}
        </div>

        {/* ปุ่ม Edit ที่จะปรากฏเมื่อเอาเมาส์มาวางบนรูป */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300"
        >
          <span className="text-white text-sm font-bold">
            {isUploading ? "กำลังอัปโหลด..." : "แก้ไขรูป"}
          </span>
        </button>
        
        {/* Input ไฟล์แบบซ่อนไว้ */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleUpload}
        />
      </div>

      <div className="bg-indigo-600 px-5 py-1 rounded-full">
        <p className="text-[10px] font-black text-white tracking-widest uppercase">ครูประจำชั้น</p>
      </div>

      <div className="text-center">
        <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">ครู{teacher.nickname}</h3>
        <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-wide">{teacher.prefix}{teacher.first_name} {teacher.last_name}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 w-full mt-1">
        <div className="bg-slate-50 p-3 rounded-[1.5rem] border border-slate-100 text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">ประจำศูนย์</p>
          <p className="text-[11px] font-black text-slate-700 leading-tight">{getCenterFullName(teacher.center_id)}</p>
        </div>
        <div className="bg-indigo-50/50 p-3 rounded-[1.5rem] border border-indigo-100 text-center">
          <p className="text-[9px] font-black text-indigo-400 uppercase mb-1">ห้องเรียนที่ดูแล</p>
          <p className="text-sm font-black text-indigo-700">{getRoomFullName(teacher.room_number)}</p>
        </div>
      </div>

      {teacher.phone_number && (
        <a href={`tel:${teacher.phone_number}`} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-4 rounded-[2rem] flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 transition-all active:scale-95 mt-2">
          <span className="text-lg">📞</span>
          <span className="font-black text-sm uppercase tracking-widest">ติดต่อครู{teacher.nickname}</span>
        </a>
      )}
      <div className="mt-1">
        <p className="text-[8px] font-black text-slate-300 tracking-[0.3em] uppercase">THA BO STAFF ONLY</p>
      </div>
    </div>
  );
}