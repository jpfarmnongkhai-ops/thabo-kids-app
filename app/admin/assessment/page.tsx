"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AssessmentTableExcel from "@/components/AssessmentTableExcel";

export default function AssessmentPage() {
  const [selectedCenter, setSelectedCenter] = useState("01");
  const [selectedRoom, setSelectedRoom] = useState("11");
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]); 
  const [currentSet, setCurrentSet] = useState(0);
  const itemsPerSet = 1; // แสดง 2 กิจกรรมใหญ่ต่อชุด

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: stdData } = await supabase.from("students").select("*")
        .eq("center_id", selectedCenter).eq("room_number", selectedRoom);
      
      const { data: actData } = await supabase.from("assessment_templates").select("*")
        .eq("week_number", selectedWeek);

      // จัดกลุ่มกิจกรรมตาม activity_name
      const grouped = actData?.reduce((acc: any[], curr: any) => {
  let group = acc.find(a => a.name === curr.activity_type); // จัดกลุ่มตาม activity_type
  if (!group) {
    group = { 
      name: curr.activity_type, 
      unit_name: curr.unit_name, 
      subItems: [] 
    };
    acc.push(group);
  }
  if (group.subItems.length < 3)
       group.subItems.push({ id: curr.id, label: curr.activity_name }); 
  return acc;
}, []);
      setStudents(stdData || []);
      setActivities(grouped || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };
useEffect(() => { setCurrentSet(0); fetchData(); }, [selectedCenter, selectedRoom, selectedWeek]);

  const slicedActivities = activities.slice(currentSet * itemsPerSet, (currentSet + 1) * itemsPerSet);

  return (
    
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-3">
        
        {/* 🌸 ส่วนหัวระบบ */}
        
        <div className="bg-gradient-to-r from-pink-500 to-rose-400 p-8 rounded-xl text-white shadow-lg mb-2">
          <h1 className="text-3xl font-black">📊 ระบบประเมินพัฒนาการ (Dashboard)</h1>
          <div className="flex gap-1">
  
</div>
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold ">
            ศูนย์พัฒนาเด็กเล็กเทศบาลเมืองท่าบ่อ
            
          </span>
          {/* วางไว้เหนือตารางหรือในตำแหน่งที่เพื่อนต้องการ */}
<div className="flex justify-end my-4">
  <button 
    onClick={() => window.location.href = `/admin/assessment-report?center=${selectedCenter}&room=${selectedRoom}&week=${selectedWeek}`}
    className="px-4 py-1.5 text-sm bg-emerald-600 text-white rounded-md font-semibold hover:bg-emerald-700 transition shadow-sm flex items-center gap-2"
  >
    📊 ดูรายงานสรุปผล
  </button>
</div>
        </div>

        {/* 🛠️ แผงควบคุม */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Select inputs เหมือนเดิมครับ */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">เลือกศูนย์ฯ</label>
            <select value={selectedCenter} onChange={(e) => setSelectedCenter(e.target.value)} className="w-full p-3 bg-slate-50 border-2 rounded-xl font-bold">
              <option value="01">ศูนย์ 1 ท่าเสด็จ</option>
              <option value="11">ศูนย์ 1 ท่าเสด็จ(เพิ่มเติม)</option>
              <option value="02">ศูนย์ 2 บ้านน้ำโมง</option>
            </select>
          </div>
          <div>
            
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">เลือกห้องเรียน</label>
            <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} className="w-full p-3 bg-slate-50 border-2 rounded-xl font-bold">
              <option value="11">เด็กเล็ก 1/1</option>
              <option value="12">เด็กเล็ก 1/2</option>
              <option value="21">อนุบาล 1/1</option>
              <option value="22">อนุบาล 1/2</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">สัปดาห์ที่</label>
            <select value={selectedWeek} onChange={(e) => setSelectedWeek(Number(e.target.value))} className="w-full p-3 bg-slate-50 border-2 rounded-xl font-bold">
              {[...Array(40)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
            </select>
          </div>
        </div>

        {/* ⬅️ ปุ่มเลื่อนชุดที่แก้ไขแล้ว */}
<div className="flex justify-between items-center my-4">
  <button 
    disabled={currentSet === 0} 
    onClick={() => setCurrentSet(prev => prev - 1)} 
    className="px-4 py-2 bg-slate-200 rounded-lg font-bold disabled:opacity-50"
  >
    ⬅️ ก่อนหน้า
  </button>

  <span className="font-bold text-slate-600">
    {/* คำนวณหน้าโดยจำกัดสูงสุดไว้ที่ 6 ตามที่เพื่อนต้องการ */}
    ชุดที่ {currentSet + 1} / {Math.min(6, Math.ceil(activities.length / itemsPerSet))}
  </span>

  <button 
    // แก้ไขเงื่อนไข disabled ให้หยุดที่หน้า 6
    disabled={(currentSet + 1) >= Math.min(6, Math.ceil(activities.length / itemsPerSet))} 
    onClick={() => setCurrentSet(prev => prev + 1)} // แก้จาก +2 เป็น +1
    className="px-4 py-2 bg-slate-200 rounded-lg font-bold disabled:opacity-50"
  >
    ถัดไป ➡️
  </button>

</div>

        {/* 📋 ตารางประเมิน */}
        {loading ? (
          <div className="text-center py-20 font-bold text-pink-500 animate-pulse">กำลังโหลดข้อมูล...</div>
        ) : (
          <AssessmentTableExcel 
            students={students}
            activities={slicedActivities} 
            scores={{}} 
            onSaveScore={(s:any, i:any, v:any) => console.log(s, i, v)}
          />
        )}
      </div>
    </div>
  );
}