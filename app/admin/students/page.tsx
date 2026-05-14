"use client";
import LightHomeButton from "@/components/LightHomeButton";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import StudentCard from "@/components/student/StudentCard";
import Link from "next/link";

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ข้อมูลชื่อศูนย์และห้องเรียนตามที่เพื่อน JP กำหนด
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

  // ฟังก์ชันจัดกลุ่มนักเรียน (Group by Center -> Group by Room)
  const groupedStudents = students.reduce((acc: any, student) => {
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
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-800">ระบบดูแล<span className="text-blue-400">นักเรียน</span> 👶</h1>
            <p className="text-slate-400 font-bold mt-1">รายชื่อแยกตามศูนย์และห้องเรียน</p>
          </div>
          <Link 
            href="/admin/add-student" 
            className="px-8 py-4 bg-blue-500 text-white rounded-[2rem] font-black hover:bg-blue-400 transition-all shadow-lg shadow-blue-200"
          >
            + เพิ่มนักเรียนใหม่
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-bounce text-blue-400 font-black">กำลังโหลดข้อมูล...</div>
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