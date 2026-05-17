'use client';

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation"; // ✅ ใช้ตัวนี้ดึงค่า Query ใน App Router
import { supabase } from "@/lib/supabase"; // 💡 ปรับ Path ให้ตรงกับโฟลเดอร์ supabase ของเพื่อนนะครับ

export default function AssessmentReportPage() {
  const searchParams = useSearchParams();
  
  // 1. ดึงค่าพารามิเตอร์ที่ส่งมาจากหน้าหลักผ่าน URL
  const week = searchParams.get("week") || "1";
  const center = searchParams.get("center") || "01";
  const room = searchParams.get("room") || "11";

  // 2. States สำหรับเก็บข้อมูลจริง
  const [loading, setLoading] = useState(true);
  const [centerName, setCenterName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [unitName, setUnitName] = useState("กำลังโหลดข้อมูลหน่วยเรียนรู้...");
  const [totalStudents, setTotalStudents] = useState(0);
  
  // สถิติที่เราจะคำนวณจริงจากเบส
  const [activities, setActivities] = useState([
    { name: "กิจกรรมเคลื่อนไหวและจังหวะ", percentage: 0 },
    { name: "กิจกรรมเสริมประสบการณ์", percentage: 0 },
    { name: "กิจกรรมสร้างสรรค์", percentage: 0 },
    { name: "กิจกรรมเสรี", percentage: 0 },
    { name: "กิจกรรมกลางแจ้ง", percentage: 0 },
    { name: "กิจกรรมเกมการศึกษา", percentage: 0 },
  ]);

  const [qualitySummary, setQualitySummary] = useState([
    { label: "ดี (3)", count: 0, percentage: 0, bg: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-200", lightBg: "bg-emerald-50" },
    { label: "พอใช้ (2)", count: 0, percentage: 0, bg: "bg-amber-500", text: "text-amber-700", border: "border-amber-200", lightBg: "bg-amber-50" },
    { label: "ควรส่งเสริม (1)", count: 0, percentage: 0, bg: "bg-red-500", text: "text-red-700", border: "border-red-200", lightBg: "bg-red-50" },
  ]);

  useEffect(() => {
    async function fetchAndCalculateReport() {
      try {
        setLoading(true);

        // --- 🌟 ส่วนที่ 1: แปลงรหัสศูนย์และห้องเรียนเป็นชื่อเต็ม ---
        const centerNames: any = { "01": "ศูนย์พัฒนาเด็กเล็กเทศบาลเมืองท่าบ่อ (ศูนย์ 1 ท่าเสด็จ)", "02": "ศูนย์พัฒนาเด็กเล็กเทศบาลเมืองท่าบ่อ (ศูนย์ 2 บ้านน้ำโมง)" };
        const roomNames: any = { "11": "เด็กเล็ก 1/1", "12": "เด็กเล็ก 1/2", "21": "อนุบาล 1/1", "22": "อนุบาล 1/2" };
        setCenterName(centerNames[center] || `ศูนย์รหัส ${center}`);
        setRoomName(roomNames[room] || `ห้องรหัส ${room}`);

        // --- 🌟 ส่วนที่ 2: ดึงรายชื่อเด็กนักเรียนทั้งหมดในห้องนี้ ---
        const { data: studentsData, error: studentError } = await supabase
          .from("student") // 💡 ตรวจสอบชื่อตารางเด็กนักเรียนใน Supabase ของคุณด้วยนะฮะ
          .select("id")
          .eq("center_id", center)
          .eq("room_number", room);

        if (studentError) throw studentError;
        const studentIds = studentsData?.map(s => s.id) || [];
        setTotalStudents(studentIds.length);

        if (studentIds.length === 0) {
          setLoading(false);
          return;
        }

        // --- 🌟 ส่วนที่ 3: ดึงข้อมูลการประเมินคะแนนจริงของเด็กกลุ่มนี้ประจำสัปดาห์ ---
        // สมมติว่าตารางชื่อ 'assessment' มีคอลัมน์ student_id, week_number, และคะแนนทั้ง 6 กิจกรรม
        const { data: assessments, error: assessError } = await supabase
          .from("assessment") 
          .select("*")
          .eq("week_number", parseInt(week))
          .in("student_id", studentIds);

        if (assessError) throw assessError;

        // ดึงชื่อหน่วยการเรียนรู้จากเรคคอร์ดแรก (ถ้ามีบันทึกไว้)
        if (assessments && assessments.length > 0 && assessments[0].unit_name) {
          setUnitName(assessments[0].unit_name);
        } else {
          setUnitName("ไม่ได้ระบุหน่วยการเรียนรู้");
        }

        // --- 🌟 ส่วนที่ 4: ลูปคำนวณหาค่าร้อยละเฉลี่ยรายกิจกรรม และระดับคุณภาพรวม ---
        let actTotals = [0, 0, 0, 0, 0, 0]; // ตัวแปรเก็บคะแนนรวม 6 กิจกรรม
        let qCount = { good: 0, fair: 0, improve: 0 }; // ตัวนับระดับเกรดคุณครูประเมิน
        const totalRecords = assessments?.length || 0;

        if (totalRecords > 0) {
          assessments.forEach((row: any) => {
            // สมมติคะแนนเต็มแต่ละช่องคือ 3 คะแนน (ปรับสูตรตามเกณฑ์จริงได้เลยครับเพื่อน)
            actTotals[0] += row.act_moving || 0;
            actTotals[1] += row.act_experience || 0;
            actTotals[2] += row.act_creative || 0;
            actTotals[3] += row.act_free || 0;
            actTotals[4] += row.act_outdoor || 0;
            actTotals[5] += row.act_game || 0;

            // คำนวณหาค่าเฉลี่ยของเด็กแต่ละคนเพื่อจัดกลุ่ม ระดับคุณภาพรวม
            const avgScore = (row.act_moving + row.act_experience + row.act_creative + row.act_free + row.act_outdoor + row.act_game) / 6;
            if (avgScore >= 2.5) qCount.good++;
            else if (avgScore >= 1.5) qCount.fair++;
            else qCount.improve++;
          });

          // สรุปค่าร้อยละ (คะแนนที่ได้ / คะแนนเต็มสูงสุดทั้งหมด) * 100
          const maxPossibleScorePerAct = totalRecords * 3; 
          setActivities([
            { name: "กิจกรรมเคลื่อนไหวและจังหวะ", percentage: (actTotals[0] / maxPossibleScorePerAct) * 100 },
            { name: "กิจกรรมเสริมประสบการณ์", percentage: (actTotals[1] / maxPossibleScorePerAct) * 100 },
            { name: "กิจกรรมสร้างสรรค์", percentage: (actTotals[2] / maxPossibleScorePerAct) * 100 },
            { name: "กิจกรรมเสรี", percentage: (actTotals[3] / maxPossibleScorePerAct) * 100 },
            { name: "กิจกรรมกลางแจ้ง", percentage: (actTotals[4] / maxPossibleScorePerAct) * 100 },
            { name: "กิจกรรมเกมการศึกษา", percentage: (actTotals[5] / maxPossibleScorePerAct) * 100 },
          ]);

          // สรุปสัดส่วนระดับคุณภาพ
          setQualitySummary([
            { label: "ดี (3)", count: qCount.good, percentage: Math.round((qCount.good / totalRecords) * 100), bg: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-200", lightBg: "bg-emerald-50" },
            { label: "พอใช้ (2)", count: qCount.fair, percentage: Math.round((qCount.fair / totalRecords) * 100), bg: "bg-amber-500", text: "text-amber-700", border: "border-amber-200", lightBg: "bg-amber-50" },
            { label: "ควรส่งเสริม (1)", count: qCount.improve, percentage: Math.round((qCount.improve / totalRecords) * 100), bg: "bg-red-500", text: "text-red-700", border: "border-red-200", lightBg: "bg-red-50" },
          ]);
        }

      } catch (err) {
        console.error("Error generating report:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAndCalculateReport();
  }, [week, center, room]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-20">
        <div className="w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-indigo-600 font-bold text-lg animate-pulse">กำลังคำนวณสถิติจาก Supabase แบบเรียลไทม์... ฮ้าาาา</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0">
      
      {/* ส่วนควบคุม สั่งพิมพ์รายงาน */}
      <div className="max-w-5xl mx-auto mb-6 flex justify-end items-center print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2"
        >
          🖨️ พิมพ์รายงานผล (Print / PDF)
        </button>
      </div>

      {/* บัตรรายงานหลัก */}
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/60 p-8 print:shadow-none print:border-none print:p-0">
        
        {/* หัวข้อรายงานทางราชการ */}
        <div className="text-center border-b-2 border-slate-100 pb-6 mb-8">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">📊 สรุปรายงานภาพรวมผลการประเมินหลังการจัดประสบการณ์</h2>
          <p className="text-slate-500 font-bold mt-2 text-md">{centerName} - ชั้นเรียน: {roomName}</p>
          <div className="mt-3 inline-flex gap-4 bg-indigo-50 text-indigo-800 px-4 py-1.5 rounded-full text-sm font-semibold print:bg-slate-100 print:text-black">
            <span>📅 ประจำสัปดาห์ที่: {week}</span>
            <span>🎯 หน่วยการเรียนรู้หลัก: {unitName}</span>
            <span>👶 จำนวนเด็กในห้อง: {totalStudents} คน</span>
          </div>
        </div>

        {totalStudents === 0 ? (
          <div className="text-center py-12 text-slate-400 font-semibold">❌ ไม่พบข้อมูลการบันทึกผลการประเมินของชั้นเรียนนี้ในสัปดาห์ดังกล่าว</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* ตารางผลสัมฤทธิ์แยกตาม 6 กิจกรรมหลัก */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-700 mb-4">📈 ค่าเฉลี่ยร้อยละจำแนกตามกิจกรรมหลัก (6 กิจกรรม)</h3>
                <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-white">
                        <th className="p-4 font-semibold">รายการจัดกิจกรรมประสบการณ์ประจำวัน</th>
                        <th className="p-4 text-center font-semibold w-32">ร้อยละเฉลี่ย</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activities.map((act: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-4 font-medium text-slate-700">{act.name}</td>
                          <td className="p-4 text-center font-bold text-indigo-600 bg-indigo-50/30">
                            {act.percentage.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* สรุปสัดส่วนระดับคุณภาพ */}
            <div className="lg:col-span-5 space-y-6">
              <h3 className="text-lg font-bold text-slate-700">🏆 สรุปจำนวนนักเรียนแยกตามเกณฑ์ระดับคุณภาพรวม</h3>
              <div className="space-y-4">
                {qualitySummary.map((q: any, idx: number) => (
                  <div key={idx} className={`p-4 rounded-2xl border ${q.border} ${q.lightBg} flex items-center justify-between`}>
                    <div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold text-white mb-1 ${q.bg}`}>
                        ระดับ {q.label}
                      </span>
                      <div className="text-2xl font-black text-slate-800">
                        {q.count} <span className="text-sm font-normal text-slate-500">คน</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-400 block uppercase">คิดเป็นร้อยละ</span>
                      <span className={`text-2xl font-black ${q.text}`}>{q.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* ส่วนเซ็นชื่อท้ายรายงานสำหรับส่งหน่วยงานเทศบาล */}
              <div className="mt-8 pt-6 border-t border-dashed border-slate-200 text-center hidden print:block">
                <div className="w-48 border-b border-slate-400 mx-auto mt-12 mb-2"></div>
                <p className="text-sm font-semibold text-slate-600">( ลงชื่อ ) ............................................................ ผู้รายงาน</p>
                <p className="text-xs text-slate-400 mt-1">ตำแหน่ง ครูผู้ดูแลเด็กประจำศูนย์พัฒนาเด็กเล็ก</p>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}