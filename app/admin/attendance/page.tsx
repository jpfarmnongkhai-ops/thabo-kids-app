"use client";
import { useState, useEffect, Suspense } from "react"; // เพิ่ม Suspense เข้ามา
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

// --- ส่วนเนื้อหาหลัก (คงเดิม 100%) ---
function AttendanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [centerId, setCenterId] = useState(searchParams.get("centerId") || "01");
  const [room, setRoom] = useState("11");
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const centers = [
    { id: "01", name: "ศูนย์ 1 ท่าเสด็จ", color: "bg-[#B2D7F5]" },
    { id: "11", name: "ศูนย์ 1 ท่าเสด็จ (เพิ่มเติม)", color: "bg-[#F5B7D9]" },
    { id: "02", name: "ศูนย์ 2 น้ำโมง", color: "bg-[#B7E5B4]" }
  ];

  const roomOptions = [
    { label: "เด็กเล็ก 1/1", value: "11", bg: "bg-[#B2D7F5]", text: "text-blue-600" },
    { label: "เด็กเล็ก 1/2", value: "12", bg: "bg-[#B7E5B4]", text: "text-green-600" },
    { label: "อนุบาล 1/1", value: "21", bg: "bg-[#FFF4B5]", text: "text-yellow-700" },
    { label: "อนุบาล 1/2", value: "22", bg: "bg-[#FBC4AB]", text: "text-orange-600" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const { data: studentData } = await supabase
        .from("students")
        .select("student_id_10, first_name, last_name, nickname, gender_code")
        .eq("center_id", centerId)
        .eq("room_number", room)
        .order("first_name");
      
      if (studentData) setStudents(studentData);

      const { data: attData } = await supabase
        .from("attendance")
        .select("student_id_10, status")
        .eq("check_date", today);

      if (attData) {
        const attMap: { [key: string]: string } = {};
        attData.forEach(item => attMap[item.student_id_10] = item.status);
        setAttendance(attMap);
      }
      setLoading(false);
    };
    fetchData();
  }, [centerId, room]);

  const handleCheck = async (studentId: string, status: string) => {
    const today = new Date().toISOString().split('T')[0];
    setAttendance(prev => ({ ...prev, [studentId]: status }));

    await supabase.from("attendance").upsert({ 
      student_id_10: studentId, 
      status: status,
      check_date: today
    }, { onConflict: 'student_id_10,check_date' });
  };

  return (
    <div className="min-h-screen bg-[#FDFCF0] p-6 pb-40 flex flex-col items-center font-sans">
      <div className="w-full max-w-md">
        <header className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => router.push('/')} 
              className="w-12 h-12 bg-white rounded-2xl text-[#B19CD9] shadow-sm flex items-center justify-center border-2 border-[#B19CD9]/20 hover:scale-105 active:scale-95 transition-all"
            >
              <span className="text-xl">←</span>
            </button>
            <h1 className="text-2xl font-black text-[#A084D6] tracking-tight">เช็คชื่อน้องๆ 📋</h1>
            <div className="w-12 h-12 bg-[#D9F3FF] rounded-2xl flex items-center justify-center text-xl shadow-inner">✨</div>
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

        <div className="grid grid-cols-2 gap-3 mb-8">
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

        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
              <div className="w-12 h-12 bg-[#E6E6FA] rounded-full mb-4"></div>
              <p className="text-[#B19CD9] font-black text-sm italic">กำลังเรียกน้องๆ เข้าแถว...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-20 bg-white/60 rounded-[3rem] border-4 border-dashed border-white text-slate-400 font-bold px-10">
              <div className="text-4xl mb-4">🏠</div>
              <p>ไม่พบรายชื่อในห้องนี้นะครับ</p>
            </div>
          ) : (
            students.map((std) => (
              <div key={std.student_id_10} className="bg-white p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border-4 border-white transition-all">
                <div className="flex justify-between items-center mb-5 px-2">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${std.gender_code === '01' ? 'bg-[#D9F3FF]' : 'bg-[#FFE4F2]'}`}>
                      {std.gender_code === '01' ? '👦' : '👧'}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800 text-lg leading-tight">น้อง{std.nickname || std.first_name}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{std.first_name} {std.last_name}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'present', label: 'มา', active: 'bg-[#B7E5B4] text-green-800' },
                    { key: 'late', label: 'สาย', active: 'bg-[#FFF4B5] text-yellow-800' },
                    { key: 'leave', label: 'ลา', active: 'bg-[#B2D7F5] text-blue-800' },
                    { key: 'absent', label: 'ขาด', active: 'bg-[#F5B7D9] text-pink-800' },
                  ].map((s) => (
                    <button
                      key={s.key}
                      onClick={() => handleCheck(std.student_id_10, s.key)}
                      className={`py-4 rounded-2xl text-[13px] font-black transition-all active:scale-90 border-2 ${
                        attendance[std.student_id_10] === s.key 
                        ? `${s.active} border-white shadow-md` 
                        : "bg-slate-50 border-transparent text-slate-400"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="fixed bottom-8 left-6 right-6 flex justify-center">
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

// --- ส่วนแสดงผลหลักที่แก้ปัญหาเรื่อง Build ---
export default function AttendancePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">กำลังโหลด...</div>}>
      <AttendanceContent />
    </Suspense>
  );
}