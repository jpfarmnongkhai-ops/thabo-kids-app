"use client";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import AttendanceTable from "@/components/AttendanceTable";
import AttendancePrintReport from "@/components/AttendancePrintReport";

function AttendanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [centerId, setCenterId] = useState(searchParams.get("centerId") || "01");
  const [room, setRoom] = useState("11");
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  
  // 📅 1. เพิ่ม State เก็บวันที่ที่เลือก (Default เป็นวันที่ปัจจุบัน เพื่อเปิดมาเจอวันนี้เลย)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [thaiDateString, setThaiDateString] = useState("");
  const [dbTeachers, setDbTeachers] = useState<any[]>([]);

  // 🗓️ คำนวณ วันที่ไทยแบบ Dynamic ตาม "selectedDate" ที่ผู้ใช้เลือกเปลี่ยนไปเปลี่ยนมา
  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const dateObj = new Date(selectedDate);
    const dateFormatted = dateObj.toLocaleDateString('th-TH', options);
    setThaiDateString(dateFormatted);
  }, [selectedDate]); // ทำงานใหม่ทุกครั้งที่สลับวันที่!

  const centers = [
    { id: "01", name: "ศูนย์ 1 ท่าเสด็จ" },
    { id: "11", name: "ศูนย์ 1 ท่าเสด็จ (เพิ่มเติม)" },
    { id: "02", name: "ศูนย์ 2 บ้านน้ำโมง" }
  ];

  const roomOptions = [
    { label: "เด็กเล็ก 1/1", value: "11", bg: "bg-[#B2D7F5]" },
    { label: "เด็กเล็ก 1/2", value: "12", bg: "bg-[#B7E5B4]" },
    { label: "อนุบาล 1/1", value: "21", bg: "bg-[#FFF4B5]" },
    { label: "อนุบาล 1/2", value: "22", bg: "bg-[#FBC4AB]" },
  ];

  const currentCenter = centers.find(c => c.id === centerId)?.name || "";
  const currentRoom = roomOptions.find(r => r.value === room)?.label || "";
  
  const currentTeacherName = dbTeachers.length > 0 
    ? dbTeachers.map(t => `คุณครู${t.first_name} ${t.last_name} (ครู${t.nickname})`).join(" / ")
    : "คุณครูประจำชั้น";

  // ดึงข้อมูลครูประจำชั้น
  useEffect(() => {
    const fetchTeachersByFilter = async () => {
      const { data } = await supabase
        .from("teachers")
        .select("*")
        .eq("center_id", centerId) 
        .eq("room_number", room);
      if (data) setDbTeachers(data);
    };
    fetchTeachersByFilter();
  }, [centerId, room]);

  // 📋 ดึงข้อมูลนักเรียนและประวัติเช็คชื่อ "ตามวันที่เลือก (selectedDate)"
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // ดึงรายชื่อเด็กในห้องเรียน
      const { data: studentData } = await supabase
        .from("students")
        .select("student_id_10, first_name, last_name, nickname, gender_code")
        .eq("center_id", centerId)
        .eq("room_number", room)
        .order("student_id_10", { ascending: true });
      if (studentData) setStudents(studentData);

      // 🎯 เปลี่ยนจากดึง "today" มาเป็นดึงตาม "selectedDate" ที่ครูสลับเลือก
      const { data: attData } = await supabase
        .from("attendance")
        .select("student_id_10, status")
        .eq("check_date", selectedDate);

      const attMap: { [key: string]: string } = {};
      if (attData) {
        attData.forEach(item => attMap[item.student_id_10] = item.status);
      }
      setAttendance(attMap); // หน้าจอจะอัปเดตประวัติเช็คชื่อของวันนั้นทันที!
      setLoading(false);
    };
    fetchData();
  }, [centerId, room, selectedDate]); // เติม selectedDate ที่นี่เพื่อให้ยิง Query ใหม่เมื่อเปลี่ยนวัน

  // บันทึกเช็คชื่อลงฐานข้อมูลตามวันที่เลือก
  const handleCheck = async (studentId: string, status: string) => {
    let thaiStatus = status;
    if (status === "present") thaiStatus = "มา";
    if (status === "absent") thaiStatus = "ขาด";
    if (status === "late") thaiStatus = "สาย";
    if (status === "leave") thaiStatus = "ลา";

    setAttendance(prev => ({ ...prev, [studentId]: thaiStatus }));

    // บันทึกลง Supabase โดยอ้างอิงตามวันที่เลือก (กดแก้ย้อนหลังได้ด้วย!)
    await supabase.from("attendance").upsert({ 
      student_id_10: studentId, 
      status: thaiStatus,
      check_date: selectedDate
    }, { onConflict: 'student_id_10,check_date' });
  };

  // 🖨️ แสดงแผ่นรายงานเดี่ยวสั่งพิมพ์เมื่ออยู่ในโหมด Preview
  if (isPreview) {
    return (
      <div className="min-h-screen bg-[#FDFCF0] p-6 print:p-0">
        {/* กล่องปุ่มกดนี้จะถูกซ่อนอัตโนมัติเมื่อพิมพ์จริงเพราะมีคลาส no-print */}
        <div className="max-w-3xl mx-auto mb-4 no-print flex justify-between items-center">
          <button
            onClick={() => setIsPreview(false)}
            className="px-5 py-2.5 bg-slate-800 text-white font-bold rounded-2xl shadow-sm hover:bg-slate-700 transition-all text-sm"
          >
            ← กลับไปหน้าเช็คชื่อ
          </button>
        </div>

        {/* เรียก Component รายงาน */}
        <AttendancePrintReport 
          centerName={currentCenter}
          roomLabel={currentRoom}
          teacherName={currentTeacherName}
          students={students}
          attendance={attendance}
          thaiDate={thaiDateString}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF0] p-6 pb-40 flex flex-col items-center font-sans">
      <div className="w-full max-w-3xl">
        <header className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={() => router.push('/')} 
              className="w-12 h-12 bg-white rounded-2xl text-[#B19CD9] shadow-sm flex items-center justify-center border-2 border-[#B19CD9]/20 hover:scale-105 active:scale-95 transition-all"
            >
              <span className="text-xl">←</span>
            </button>
            <h1 className="text-2xl font-black text-[#A084D6] tracking-tight">ระบบเช็คชื่อน้อง ๆ 📋</h1>
            
            <button
              onClick={() => setIsPreview(true)}
              className="px-4 h-12 bg-[#A084D6] text-white rounded-2xl font-black text-xs shadow-sm flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all border-2 border-white"
            >
              <span>🖨️ พิมพ์รายงาน</span>
            </button>
          </div>

          {/* 📅 2. กล่องเลือกวันที่แบบน่ารัก ๆ สลับวันดูข้อมูลย้อนหลังได้อิสระ */}
          <div className="bg-white p-4 rounded-[2rem] shadow-sm border-2 border-white flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <div className="text-center sm:text-left">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">กำลังแสดงข้อมูลของวันที่</span>
              <p className="text-xs font-bold text-[#A084D6]">{thaiDateString}</p>
            </div>
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 rounded-xl bg-slate-50 border-2 border-[#B19CD9]/20 font-bold text-slate-600 outline-none focus:border-[#A084D6] cursor-pointer text-sm"
            />
          </div>
          
          <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border-2 border-white">
            <label className="text-[10px] font-black text-slate-400 ml-4 mb-2 block uppercase tracking-widest">เลือกศูนย์พัฒนาเด็กเล็ก</label>
            <select 
              value={centerId}
              onChange={(e) => setCenterId(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-50 border-none text-slate-700 font-bold outline-none focus:ring-4 focus:ring-[#B19CD9]/10 transition-all cursor-pointer"
            >
              {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </header>

        {/* แถบเลือกห้องเรียน */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {roomOptions.map((r) => (
            <button
              key={r.value}
              onClick={() => setRoom(r.value)}
              className={`py-4 rounded-[1.8rem] font-black text-xs transition-all border-4 shadow-sm active:scale-95 ${
                room === r.value 
                ? `${r.bg} border-white ring-4 ring-[#B19CD9]/10 text-slate-700` 
                : "bg-white border-transparent text-slate-400"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="text-center mb-6">
          <p className="text-xs font-bold text-slate-400">
            👩‍🏫 ครูประจำชั้นห้องนี้: <span className="text-[#A084D6] font-black">{currentTeacherName}</span>
          </p>
        </div>

        {/* ตารางเช็คชื่อน้องๆ */}
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse bg-white rounded-[3rem] p-6 shadow-sm">
              <div className="w-12 h-12 bg-[#E6E6FA] rounded-full mb-4"></div>
              <p className="text-[#B19CD9] font-black text-sm italic">กำลังเรียกน้องๆ เข้าแถวในตาราง...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-20 bg-white/60 rounded-[3rem] border-4 border-dashed border-white text-slate-400 font-bold px-10">
              <div className="text-4xl mb-4">🏠</div>
              <p>ไม่พบรายชื่อในห้องนี้นะครับ</p>
            </div>
          ) : (
            <AttendanceTable 
              students={students} 
              attendance={attendance} 
              onCheck={handleCheck} 
            />
          )}
        </div>

        {/* ปุ่มบันทึกเซฟด้านล่าง */}
        <div className="fixed bottom-8 left-6 right-6 flex justify-center z-50 no-print">
          <button 
            onClick={() => router.push('/admin/dashboard')} 
            className="w-full max-w-sm bg-[#FF85B3] text-white py-5 rounded-[2.5rem] font-black shadow-2xl shadow-pink-200 active:scale-95 transition-all flex items-center justify-center gap-3 border-4 border-white"
          >
            <span>เรียบร้อยแล้วค่ะ</span>
            <span className="bg-white/30 w-7 h-7 rounded-full flex items-center justify-center text-xs">✓</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">กำลังโหลด...</div>}>
      <Suspense fallback={<div className="p-10 text-center font-bold">กำลังโหลด...</div>}>
        <AttendanceContent />
      </Suspense>
    </Suspense>
  );
}