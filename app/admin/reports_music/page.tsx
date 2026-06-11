'use client';

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

// 🏢 ฟังก์ชันแปลงรหัสหน้าจอเป็นชื่อแสดงผล
const getCenterFullName = (id: string) => {
  const cleanId = String(id).trim();
  if (cleanId === "01" || cleanId === "1") return "ศูนย์ 1 ท่าเสด็จ";
  if (cleanId === "11") return "ศูนย์ 1 ท่าเสด็จ(เพิ่มเติม)";
  if (cleanId === "02" || cleanId === "2") return "ศูนย์ 2 บ้านน้ำโมง";
  return `ศูนย์รหัส ${id}`;
};

// 🚪 ฟังก์ชันแปลงรหัสหน้าจอเป็นชื่อห้อง
const getRoomFullName = (roomId: string) => {
  const cleanRoom = String(roomId).trim();
  if (cleanRoom === "11") return "เด็กเล็ก 1/1";
  if (cleanRoom === "12") return "เด็กเล็ก 1/2";
  if (cleanRoom === "21") return "อนุบาล 1/1";
  if (cleanRoom === "22") return "อนุบาล 1/2";
  return `ห้อง ${roomId}`;
};

function ReportContent() {
  const searchParams = useSearchParams();
  
  // 📥 ดึงค่าพารามิเตอร์จาก URL Query
  const week = searchParams.get("week") || "1";
  const center = searchParams.get("center") || "01";
  const room = searchParams.get("room") || "12"; 

  const assessmentType = "extra";
  const subjectName = "วิชาดนตรี (อูคูเลเล่)";
  const activityTypeGroup = `วิชา${subjectName}`;

  // 📊 States สำหรับการประมวลผลข้อมูล
  const [loading, setLoading] = useState(true);
  const [unitName, setUnitName] = useState("กำลังโหลดข้อมูลหน่วยเรียนรู้...");
  const [searchTerm, setSearchTerm] = useState(""); // 🔍 คีย์เวิร์ดค้นหาชื่อเด็ก
  const [teacherName, setTeacherName] = useState(""); // 👩‍🏫 ชื่อครูผู้รายงาน
  
  // เก็บรายชื่อและคะแนนสรุปของเด็กแต่ละคน
  const [studentRows, setStudentRows] = useState<any[]>([]);
  
  // 🎯 เปลี่ยนสถิติภาพรวมจาก 6 กิจกรรมหลัก เป็น หัวข้อพฤติกรรมย่อยของวิชาเสริม
  const [subActivities, setSubActivities] = useState<any[]>([]);

  // 🏆 สรุปจำนวนเด็กตามเกณฑ์คุณภาพ
  const [qualitySummary, setQualitySummary] = useState([
    { label: "ดี (3)", count: 0, percentage: 0, bg: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-200", lightBg: "bg-emerald-50" },
    { label: "พอใช้ (2)", count: 0, percentage: 0, bg: "bg-amber-500", text: "text-amber-700", border: "border-amber-200", lightBg: "bg-amber-50" },
    { label: "ควรส่งเสริม (1)", count: 0, percentage: 0, bg: "bg-red-500", text: "text-red-700", border: "border-red-200", lightBg: "bg-red-50" },
  ]);

  const fetchAndCalculateReport = useCallback(async () => {
    try {
      setLoading(true);
      const targetWeekNum = parseInt(week) || 1;

      // --- 1. ดึงข้อมูลเทมเพลตกิจกรรม เฉพาะของวิชาดนตรีปฐมวัย ---
      const { data: templates, error: tempErr } = await supabase
        .from("assessment_templates")
        .select("id, week_number, unit_name, activity_name")
        .eq("week_number", targetWeekNum)
        .eq("assessment_type", assessmentType)
        .eq("activity_type", activityTypeGroup)
        .order("id", { ascending: true });

      if (tempErr) throw tempErr;

      const currentUnitName = templates?.[0]?.unit_name || "ทั่วไป/ไม่ได้ระบุชื่อหน่วย";
      setUnitName(currentUnitName);
console.log("🔍 ผลลัพธ์ Templates:", templates);
      // ทำ Map จับคู่ไอดีข้อประเมินย่อย -> ชื่อพฤติกรรมที่สังเกตจริง
      const templateItemMap = new Map<string, string>();
      const currentWeekTemplateIds: string[] = [];
      const dynamicSubTotals: Record<string, { name: string; sum: number; count: number }> = {};
      
      templates?.forEach(t => {
        templateItemMap.set(t.id, t.activity_name);
        currentWeekTemplateIds.push(t.id);
        // สร้างโครงสร้างรอคำนวณสถิติร้อยละแยกรายหัวข้อพฤติกรรม
        dynamicSubTotals[t.id] = { name: t.activity_name, sum: 0, count: 0 };
      });

      // --- 2. ดึงข้อมูลนักเรียนทั้งหมดในห้องเรียนนี้ ---
      const { data: allStudents, error: studentError } = await supabase
        .from("students")
        .select("id, first_name, last_name, nickname, center_id, room_number")
        .eq("center_id", center)
        .eq("room_number", room);

      if (studentError) throw studentError;

      if (!allStudents || allStudents.length === 0) {
        setStudentRows([]);
        setSubActivities([]);
        setLoading(false);
        return;
      }

      const studentIds = allStudents.map(s => s.id);

      // --- 3. ดึงคะแนนประเมินผลจากตาราง student_scores (ดึงมาทั้งสัปดาห์) ---
      let scoreRecords: any[] = [];
      if (studentIds.length > 0 && currentWeekTemplateIds.length > 0) {
        const { data: scores, error: scoreError } = await supabase
          .from("student_scores")
          .select("student_id, template_id, score_value")
          .in("student_id", studentIds)
          .in("template_id", currentWeekTemplateIds);

        if (scoreError) throw scoreError;
        scoreRecords = scores || [];
        console.log("🔍 คะแนนที่ดึงได้จาก DB:", scores);
      }

      // จัดกลุ่มคะแนนแยกตามไอดีเด็กนักเรียน
      const studentScoresGroup: Record<string, any[]> = {};
      scoreRecords.forEach(rec => {
        if (!studentScoresGroup[rec.student_id]) {
          studentScoresGroup[rec.student_id] = [];
        }
        studentScoresGroup[rec.student_id].push(rec);
      });

      // --- 4. คำนวณสถิติภาพรวม ---
      let qCount = { good: 0, fair: 0, improve: 0 };
      let preparedRows: any[] = [];

      allStudents.forEach(student => {
        const myScores = studentScoresGroup[student.id] || [];
        let studentSum = 0;
        let studentCount = 0;

        myScores.forEach(scoreRow => {
          const rawScore = Number(scoreRow.score_value);
          
          if (!isNaN(rawScore) && rawScore > 0) { 
            // สะสมคะแนนแยกตามหัวข้อข้อประเมิน
            if (dynamicSubTotals[scoreRow.template_id]) {
              dynamicSubTotals[scoreRow.template_id].sum += rawScore;
              dynamicSubTotals[scoreRow.template_id].count += 1;
            }

            studentSum += rawScore;
            studentCount += 1;
          }
        });

        // 📊 คำนวณระดับคุณภาพตามคะแนนเฉลี่ยจริงสะสมสะท้อนตามเกณฑ์กระทรวง
        const finalAvg = studentCount > 0 ? studentSum / studentCount : 0;
        let qualityLabel = "ยังไม่มีการประเมิน";
        
        if (studentCount > 0) {
          if (finalAvg >= 2.50) { 
            qCount.good++; 
            qualityLabel = "ดี (3)"; 
          } else if (finalAvg >= 1.50) { 
            qCount.fair++; 
            qualityLabel = "พอใช้ (2)"; 
          } else { 
            qCount.improve++; 
            qualityLabel = "ควรส่งเสริม (1)"; 
          }
        }

        preparedRows.push({
          id: student.id,
          fullName: `${student.first_name} ${student.last_name}`,
          nickname: student.nickname ? `(${student.nickname})` : "",
          evaluatedCount: studentCount,
          averageScore: finalAvg,
          quality: qualityLabel
        });
      });

      setStudentRows(preparedRows);

      // 📈 แปลงสถิติความก้าวหน้าแยกตามข้อประเมินจริงที่ดึงจากเทมเพลต (คำนวณฐานคะแนนเต็ม 3)
      const formattedSubActivities = Object.keys(dynamicSubTotals).map(key => {
        const item = dynamicSubTotals[key];
        const percentage = item.count > 0 ? (item.sum / (item.count * 3)) * 100 : 0;
        return {
          name: item.name,
          percentage: percentage
        };
      });
      setSubActivities(formattedSubActivities);

      // 🏆 คำนวณร้อยละสัดส่วนนักเรียนตามเกณฑ์คุณภาพ
      const evaluatedTotal = qCount.good + qCount.fair + qCount.improve;
      setQualitySummary([
        { label: "ดี (3)", count: qCount.good, percentage: evaluatedTotal > 0 ? Math.round((qCount.good / evaluatedTotal) * 100) : 0, bg: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-200", lightBg: "bg-emerald-50" },
        { label: "พอใช้ (2)", count: qCount.fair, percentage: evaluatedTotal > 0 ? Math.round((qCount.fair / evaluatedTotal) * 100) : 0, bg: "bg-amber-500", text: "text-amber-700", border: "border-amber-200", lightBg: "bg-amber-50" },
        { label: "ควรส่งเสริม (1)", count: qCount.improve, percentage: evaluatedTotal > 0 ? Math.round((qCount.improve / evaluatedTotal) * 100) : 0, bg: "bg-red-500", text: "text-red-700", border: "border-red-200", lightBg: "bg-red-50" },
      ]);

    } catch (err) {
      console.error("❌ Error loading report:", err);
    } finally {
      setLoading(false);
    }
  }, [week, center, room, activityTypeGroup]);

  useEffect(() => {
    fetchAndCalculateReport();
  }, [fetchAndCalculateReport]);

  const filteredRows = studentRows.filter(row => 
    row.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    row.quality.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-20">
        <div className="w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-indigo-600 font-bold animate-pulse">กำลังสรุปผลสารสนเทศวิชาเสริมประสบการณ์... </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0">
      
      {/* 🛠️ Control Panel คัดกรองข้อมูล (ซ่อนอัตโนมัติเวลาสั่งพิมพ์) */}
      <div className="max-w-6xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center print:hidden bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">🔍 ตัวกรองรายชื่อ</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="พิมพ์ชื่อเด็ก หรือผลลัพธ์เพื่อกรอง..."
            className="w-full text-sm border border-slate-300 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">👩‍🏫 ครูผู้สอน/ลงนามรายงาน</label>
          <input
            type="text"
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            placeholder="พิมพ์ชื่อคุณครูผู้รายงานผล..."
            className="w-full text-sm border border-slate-300 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
        </div>
        <div className="text-right pt-4 md:pt-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            🖨️ สั่งพิมพ์/บันทึก PDF รายงานนี้
          </button>
        </div>
      </div>

      {/* 📄 ฟอร์มรายงานตัวจริง สไตล์กระดาษรายงานราชาการปฐมวัย */}
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/60 p-8 print:shadow-none print:border-none print:p-0">
        
        {/* Header เอกสาร */}
        <div className="text-center border-b-2 border-slate-100 pb-6 mb-8">
          <div className="text-xs bg-indigo-600 text-white font-black px-3 py-1 rounded-md inline-block mb-2 uppercase tracking-wide">
            รายงานวิชาเสริมประสบการณ์พิเศษ
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">📊 สรุปรายงานภาพรวมผลการประเมินหลังการจัดประสบการณ์</h2>
          <p className="text-slate-600 font-bold mt-1 text-md">รายวิชา: {subjectName} ({getCenterFullName(center)})</p>
          <p className="text-slate-400 font-bold text-sm mt-1">ระดับชั้น: {getRoomFullName(room)}</p>
          
          <div className="mt-3 inline-flex flex-wrap gap-4 justify-center bg-slate-100 text-slate-800 px-4 py-1.5 rounded-full text-xs font-bold">
            <span>📅 สัปดาห์การเรียนรู้ที่: {week}</span>
            <span>📦 ชื่อหน่วยการเรียนรู้: {unitName}</span>
            <span>👶 นักเรียนในห้องเรียน: {studentRows.length} คน</span>
          </div>
        </div>

        {studentRows.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-semibold">❌ ยังไม่มีประวัติการบันทึกคะแนนวิชาคอมพิวเตอร์ในสัปดาห์นี้ครับเพื่อนรัก</div>
        ) : (
          <div className="space-y-8">
            
            {/* สรุปสถิติด้านบนแบบ Grid สองฝั่ง */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* ซ้าย: ความก้าวหน้าจำแนกตามพฤติกรรมย่อยที่ดึงจริงจาก DB */}
              <div className="lg:col-span-7">
                <h3 className="text-sm font-bold text-slate-700 mb-3">📈 ค่าเฉลี่ยร้อยละจำแนกตามพฤติกรรมเป้าหมายรายวิชา</h3>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-white text-xs">
                        <th className="p-3 font-semibold">พฤติกรรม/ข้อบ่งชี้คุณลักษณะ วิชาดนตรี(อูคูเลเล่)</th>
                        <th className="p-3 text-center font-semibold w-32">ร้อยละเฉลี่ย</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {subActivities.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="p-4 text-center text-slate-400">ยังไม่ได้ระบุหัวข้อเป้าหมายสัปดาห์นี้</td>
                        </tr>
                      ) : (
                        subActivities.map((act, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/40">
                            <td className="p-3 font-bold text-slate-700">ข้อ {idx + 1}: {act.name}</td>
                            <td className="p-3 text-center font-black text-indigo-600 bg-indigo-50/20 text-sm">
                              {act.percentage.toFixed(2)}%
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ขวา: สัดส่วนแยกตามเกณฑ์คุณภาพ */}
              <div className="lg:col-span-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-700 mb-3">🏆 สรุปสัดส่วนเด็กตามเกณฑ์ระดับพัฒนาการวิชา</h3>
                {qualitySummary.map((q, idx) => (
                  <div key={idx} className={`p-3 rounded-2xl border ${q.border} ${q.lightBg} flex items-center justify-between`}>
                    <div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold text-white mb-1 ${q.bg}`}>
                        ระดับ {q.label}
                      </span>
                      <div className="text-lg font-black text-slate-800">
                        {q.count} <span className="text-xs font-normal text-slate-500">คน</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">คิดเป็นร้อยละ</span>
                      <span className={`text-xl font-black ${q.text}`}>{q.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* ตารางบัญชีสรุปรายคนด้านล่าง */}
            <div className="mt-4">
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center justify-between">
                <span>📋 ตารางสรุปผลพัฒนาการเทคโนโลยีรายบุคคลประจำห้องเรียน</span>
                {searchTerm && <span className="text-xs font-normal text-indigo-600 print:hidden">🔍 คัดกรองเฉพาะคำค้นหาอัตโนมัติ</span>}
              </h3>
              
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-[11px] font-bold border-b border-slate-200">
                      <th className="p-3 text-center w-12">ลำดับ</th>
                      <th className="p-3">ชื่อ - นามสกุลนักเรียน</th>
                      <th className="p-3 text-center w-36">ข้อประเมินที่วัดผล</th>
                      <th className="p-3 text-center w-28">คะแนนเฉลี่ยสะสม</th>
                      <th className="p-3 text-center w-36">สรุปผลระดับวิชา</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">❌ ไม่พบข้อมูลรายชื่อเด็กที่ตรงกับคำค้นหาของคุณครู</td>
                      </tr>
                    ) : (
                      filteredRows.map((row, index) => (
                        <tr key={row.id} className="hover:bg-slate-50/50">
                          <td className="p-3 text-center font-bold text-slate-400">{index + 1}</td>
                          <td className="p-3 font-bold text-slate-800">
                            {row.fullName} <span className="text-indigo-500 font-normal ml-1">{row.nickname}</span>
                          </td>
                          <td className="p-3 text-center text-slate-500 font-medium">{row.evaluatedCount} รายการย่อย</td>
                          <td className="p-3 text-center font-black text-slate-800 text-sm">
                            {row.evaluatedCount > 0 ? row.averageScore.toFixed(2) : "-"}
                          </td>
                          <td className="p-3 text-center">
                            {row.evaluatedCount === 0 ? (
                              <span className="text-slate-400 font-medium text-[11px]">ยังไม่ได้บันทึกผล</span>
                            ) : (
                              <span className={`inline-block px-3 py-0.5 rounded-full text-[11px] font-bold ${
                                row.quality.includes("ดี") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                row.quality.includes("พอใช้") ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                "bg-red-50 text-red-700 border border-red-200"
                              }`}>
                                {row.quality}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

 {/* ✍️ ส่วนลงนามท้ายรายงานสำหรับส่งเทศบาล */}
<div className="mt-16 pt-6 border-t border-dashed border-slate-200 flex justify-between items-end w-full">
  
  {/* ฝั่งซ้าย: หมายเหตุระบบ */}
  <div className="hidden print:block text-left text-[10px] text-slate-400 font-medium">
    * พิมพ์เอกสารสรุปผลอัตโนมัติผ่านระบบบริหารจัดการสารสนเทศปฐมวัย Thabo Municipality
  </div>
  
  {/* ฝั่งขวา: บล็อกลงนามคุณครู (ใช้ ml-auto ดันไปขวาสุด) */}
  <div className="ml-auto w-80 flex flex-col items-center">
    
    {/* บรรทัดที่ 1: ลายมือชื่อ */}
    <div className="text-sm font-bold text-slate-700 text-center w-full whitespace-nowrap">
      ( ลงชื่อ ) ......................... ผู้รายงาน
    </div>
    <div className="text-xs text-slate-600 mt-1 w-full text-center whitespace-nowrap">
      การสอนประสบการณ์เสริมวิชาดนตรี(อูคูเลเล่)
    </div>
    
    {/* บรรทัดที่ 2: วงเล็บชื่อ-นามสกุลตัวบรรจง */}
    <div className="text-sm font-bold text-slate-800 tracking-wide text-center mt-3 w-full whitespace-nowrap">
      ( {teacherName ? teacherName.trim() : "นายเอกชัย ลุนเสนา"} )
    </div>
    
    {/* บรรทัดที่ 3: ตำแหน่ง */}
    <div className="text-xs text-slate-500 mt-2 font-medium text-center w-full whitespace-nowrap">
      ตำแหน่ง ผู้ดูแลเด็ก
    </div>
    
  </div>
</div>

          </div>
        )}

      </div>
    </div>
  );
}

export default function AssessmentReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-indigo-600 font-bold">กำลังเปิดหน้าต่างโมดูลสรุปรายงานผลวิชาดนตรี (อูคูเลเล่)...</p>
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}