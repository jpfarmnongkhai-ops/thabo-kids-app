'use client';

import { useEffect, useState, Suspense } from "react";
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
  const room = searchParams.get("room") || "11";

  // 📊 States สำหรับการประมวลผลข้อมูล
  const [loading, setLoading] = useState(true);
  const [unitName, setUnitName] = useState("กำลังโหลดข้อมูลหน่วยเรียนรู้...");
  const [searchTerm, setSearchTerm] = useState(""); // 🔍 คีย์เวิร์ดค้นหาชื่อเด็ก
  const [teacherName, setTeacherName] = useState(""); // 👩‍🏫 ชื่อครูผู้รายงาน (พิมพ์เปลี่ยนได้)
  
  // เก็บรายชื่อและคะแนนสรุปของเด็กแต่ละคน
  const [studentRows, setStudentRows] = useState<any[]>([]);
  
  // สถิติภาพรวม 6 กิจกรรมหลัก
  const [activities, setActivities] = useState([
    { name: "กิจกรรมเคลื่อนไหวและจังหวะ", percentage: 0 },
    { name: "กิจกรรมเสริมประสบการณ์", percentage: 0 },
    { name: "กิจกรรมสร้างสรรค์", percentage: 0 },
    { name: "กิจกรรมเสรี", percentage: 0 },
    { name: "กิจกรรมกลางแจ้ง", percentage: 0 },
    { name: "กิจกรรมเกมการศึกษา", percentage: 0 },
  ]);

  // สรุปจำนวนเด็กตามเกณฑ์คุณภาพ
  const [qualitySummary, setQualitySummary] = useState([
    { label: "ดี (3)", count: 0, percentage: 0, bg: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-200", lightBg: "bg-emerald-50" },
    { label: "พอใช้ (2)", count: 0, percentage: 0, bg: "bg-amber-500", text: "text-amber-700", border: "border-amber-200", lightBg: "bg-amber-50" },
    { label: "ควรส่งเสริม (1)", count: 0, percentage: 0, bg: "bg-red-500", text: "text-red-700", border: "border-red-200", lightBg: "bg-red-50" },
  ]);

  useEffect(() => {
    async function fetchAndCalculateReport() {
      try {
        setLoading(true);
        const targetWeekNum = parseInt(week) || 1;

        // --- 1. ดึงชื่อหน่วยการเรียนรู้ ---
        const { data: templates } = await supabase
          .from("assessment_templates")
          .select("week, unit_name");

        const currentWeekTemplates = templates?.filter(t => Number(t.week) === targetWeekNum) || [];
        setUnitName(currentWeekTemplates[0]?.unit_name || "หน่วยการเรียนรู้ประจำสัปดาห์");

        // --- 2. ดึงข้อมูลนักเรียนทั้งหมดในห้องเรียนนี้ ---
        const { data: allStudents, error: studentError } = await supabase
          .from("students")
          .select("id, first_name, last_name, nickname, center_id, room_number");

        if (studentError) throw studentError;

        // กรองเอาเฉพาะเด็กที่ตรงศูนย์และห้องเรียนจริง ๆ
        const filteredStudents = allStudents?.filter(s => {
          const sCenter = String(s.center_id || '').trim();
          const sRoom = String(s.room_number || '').trim();
          const targetCenter = String(center).trim();
          const targetRoom = String(room).trim();

          const isCenterMatch = sCenter === targetCenter || Number(sCenter) === Number(targetCenter) ||
                                (targetCenter === "01" && sCenter === "1") || (targetCenter === "02" && sCenter === "2");
          const isRoomMatch = sRoom === targetRoom || Number(sRoom) === Number(targetRoom);

          return isCenterMatch && isRoomMatch;
        }) || [];

        if (filteredStudents.length === 0) {
          setStudentRows([]);
          setLoading(false);
          return;
        }

        const studentIds = filteredStudents.map(s => s.id);

        // --- 3. ดึงคะแนนประเมินผลจากตาราง student_score ---
        const { data: scoreRecords, error: scoreError } = await supabase
          .from("student_score")
          .select("student_id, week_number, scores")
          .eq("week_number", targetWeekNum)
          .in("student_id", studentIds);

        if (scoreError) throw scoreError;

        const scoreMap = new Map();
        scoreRecords?.forEach(rec => {
          scoreMap.set(rec.student_id, rec.scores || {});
        });

        // --- 4. ถอดรหัส JSONB มาคำนวณสถิติและเตรียมแถวรายชื่อเด็ก ---
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const actKeys = ["moving", "experience", "creative", "free", "outdoor", "game"];

        let actTotals: Record<string, { sum: number; count: number }> = {};
        actKeys.forEach(k => { actTotals[k] = { sum: 0, count: 0 }; });

        let qCount = { good: 0, fair: 0, improve: 0 };
        let preparedRows: any[] = [];

        filteredStudents.forEach(student => {
          const dbScores = scoreMap.get(student.id) || {};
          let studentSum = 0;
          let studentCount = 0;

          // วนลูปนับคะแนนส่วนตัวเด็ก
          days.forEach(day => {
            if (dbScores[day]) {
              actKeys.forEach(key => {
                if (dbScores[day][key] !== undefined && dbScores[day][key] !== null) {
                  const score = Number(dbScores[day][key]);
                  actTotals[key].sum += score;
                  actTotals[key].count += 1;

                  studentSum += score;
                  studentCount += 1;
                }
              });
            }
          });

          // คำนวณเกรดเฉลี่ยรายบุคคล (คะแนนเต็มสูงสุดคือ 3)
          const finalAvg = studentCount > 0 ? studentSum / studentCount : 0;
          let qualityLabel = "ยังไม่มีการประเมิน";
          
          if (studentCount > 0) {
            if (finalAvg > 2.50) { qCount.good++; qualityLabel = "ดี (3)"; }
            else if (finalAvg > 1.50) { qCount.fair++; qualityLabel = "พอใช้ (2)"; }
            else { qCount.improve++; qualityLabel = "ควรส่งเสริม (1)"; }
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

        // 📊 สรุปเปอร์เซ็นต์กิจกรรมหลัก (คะแนนที่ได้ / คะแนนเต็มสูงสุด) * 100
        setActivities([
          { name: "กิจกรรมเคลื่อนไหวและจังหวะ", percentage: actTotals["moving"].count > 0 ? (actTotals["moving"].sum / (actTotals["moving"].count * 3)) * 100 : 0 },
          { name: "กิจกรรมเสริมประสบการณ์", percentage: actTotals["experience"].count > 0 ? (actTotals["experience"].sum / (actTotals["experience"].count * 3)) * 100 : 0 },
          { name: "กิจกรรมสร้างสรรค์", percentage: actTotals["creative"].count > 0 ? (actTotals["creative"].sum / (actTotals["creative"].count * 3)) * 100 : 0 },
          { name: "กิจกรรมเสรี", percentage: actTotals["free"].count > 0 ? (actTotals["free"].sum / (actTotals["free"].count * 3)) * 100 : 0 },
          { name: "กิจกรรมกลางแจ้ง", percentage: actTotals["outdoor"].count > 0 ? (actTotals["outdoor"].sum / (actTotals["outdoor"].count * 3)) * 100 : 0 },
          { name: "กิจกรรมเกมการศึกษา", percentage: actTotals["game"].count > 0 ? (actTotals["game"].sum / (actTotals["game"].count * 3)) * 100 : 0 },
        ]);

        // สรุปสัดส่วนตามกลุ่มคุณภาพ
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
    }

    fetchAndCalculateReport();
  }, [week, center, room]);

  // 🔍 กรองรายชื่อเด็กจากช่องเสิร์ชค้นหาบนหน้าจอ
  const filteredRows = studentRows.filter(row => 
    row.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    row.quality.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-20">
        <div className="w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-indigo-600 font-bold animate-pulse">กำลังสแกนสารสนเทศข้อมูลเด็กรายบุคคล... ฮ้าาาา</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0">
      
      {/* 🛠️ แถบเครื่องมือ แผงควบคุมหน้าจอ (ซ่อนเวลาสั่งปริ้น) */}
      <div className="max-w-6xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center print:hidden bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">🔍 ค้นหาหัวข้อคุณภาพ หรือชื่อเด็กนักเรียน</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="พิมพ์ชื่อเด็ก หรือเกณฑ์ผลลัพธ์เพื่อกรองข้อมูล..."
            className="w-full text-sm border border-slate-300 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">👩‍🏫 ชื่อครูผู้บันทึก/ผู้รายงานผลการประเมิน</label>
          <input
            type="text"
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            placeholder="พิมพ์ชื่อ-นามสกุลของคุณครู..."
            className="w-full text-sm border border-slate-300 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
        </div>
        <div className="text-right pt-4 md:pt-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full md:w-auto bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            🖨️ สั่งพิมพ์ใบรายงานนี้ (Print / PDF)
          </button>
        </div>
      </div>

      {/* 📄 ฟอร์มเอกสารใบรายงานตัวจริง */}
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/60 p-8 print:shadow-none print:border-none print:p-0">
        
        {/* ส่วนหัวกระดาษตราข้าราชการ */}
        <div className="text-center border-b-2 border-slate-100 pb-6 mb-8">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">📊 สรุปรายงานภาพรวมผลการประเมินหลังการจัดประสบการณ์</h2>
          <p className="text-slate-500 font-bold mt-2 text-md">{getCenterFullName(center)} — ชั้นเรียน: {getRoomFullName(room)}</p>
          <div className="mt-3 inline-flex flex-wrap gap-4 justify-center bg-indigo-50 text-indigo-800 px-4 py-1.5 rounded-full text-sm font-semibold print:bg-slate-100 print:text-black">
            <span>📅 สัปดาห์ที่: {week}</span>
            <span>🎯 หน่วยการเรียนรู้หลัก: {unitName}</span>
            <span>👶 จำนวนที่ประเมินผ่านระบบ: {studentRows.length} คน</span>
          </div>
        </div>

        {studentRows.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-semibold">❌ ไม่พบประวัติการบันทึกคะแนนในกลุ่มเด็กประจำศูนย์และห้องนี้ในฐานข้อมูลครับเพื่อน</div>
        ) : (
          <div className="space-y-8">
            
            {/* ก้อนสถิติหลักแบบสลับตารางไขว้ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* ซ้าย: ตารางค่าเฉลี่ย 6 กิจกรรมหลัก */}
              <div className="lg:col-span-7">
                <h3 className="text-md font-bold text-slate-700 mb-3">📈 ค่าเฉลี่ยร้อยละจำแนกตามกิจกรรมหลัก (6 กิจกรรมกลุ่ม)</h3>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-white text-sm">
                        <th className="p-3 font-semibold">กิจกรรมประสบการณ์ประจำวัน</th>
                        <th className="p-3 text-center font-semibold w-32">ร้อยละเฉลี่ย</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {activities.map((act, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/40">
                          <td className="p-3 font-medium text-slate-700">{act.name}</td>
                          <td className="p-3 text-center font-bold text-indigo-600 bg-indigo-50/20">
                            {act.percentage.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ขวา: การกระจายตัวตามเกณฑ์สรุปรวม */}
              <div className="lg:col-span-5 space-y-3">
                <h3 className="text-md font-bold text-slate-700 mb-3">🏆 จำนวนสรุปคัดแยกตามเกณฑ์ระดับคุณภาพรวม</h3>
                {qualitySummary.map((q, idx) => (
                  <div key={idx} className={`p-3.5 rounded-2xl border ${q.border} ${q.lightBg} flex items-center justify-between`}>
                    <div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold text-white mb-1 ${q.bg}`}>
                        ระดับ {q.label}
                      </span>
                      <div className="text-xl font-black text-slate-800">
                        {q.count} <span className="text-xs font-normal text-slate-500">คน</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">คิดเป็นร้อยละ</span>
                      <span className={`text-xl font-black ${q.text}`}>{q.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* 📋 ส่วนที่เพิ่มมาใหม่: ตารางแจกแจงคะแนนและระดับคุณภาพรายบุคคล */}
            <div className="mt-4">
              <h3 className="text-md font-bold text-slate-700 mb-3 flex items-center justify-between">
                <span>👶 สรุปบัญชีรายชื่อผลการประเมินรายบุคคลประจำชั้นเรียน</span>
                {searchTerm && <span className="text-xs font-normal text-indigo-600 print:hidden">🔍 กำลังกรองข้อมูลแสดงผลเฉพาะคำค้นหา</span>}
              </h3>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="p-3 text-center w-12">ลำดับ</th>
                      <th className="p-3">ชื่อ - นามสกุลนักเรียน</th>
                      <th className="p-3 text-center w-36">จำนวนช่องที่ประเมิน</th>
                      <th className="p-3 text-center w-28">คะแนนเฉลี่ย (เต็ม 3)</th>
                      <th className="p-3 text-center w-36">สรุประดับคุณภาพ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">❌ ไม่พบรายชื่อเด็กนักเรียนที่ตรงกับคำค้นหาของคุณครูครับเพื่อน</td>
                      </tr>
                    ) : (
                      filteredRows.map((row, index) => (
                        <tr key={row.id} className="hover:bg-slate-50/50">
                          <td className="p-3 text-center font-semibold text-slate-400">{index + 1}</td>
                          <td className="p-3 font-bold text-slate-800">
                            {row.fullName} <span className="text-indigo-500 font-normal ml-1">{row.nickname}</span>
                          </td>
                          <td className="p-3 text-center text-slate-500 font-medium">{row.evaluatedCount} รายการ</td>
                          <td className="p-3 text-center font-black text-slate-800">
                            {row.evaluatedCount > 0 ? row.averageScore.toFixed(2) : "-"}
                          </td>
                          <td className="p-3 text-center">
                            {row.evaluatedCount === 0 ? (
                              <span className="text-slate-400 font-medium text-xs">ยังไม่ได้บันทึกผล</span>
                            ) : (
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
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

            {/* ส่วนลงนามท้ายรายงานสำหรับส่งเทศบาลเมืองท่าบ่อ */}
            <div className="mt-12 pt-6 border-t border-dashed border-slate-200 grid grid-cols-1 md:grid-cols-2 text-center">
              <div className="hidden print:block text-left text-xs text-slate-400 self-end">
                * พิมพ์เอกสารสรุปผลอัตโนมัติผ่านระบบริหารจัดการสารสนเทศปฐมวัย
              </div>
              <div className="justify-self-center md:justify-self-end w-64">
                <div className="w-48 border-b border-slate-400 mx-auto mt-8 mb-2"></div>
                <p className="text-sm font-bold text-slate-700">
                  ( ลงชื่อ ) {teacherName ? teacherName : "........................................................"} ผู้รายงาน
                </p>
                <p className="text-xs text-slate-500 mt-1">ตำแหน่ง ครูผู้ดูแลเด็กประจำศูนย์พัฒนาเด็กเล็ก</p>
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
        <p className="text-indigo-600 font-bold">กำลังเปิดหน้าต่างโมดูลสรุปรายงานผล...</p>
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}