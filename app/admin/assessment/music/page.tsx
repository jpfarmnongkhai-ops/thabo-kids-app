"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import AssessmentTableExcelExtra from "@/components/AssessmentTableExcelExtra";
import { Home, Save, BarChart3, ChevronLeft } from "lucide-react"; // แนะนำให้ใช้ lucide-react เพื่อไอคอนที่สวยงาม
import Link from "next/link";
import { error } from "console";

export default function MusicAssessmentPage() {
  const assessmentType = "extra";
  const subjectName = "วิชาดนตรี (อูคูเลเล่)";
  const activityTypeGroup = `วิชา${subjectName}`;

  // --- 🎛️ State ---
  const [selectedCenter, setSelectedCenter] = useState("01"); 
  const [selectedRoom, setSelectedRoom] = useState("12"); 
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1); 
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
  .select("id, first_name, last_name, nickname, gender_code, center_id, room_number") // ✅ เพิ่ม nickname แล้ว
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

const handleSaveScore = async (studentId: string, templateId: string, scoreValue: number) => {
  try {
    const finalScore = Number(scoreValue) || 0;

    // 1. ค้นหาแถวที่มีข้อมูลครบทั้ง 3 อย่าง (student + template + day)
    const { data: existingData } = await supabase
      .from("student_scores")
      .select("id")
      .eq("student_id", studentId)
      .eq("template_id", templateId)
      .eq("day_number", selectedDay)
      .maybeSingle(); 

    let query;
    if (existingData) {
      // ถ้าเจอข้อมูลเดิม -> อัปเดตผ่าน ID (วิธีนี้ปลอดภัยที่สุด)
      query = supabase.from("student_scores").update({ 
        score_value: finalScore,
        scores: { [templateId]: finalScore }
      }).eq("id", existingData.id);
    } else {
      // ถ้าไม่เจอ -> เพิ่มแถวใหม่
      query = supabase.from("student_scores").insert({
        student_id: studentId,
        template_id: templateId,
        day_number: selectedDay,
        score_value: finalScore,
        scores: { [templateId]: finalScore },
        assessment_type: "extra",
        evaluator_name: "คุณครูประจำชั้น"
      });
    }

    const { error } = await query;
    if (error) throw error;
    
    // อัปเดต UI ให้ปุ่มเปลี่ยนสี
    setStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, scores: { ...s.scores, [templateId]: finalScore } } : s
    ));
    
  } catch (err: any) {
    console.error("❌ บันทึกพลาด:", err);
    alert("บันทึกไม่สำเร็จ: " + err.message);
  }
};
 return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="no-print space-y-6"></div>
        {/* 1. ส่วนหน้าจอตั้งค่า (no-print) */}
        <div className="no-print space-y-6">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition font-bold text-slate-600">
              <Home size={18} /> กลับหน้าหลัก
            </Link>
            
            <div className="flex gap-2">
              
              <button 
                onClick={() => window.open(`/admin/reports_music?center=${selectedCenter}&room=${selectedRoom}&week=${selectedWeek}`, '_blank')}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
              >
                <BarChart3 size={18} /> รายงานสรุปคะแนน
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-2xl text-white shadow-xl">
            <h1 className="text-3xl font-black">💻 ประเมินผลรายวิชาเสริม</h1>
            <p className="opacity-90 mt-1 font-medium text-blue-100">รายการประเมิน: {subjectName}</p>
          </div>

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
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
              >
                🖨️ พิมพ์หน้านี้
              </button>
              </div>
          </div>
        </div>

        {/* 2. ส่วนตาราง (printable-area) */}
        <div className="printable-area">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-sm text-slate-500 font-bold">กำลังดึงข้อมูลและจัดสรรรายชื่อนักเรียน...</p>
            </div>
          ) : (
            <AssessmentTableExcelExtra 
              key={`${selectedDay}-${selectedWeek}-${currentSet}-${JSON.stringify(students)}`}
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
        
      </div> {/* ปิด max-w-7xl */}
    </div> // ปิด p-6
  );
  }