"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import AssessmentTableExcelExtra from "@/components/AssessmentTableExcelExtra";
import Link from "next/link";

export default function ComputerAssessmentPage() {
  const assessmentType = "extra";
  const subjectName = "คอมพิวเตอร์ปฐมวัย";
  const activityTypeGroup = `วิชา${subjectName}`;

  // --- 🎛️ Filter คัดกรองข้อมูล ---
  const [selectedCenter, setSelectedCenter] = useState("01"); 
  const [selectedRoom, setSelectedRoom] = useState("12"); 
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1); 

  // --- ✍️ State หัวข้อประเมิน ---
  const [unitName, setUnitName] = useState("");
  const [header1, setHeader1] = useState("ปฏิบัติตามข้อตกลงได้");
  const [header2, setHeader2] = useState("สนทนาโต้ตอบร่วมกับครูและเพื่อนได้");
  const [header3, setHeader3] = useState("ร่วมกิจกรรมต่างๆได้");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]); 
  const [currentSet, setCurrentSet] = useState(0);

  // --- 🔄 ฟังก์ชันดึงข้อมูลพฤติกรรมและคะแนน ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. ดึงรายชื่อเด็กนักเรียน
      const { data: stdData, error: stdErr } = await supabase
        .from("students")
        .select("id, first_name, last_name, gender_code, center_id, room_number")
        .eq("center_id", selectedCenter)
        .eq("room_number", selectedRoom);

      if (stdErr) throw stdErr;

      // 2. ดึงโครงสร้างหัวข้อพฤติกรรม
      const { data: actData, error: actErr } = await supabase
        .from("assessment_templates")
        .select("*")
        .eq("week_number", selectedWeek)
        .eq("day_number", selectedDay)
        .eq("assessment_type", assessmentType)
        .eq("activity_type", activityTypeGroup)
        .order("id", { ascending: true });

      if (actErr) throw actErr;

      let finalTemplates = actData || [];

      let dbUnitName = "";
      let ch1 = "ปฏิบัติตามข้อตกลงได้";
      let ch2 = "สนทนาโต้ตอบร่วมกับครูและเพื่อนได้";
      let ch3 = "ร่วมกิจกรรมต่างๆได้";

      if (finalTemplates && finalTemplates.length >= 3) {
        dbUnitName = finalTemplates[0].unit_name || "";
        ch1 = finalTemplates[0].activity_name || ch1;
        ch2 = finalTemplates[1].activity_name || ch2;
        ch3 = finalTemplates[2].activity_name || ch3;
      }

      setUnitName(dbUnitName);
      setHeader1(ch1);
      setHeader2(ch2);
      setHeader3(ch3);

      // 3. ดึงคะแนนดิบของนักเรียนทุกคน
      const studentIds = stdData?.map(s => s.id) || [];
      let scoreMap: { [key: string]: { [key: string]: number } } = {};
      
      if (studentIds.length > 0) {
        const { data: scoreData, error: scoreErr } = await supabase
          .from("student_scores")
          .select("student_id, template_id, score_value")
          .in("student_id", studentIds)
          .eq("day_number", selectedDay);

        if (!scoreErr && scoreData) {
          scoreData.forEach((row: any) => {
            if (row.student_id && row.template_id) {
              if (!scoreMap[row.student_id]) scoreMap[row.student_id] = {};
              scoreMap[row.student_id][row.template_id] = row.score_value;
            }
          });
        }
      }

      const studentsWithScores = stdData?.map((std: any) => ({
        ...std,
        scores: scoreMap[std.id] || {} 
      })) || [];

      // ✨ [ปรับปรุงการส่งข้อมูลเข้าคอมโพเนนต์ย่อย]: ป้อนข้อมูลเข้าไปแทนที่ "ไม่ได้ระบุ" อัตโนมัติ
      const displayUnit = dbUnitName || "ทั่วไป";
      const formattedActivities = [
        {
          name: activityTypeGroup,
          unit_name: displayUnit,
          sub_activity: displayUnit, 
          subSubstance: displayUnit,
          subItems: [
            { id: finalTemplates[0]?.id || "temp-1", label: ch1 },
            { id: finalTemplates[1]?.id || "temp-2", label: ch2 },
            { id: finalTemplates[2]?.id || "temp-3", label: ch3 }
          ]
        }
      ];

      setStudents(studentsWithScores);
      setActivities(formattedActivities); 
    } catch (err) { 
      console.error("❌ Fetch error:", err); 
    } finally { 
      setLoading(false); 
    }
  }, [selectedCenter, selectedRoom, selectedWeek, selectedDay, activityTypeGroup]);

  useEffect(() => { 
    setCurrentSet(0);
    fetchData(); 
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, [selectedCenter, selectedRoom, selectedWeek, selectedDay, fetchData]);

  // ✨ [ปรับปรุง Real-time Input]: เมื่อคุณครูพิมพ์ในช่อง Input ให้ตารางอัปเดตตามทันทีโดยไม่ต้องกดเซฟก่อน
  useEffect(() => {
    setActivities(prevActivities => {
      if (!prevActivities || prevActivities.length === 0) return prevActivities;
      const displayUnit = unitName || "ทั่วไป";
      return prevActivities.map(act => ({
        ...act,
        unit_name: displayUnit,
        sub_activity: displayUnit,
        subSubstance: displayUnit
      }));
    });
  }, [unitName]);

  // --- 💾 บันทึกโครงสร้างเทมเพลต (Upsert) ---
  const handleSaveTemplate = async () => {
    setIsSavingTemplate(true);
    try {
      const { data: existData } = await supabase
        .from("assessment_templates")
        .select("id")
        .eq("week_number", selectedWeek)
        .eq("day_number", selectedDay)
        .eq("assessment_type", assessmentType)
        .eq("activity_type", activityTypeGroup)
        .order("id", { ascending: true });

      const headers = [header1, header2, header3];
      const insertRows = headers.map((h, index) => {
        const row: any = {
          week_number: selectedWeek,
          day_number: selectedDay,
          assessment_type: assessmentType,
          activity_type: activityTypeGroup,
          unit_name: unitName || "ทั่วไป", // เซฟชื่อหน่วยลงคอลัมน์สัมพันธ์กับสัปดาห์
          activity_name: h
        };
        if (existData && existData[index]) {
          row.id = existData[index].id;
        }
        return row;
      });

      const { error } = await supabase.from("assessment_templates").upsert(insertRows, { onConflict: 'id' });
      if (error) throw error;
      
      alert(`💾 บันทึก "หน่วย${unitName || 'ทั่วไป'}" ประจำสัปดาห์ที่ ${selectedWeek} เรียบร้อยแล้วเพื่อนรัก!`);
      fetchData();
    } catch (err: any) {
      console.error("❌ Save template failed:", err);
      alert(`ไม่สามารถบันทึกโครงสร้างได้เนื่องจาก: ${err.message || 'สิทธิ์ฐานข้อมูลขัดข้อง'}`);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // --- 💾 บันทึกคะแนน (Optimistic Update) ---
  const handleSaveScore = async (studentId: string, templateId: string, scoreValue: number) => {
    const previousStudentsState = [...students];

    setStudents(prevStudents => 
      prevStudents.map(std => {
        if (std.id === studentId) {
          return {
            ...std,
            scores: { ...std.scores, [templateId]: scoreValue }
          };
        }
        return std;
      })
    );

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      
      const scorePayload: any = {
        student_id: studentId,
        template_id: templateId,
        day_number: selectedDay,
        score_value: scoreValue,
        total_score: scoreValue,
        average_score: scoreValue,
        quality_level: scoreValue >= 3 ? "ดี" : scoreValue === 2 ? "พอใช้" : "ปรับปรุง",
        evaluation_date: todayStr,
        assessment_date: todayStr,
        evaluator_name: "คุณครูประจำชั้น"
      };

      const { error } = await supabase
        .from("student_scores")
        .upsert(scorePayload, { onConflict: 'student_id,template_id,day_number' });

      if (error) throw error;
    } catch (err) {
      console.error("❌ Save score failed:", err);
      setStudents(previousStudentsState);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Banner + 🟢 ปุ่มพรีวิวลิงก์เด้งไปหน้าสรุปของคอมพิวเตอร์โดยตรง */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-8 rounded-xl text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black">💻 ระบบจัดการและประเมินผลรายวิชาเสริม</h1>
            <p className="text-sm opacity-95 mt-1 font-semibold">📍 แฟ้มข้อมูลวิชา: {subjectName}</p>
                    </div>
                    {/* 🟢 ปุ่มพรีวิวแบบเปิดหน้าต่างใหม่ (ใช้ฟังก์ชัน handlePreview แทน Link) */}
<button 
  onClick={() => {
    const url = `/admin/reports_com?center=${selectedCenter}&room=${selectedRoom}&week=${selectedWeek}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }}
  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
>
  📊 พรีวิวดูคะแนนและรายงานในห้อง
</button>
        </div>

        {/* Filters คัดกรอง */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">ศูนย์พัฒนาเด็กเล็ก</label>
            <select value={selectedCenter} onChange={(e) => setSelectedCenter(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 outline-none">
              <option value="01">ศูนย์ 1 ท่าเสด็จ</option>
              <option value="02">ศูนย์ 2 บ้านน้ำโมง</option>
              <option value="11">ศูนย์ 1 ท่าเสด็จ(เพิ่มเติม)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">ห้องเรียน</label>
            <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 outline-none">
              <option value="11">เด็กเล็ก 1/1</option>
              <option value="12">เด็กเล็ก 1/2</option>
              <option value="21">อนุบาล 1/1</option>
              <option value="22">อนุบาล 1/2</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">สัปดาห์ที่</label>
            <select value={selectedWeek} onChange={(e) => setSelectedWeek(Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 outline-none">
              {[...Array(40)].map((_, i) => <option key={i+1} value={i+1}>สัปดาห์ที่ {i+1}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">วันที่ประเมิน</label>
            <select value={selectedDay} onChange={(e) => setSelectedDay(Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 outline-none">
              {[1, 2, 3, 4, 5].map(d => <option key={d} value={d}>วันที่ {d}</option>)}
            </select>
          </div>
        </div>

        {/* แผงตั้งค่าโครงสร้างวิชา */}
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200 pb-2">
            <h3 className="text-base font-bold text-amber-800">✍️ ตั้งค่าชื่อหน่วยและหัวข้อสังเกตพฤติกรรม (วิชาเสริม)</h3>
            <span className="text-xs bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full font-bold">สัปดาห์ที่ {selectedWeek} / วันที่ {selectedDay}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-amber-700">📦 ชื่อหน่วยเรียนรู้</label>
              <input type="text" value={unitName} onChange={(e) => setUnitName(e.target.value)} className="w-full p-2 border rounded-lg text-sm bg-white" placeholder="ระบุชื่อหน่วย..."/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">🎯 ข้อ 1</label>
              <input type="text" value={header1} onChange={(e) => setHeader1(e.target.value)} className="w-full p-2 border rounded-lg text-sm bg-white"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">🎯 ข้อ 2</label>
              <input type="text" value={header2} onChange={(e) => setHeader2(e.target.value)} className="w-full p-2 border rounded-lg text-sm bg-white"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">🎯 ข้อ 3</label>
              <input type="text" value={header3} onChange={(e) => setHeader3(e.target.value)} className="w-full p-2 border rounded-lg text-sm bg-white"/>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleSaveTemplate} disabled={isSavingTemplate} className="px-6 py-2 bg-amber-600 text-white font-bold text-sm rounded-lg hover:bg-amber-700 disabled:opacity-50">
              {isSavingTemplate ? "⏳ กำลังบันทึก..." : "💾 บันทึกโครงสร้างแผนวิชา"}
            </button>
          </div>
        </div>

        {/* ตารางสเปรดชีตแสดงผล (เรียกใช้ Extra Component) */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-sm text-slate-500 font-bold">กำลังดึงข้อมูลและจัดสรรรายชื่อนักเรียน...</p>
          </div>
        ) : (
          <AssessmentTableExcelExtra 
            key={`${selectedDay}-${selectedWeek}-${currentSet}`}
            students={students} 
            activities={activities} 
            selectedWeek={selectedWeek} 
            selectedDay={selectedDay} 
            onSaveScore={handleSaveScore}
            currentSet={currentSet} 
            setCurrentSet={setCurrentSet} 
          />
        )}
      </div>
    </div>
  );
}