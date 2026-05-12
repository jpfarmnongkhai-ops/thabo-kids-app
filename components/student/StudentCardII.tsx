"use client";
import { useState } from "react";
import { Phone, ShieldAlert, HeartPulse, GraduationCap, MapPin } from "lucide-react";

interface StudentProps {
  student: {
    student_id_10: string;
    first_name: string;
    last_name: string;
    nickname: string;
    gender_code: string;
    room_number: string;
    center_id: string;
    teacher_name: string;
    teacher_phone?: string; // ✅ เพิ่มเบอร์โทรครูใน Interface
    allergies: string;
    medical_note?: string;
  };
}

export default function StudentCardII({ student }: StudentProps) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = `https://qcjlohkkcqooenptakdc.supabase.co/storage/v1/object/public/student-profiles/${student.student_id_10}.jpg`;

  // --- Helper Functions ที่ JP จัดเตรียมไว้ ---
  const getPrefix = (code: string) => code === "01" ? "เด็กชาย" : "เด็กหญิง";

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

  return (
    <div className="w-full max-w-[360px] bg-white rounded-[3.5rem] p-8 shadow-2xl shadow-indigo-100/50 border border-slate-50 flex flex-col items-center gap-6 transition-all hover:translate-y-[-5px]">
      
      {/* 📸 Profile & Badge Section */}
      <div className="relative">
        <div className={`w-32 h-32 rounded-[2.8rem] overflow-hidden flex items-center justify-center shadow-xl border-4 ${student.gender_code === "01" ? 'bg-blue-50 border-white' : 'bg-rose-50 border-white'}`}>
          {!imageError ? (
            <img src={imageUrl} alt={student.nickname} className="w-full h-full object-cover" onError={() => setImageError(true)} />
          ) : (
            <span className="text-7xl">{student.gender_code === "01" ? '👦' : '👧'}</span>
          )}
        </div>
        <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg border-2 border-white uppercase tracking-wider">
          {getRoomFullName(student.room_number)}
        </div>
      </div>

      {/* Name & Center Info */}
      <div className="text-center space-y-1">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">น้อง{student.nickname}</h2>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">
          {getPrefix(student.gender_code)}{student.first_name} {student.last_name}
        </p>
        <div className="flex items-center justify-center gap-1.5 text-indigo-500 pt-2">
          <MapPin size={14} fill="currentColor" className="opacity-20" />
          <span className="text-[10px] font-black uppercase tracking-widest">{getCenterFullName(student.center_id)}</span>
        </div>
      </div>

      {/* Health Info Grid */}
      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="bg-orange-50/60 p-4 rounded-[2.2rem] border border-orange-100 flex flex-col items-center">
          <ShieldAlert className="text-orange-500 mb-1" size={22} />
          <p className="text-[9px] font-black text-orange-400 uppercase mb-1">การแพ้</p>
          <p className="text-[12px] font-black text-orange-700">{student.allergies || "ไม่มี"}</p>
        </div>
        <div className="bg-blue-50/60 p-4 rounded-[2.2rem] border border-blue-100 flex flex-col items-center">
          <HeartPulse className="text-blue-500 mb-1" size={22} />
          <p className="text-[9px] font-black text-blue-400 uppercase mb-1">สุขภาพ</p>
          <p className="text-[12px] font-black text-blue-700">{student.medical_note || "ปกติ"}</p>
        </div>
      </div>

      {/* 📞 Teacher Section - ปรับปรุงใหม่ให้ชัดเจน */}
      <div className="w-full bg-slate-50/80 rounded-[2.8rem] p-6 border border-slate-100 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
            <GraduationCap size={24} />
          </div>
          <div className="text-left">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ครูประจำชั้น</p>
            <p className="text-[15px] font-black text-slate-800 leading-tight">{student.teacher_name || "กำลังระบุชื่อครู"}</p>
          </div>
        </div>

        {/* ปุ่มโทร - จะโชว์เบอร์ครูแบบเนียนๆ */}
      
<a 
  href={student.teacher_phone ? `tel:${student.teacher_phone}` : "#"}
  className={`group w-full py-4 rounded-[1.8rem] flex flex-col items-center justify-center transition-all active:scale-95 shadow-xl ${
    student.teacher_phone 
    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100' 
    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
  }`}
>
  <div className="flex items-center gap-2">
    <Phone size={16} fill="currentColor" />
    <span className="font-black text-[11px] uppercase tracking-[0.2em]">
      {student.teacher_phone ? "โทรปรึกษาคุณครู" : "ยังไม่ได้ลงทะเบียนเบอร์"}
    </span>
  </div>
  {student.teacher_phone && (
    <span className="text-[10px] font-bold opacity-70 mt-0.5 tracking-widest">
      {student.teacher_phone}
    </span>
  )}
</a>
      </div>

      <p className="text-[8px] font-black text-slate-300 tracking-[0.5em] uppercase">Thabo Municipality</p>
    </div>
  );
}