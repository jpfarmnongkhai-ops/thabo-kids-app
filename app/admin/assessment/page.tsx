"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import AssessmentTableExcel from "@/components/AssessmentTableExcel";

export default function AssessmentPage() {
  // ปรับ Default ล็อกตาม "ศูนย์ 1 ท่าเสด็จ" (01) เพื่อความสะดวกในการใช้งานตั้งแต่เปิดหน้าแรก
  const [selectedCenter, setSelectedCenter] = useState("01"); 
  const [selectedRoom, setSelectedRoom] = useState("12");   // ล็อกตามห้อง 12 ในภาพของเพื่อน
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1); 
  const [selectedSub, setSelectedSub] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]); 
  const [currentSet, setCurrentSet] = useState(0);

  // 🛠️ ครอบด้วย useCallback ป้องกันฟังก์ชันสร้างตัวเองใหม่แบบพร่ำเพรื่อ จนเกิด Infinite Loop
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. ดึงข้อมูลนักเรียน (เพิ่ม nickname เข้าไปใน select)
      const { data: stdData, error: stdErr } = await supabase
        .from("students")
        .select("id, first_name, last_name, nickname, gender_code, center_id, room_number") // เพิ่ม nickname
        .eq("center_id", selectedCenter)
        .eq("room_number", selectedRoom);

      if (stdErr) throw stdErr;
      
        
      // 2. ดึงเทมเพลตกิจกรรม
      const { data: actData, error: actErr } = await supabase
        .from("assessment_templates")
        .select("*")
        .eq("week_number", selectedWeek)
        .eq("day_number", selectedDay);

      if (actErr) throw actErr;

      // 3. ดึงคะแนนปัจจุบัน (ใช้คีย์หลัก UUID ในการ Match ข้อมูล)
      const studentIds = stdData?.map(s => s.id) || [];
      
      let scoreMap: { [key: string]: { [key: string]: number } } = {};
      
      if (studentIds.length > 0) {
        const { data: scoreData, error: scoreErr } = await supabase
          .from("student_scores")
          .select("student_id, template_id, score_value")
          .in("student_id", studentIds)
          .eq("day_number", selectedDay);

        if (scoreErr) throw scoreErr;

        scoreData?.forEach((row: any) => {
          if (!scoreMap[row.student_id]) {
            scoreMap[row.student_id] = {};
          }
          scoreMap[row.student_id][row.template_id] = row.score_value;
        });
      }

      // นำคะแนนเก่ามาประกอบเข้ากับตัวแปรนักเรียน
      const studentsWithScores = stdData?.map((std: any) => ({
        ...std,
        scores: scoreMap[std.id] || {} 
      })) || [];

      // 4. จัดกลุ่มข้อมูลกิจกรรม
      const grouped = actData?.reduce((acc: any[], curr: any) => {
        let group = acc.find(a => a.name === curr.activity_type);
        if (!group) { 
          group = { 
            name: curr.activity_type || "ไม่มีชื่อกิจกรรม", 
            unit_name: curr.unit_name, 
            subItems: [],
            subSubstance: curr.sub_substance 
          }; 
          acc.push(group); 
        }
        group.subItems.push({ id: curr.id, label: curr.activity_name }); 
        return acc;
      }, []);

      // เรียงลำดับกิจกรรมตามหลักวิชาการปฐมวัย (1-6)
      const activityOrder: { [key: string]: number } = {
        "กิจกรรมเคลื่อนไหวและจังหวะ": 1,
        "กิจกรรมเสริมประสบการณ์": 2,
        "กิจกรรมสร้างสรรค์": 3,
        "กิจกรรมเสรี": 4,
        "กิจกรรมกลางแจ้ง": 5,
        "กิจกรรมเกมการศึกษา": 6
      };

      grouped?.sort((a: any, b: any) => {
        return (activityOrder[a.name] || 99) - (activityOrder[b.name] || 99);
      });

      setStudents(studentsWithScores);
      setActivities(grouped || []); 
    } catch (err) { 
      console.error("❌ ข้อผิดพลาดในการโหลดข้อมูลหน้าจอ:", err); 
    } finally { 
      setLoading(false); 
    }
  }, [selectedCenter, selectedRoom, selectedWeek, selectedDay]);

  const handleSaveScore = async (studentId: string, templateId: string, scoreValue: number) => {
    
    // สำรองข้อมูลหน้าจอไว้เผื่อกรณีระบบผิดพลาด
    const previousStudentsState = [...students];

    // 1. อัปเดตสีปุ่มบนหน้าจอทันทีแบบไฮสปีด (Optimistic Update)
    setStudents(prevStudents => 
      prevStudents.map(std => {
        if (std.id === studentId) {
          return {
            ...std,
            scores: {
              ...std.scores,
              [templateId]: scoreValue
            }
          };
        }
        return std;
      })
    );

    try {
      // วันที่ปัจจุบันในรูปแบบ YYYY-MM-DD
      const todayStr = new Date().toISOString().split('T')[0];

      // 2. [แผน A] ลองสั่ง UPDATE แถวเดิมที่มีอยู่แล้วในฐานข้อมูลก่อน
      const { data: updateData, error: updateError } = await supabase
        .from("student_scores")
        .update({
          score_value: scoreValue,
          total_score: scoreValue,                      // เผื่อตารางบังคับอัปเดตฟิลด์นี้ด้วย
          evaluation_date: todayStr,
          assessment_date: todayStr,
          evaluator_name: "คุณครูประจำชั้น"
        })
        .eq("student_id", studentId)
        .eq("template_id", templateId)
        .eq("day_number", selectedDay)
        .select(); // สั่งให้ส่งข้อมูลกลับมาเช็กว่าอัปเดตสำเร็จไหม

      // 3. [แผน B] ถ้าไม่มีข้อมูลเดิมอยู่เลย (updateData ว่างเปล่า หรือไม่มี Error แต่ไม่มีแถวถูกอัปเดต)
      if (updateError || !updateData || updateData.length === 0) {
        console.log("📌 ไม่พบข้อมูลเดิม ทำการสร้างแถวใหม่ (INSERT)...");
        
        const { error: insertError } = await supabase
          .from("student_scores")
          .insert({
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
          });

        if (insertError) {
          // หากยังไม่ได้อีก เป็นไปได้ว่าตารางนี้ใช้ระบบยัดรวมลงฟิลด์ `scores` แบบ jsonb
          console.log("⚠️ ลอง INSERT แบบปกติไม่ผ่าน ลองแผนสำรอง ยิงเข้าฟิลด์ jsonb...");
          
          const jsonbPayload: any = {};
          jsonbPayload[templateId] = scoreValue;

          const { error: jsonbError } = await supabase
            .from("student_scores")
            .insert({
              student_id: studentId,
              template_id: templateId,
              day_number: selectedDay,
              scores: jsonbPayload, // ยิงเข้าคอลัมน์ jsonb เผื่อระบบล็อกไว้
              total_score: scoreValue,
              evaluation_date: todayStr,
              evaluator_name: "คุณครูประจำชั้น"
            });

          if (jsonbError) throw jsonbError; // ถ้าหลุดจากนี้แสดงว่าติดขัดที่สิทธิ์ RLS หรือฟิลด์อื่น
        }
      }

      console.log(`✅ บันทึกคะแนนสำเร็จ: เด็ก ${studentId} ข้อ ${templateId} -> คะแนน ${scoreValue}`);

    } catch (err) {
      console.error("❌ บันทึกคะแนนลง Supabase ล้มเหลวแบบสิ้นเชิง:", err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล ระบบจะทำการคืนค่าปุ่มเดิมให้ครับ");
      
      // คืนค่าปุ่มสีเก่าให้คุณครูเห็นทันทีเพื่อความถูกต้อง
      setStudents(previousStudentsState); 
    }
  };

  // ดักจับความเปลี่ยนแปลงฟิลเตอร์เพื่อดึงข้อมูลรอบใหม่แบบเคลียร์สะอาดตา
  useEffect(() => { 
    setCurrentSet(0); 
    fetchData();
    window.scrollTo(0, 0); 
  }, [fetchData, selectedSub]);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-400 p-8 rounded-xl text-white shadow-lg mb-2">
          <h1 className="text-3xl font-black">📊 ระบบประเมินพัฒนาการ</h1>
          <div className="flex justify-end">
            <button 
              onClick={() => window.open(`/admin/assessment-report?center=${selectedCenter}&room=${selectedRoom}&week=${selectedWeek}`, '_blank')}
              className="px-4 py-1.5 text-sm bg-emerald-600 rounded-md font-semibold hover:bg-emerald-700 transition shadow"
            >
              📊 ดูรายงานสรุป
            </button>
          </div>
        </div>

        {/* ฟิลเตอร์เลือกเงื่อนไขข้อมูล */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">ศูนย์ฯ</label>
            <select value={selectedCenter} onChange={(e) => setSelectedCenter(e.target.value)} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-pink-400 outline-none transition font-semibold">
              {/* 🌟 ปรับลำดับ: เอาศูนย์หลักที่มีข้อมูลขึ้นก่อนตามที่คุณครูต้องการ */}
              <option value="01">ศูนย์ 1 ท่าเสด็จ</option>
              <option value="02">ศูนย์ 2 บ้านน้ำโมง</option>
              <option value="11">ศูนย์ 1 ท่าเสด็จ(เพิ่มเติม)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">ห้องเรียน</label>
            <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-pink-400 outline-none transition font-semibold">
              <option value="11">เด็กเล็ก 1/1</option>
              <option value="12">เด็กเล็ก 1/2</option>
              <option value="21">อนุบาล 1/1</option>
              <option value="22">อนุบาล 1/2</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">สัปดาห์ที่</label>
            <select value={selectedWeek} onChange={(e) => setSelectedWeek(Number(e.target.value))} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-pink-400 outline-none transition font-semibold">
              {[...Array(40)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">วันที่</label>
            <select value={selectedDay} onChange={(e) => setSelectedDay(Number(e.target.value))} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-pink-400 outline-none transition font-semibold">
              {[1, 2, 3, 4, 5].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* พื้นที่จัดการตารางหลัก */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-3 bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-slate-500 animate-pulse">กำลังดึงข้อมูลระบบประเมินพัฒนาการ...</p>
          </div>
        ) : (
          <AssessmentTableExcel 
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