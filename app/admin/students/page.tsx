"use client";
import LightHomeButton from "@/components/LightHomeButton";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import StudentCard from "@/components/student/StudentCard";
import Link from "next/link";

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🎯 State สำหรับระบบค้นหาสุดวิเศษ
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCenter, setSelectedCenter] = useState<string>("all"); // "all", "01", "11", "02"

  // ข้อมูลชื่อศูนย์และห้องเรียนตามที่เพื่อนกำหนด
  const centerNames: any = { 
    "01": "ศูนย์ 1 ท่าเสด็จ", 
    "11": "ศูนย์ 1 ท่าเสด็จ(เพิ่มเติม)", 
    "02": "ศูนย์ 2 บ้านน้ำโมง", 
  };

  const roomNames: any = { 
    "11": "เด็กเล็ก 1/1", 
    "12": "เด็กเล็ก 1/2", 
    "21": "อนุบาล 1/1", 
    "22": "อนุบาล 1/2" 
  };

  useEffect(() => {
    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("room_number", { ascending: true }) // เรียงตามห้อง
        .order("first_name", { ascending: true }); // เรียงตามชื่อ

      if (!error && data) setStudents(data);
      setLoading(false);
    };
    fetchStudents();
  }, []);

  // 🔍 ลอจิกการกรองข้อมูลแบบ Real-time ค้นหาได้รอบทิศทาง
  const filteredStudents = students.filter((student) => {
    // 1. กรองด้วยศูนย์ที่เลือก
    if (selectedCenter !== "all" && student.center_id !== selectedCenter) {
      return false;
    }

    // 2. กรองด้วยคีย์เวิร์ด (ชื่อ, นามสกุล, ชื่อเล่น, ID)
    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return true; // ถ้าไม่ได้พิมพ์อะไร ให้ผ่านหมด

    const fullName = `${student.first_name || ""} ${student.last_name || ""}`.toLowerCase();
    const nickname = (student.nickname || "").toLowerCase();
    const studentId = (student.student_id_10 || "").toLowerCase(); // รองรับการค้นหาด้วย ID

    return (
      fullName.includes(searchLower) || 
      nickname.includes(searchLower) || 
      studentId.includes(searchLower)
    );
  });

  // 📐 จัดกลุ่มนักเรียนที่ผ่านการกรองแล้ว (Group by Center -> Group by Room)
  const groupedStudents = filteredStudents.reduce((acc: any, student) => {
    const center = student.center_id || "Unknown";
    const room = student.room_number || "Unknown";
    
    if (!acc[center]) acc[center] = {};
    if (!acc[center][room]) acc[center][room] = [];
    
    acc[center][room].push(student);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-800">ระบบดูแล<span className="text-blue-400">นักเรียน</span> 👶</h1>
            <p className="text-slate-400 font-bold mt-1">รายชื่อแยกตามศูนย์และห้องเรียน ของศูนย์พัฒนาเด็กเล็กเทศบาลเมืองท่าบ่อ</p>
          </div>
          <Link 
            href="/admin/add-student" 
            className="px-8 py-4 bg-blue-500 text-white rounded-[2rem] font-black hover:bg-blue-400 transition-all shadow-lg shadow-blue-200 active:scale-95"
          >
            + เพิ่มนักเรียนใหม่
          </Link>
        </div>

        {/* 🪄 Magic Search Box Area */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-12 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* ช่องพิมพ์ค้นหา */}
            <div className="flex-1 relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl">🔍</span>
              <input
                type="text"
                placeholder="ค้นหาด้วย ชื่อจริง, นามสกุล, ชื่อเล่น หรือรหัสประจำตัวเด็ก..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-[2rem] font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-300 focus:bg-white transition-all text-sm md:text-base"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-200/60 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              )}
            </div>

            {/* ปุ่ม Quick Filter เลือกศูนย์ */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider mr-2 hidden sm:inline">เลือกศูนย์:</span>
              <button
                onClick={() => setSelectedCenter("all")}
                className={`px-5 py-3.5 rounded-[1.5rem] text-xs font-black transition-all ${
                  selectedCenter === "all"
                    ? "bg-slate-800 text-white shadow-md"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                ทั้งหมด ({students.length})
              </button>
              {Object.keys(centerNames).map((id) => {
                const count = students.filter(s => s.center_id === id).length;
                return (
                  <button
                    key={id}
                    onClick={() => setSelectedCenter(id)}
                    className={`px-5 py-3.5 rounded-[1.5rem] text-xs font-black transition-all ${
                      selectedCenter === id
                        ? "bg-blue-500 text-white shadow-md shadow-blue-100"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {centerNames[id]} ({count})
                  </button>
                );
              })}
            </div>

          </div>

          {/* แถบแสดงสถานะผลการค้นหา */}
          {searchTerm && (
            <div className="text-xs font-bold text-blue-400 pl-2">
              ✨ กำลังแสดงผลการค้นหาสำหรับ "{searchTerm}" เจอทั้งหมด {filteredStudents.length} คน
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-bounce text-blue-400 font-black">กำลังโหลดข้อมูล...</div>
          </div>
        ) : filteredStudents.length === 0 ? (
          /* กรณีค้นหาแล้วไม่เจอเด็กเลย */
          <div className="bg-white rounded-[3rem] p-16 text-center border-2 border-dashed border-slate-200">
            <div className="text-5xl mb-4">🐣</div>
            <h3 className="text-xl font-black text-slate-700">ไม่พบข้อมูลนักเรียนที่ค้นหา</h3>
            <p className="text-slate-400 font-medium mt-1 text-sm">ลองตรวจสอบการสะกดชื่อ ชื่อเล่น หรือสลับฟิลเตอร์ศูนย์ดูอีกครั้งนะเพื่อนรัก</p>
            <button 
              onClick={() => { setSearchTerm(""); setSelectedCenter("all"); }}
              className="mt-6 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
            >
              ล้างการค้นหาทั้งหมด
            </button>
          </div>
        ) : (
          <div className="space-y-16">
            {/* วนลูปตาม "ศูนย์" */}
            {Object.keys(groupedStudents).sort().map((centerId) => (
              <div key={centerId} className="space-y-8">
                <div className="border-b-4 border-blue-100 pb-2">
                  <h2 className="text-3xl font-black text-slate-700 flex items-center gap-3">
                    🏢 {centerNames[centerId] || `ศูนย์รหัส ${centerId}`}
                    <span className="text-sm bg-blue-100 text-blue-500 px-3 py-1 rounded-full">
                      {Object.values(groupedStudents[centerId]).flat().length} คน
                    </span>
                  </h2>
                </div>

                {/* วนลูปตาม "ห้องเรียน" ในศูนย์นั้นๆ */}
                {Object.keys(groupedStudents[centerId]).sort().map((roomId) => (
                  <div key={`${centerId}-${roomId}`} className="pl-4 space-y-4">
                    <h3 className="text-xl font-bold text-blue-400 italic">
                      📍 {roomNames[roomId] || `ห้อง ${roomId}`}
                    </h3>
                    
                    {/* แสดง Grid รายชื่อนักเรียนในห้องนั้น */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                      {groupedStudents[centerId][roomId].map((student: any) => (
                        <div key={student.id} className="bg-white p-2 rounded-[3.5rem] shadow-sm hover:shadow-xl transition-all border border-slate-50"> 
                          <StudentCard student={student} /> 
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      <LightHomeButton />
    </div>
  );
}