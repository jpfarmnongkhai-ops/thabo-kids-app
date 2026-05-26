"use client";
import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface Student {
  student_id: string; 
  student_id_10: string;
  first_name: string;
  last_name: string;
  nickname?: string;
}

interface ActivityItem {
  id: string;
  label: string;
}

interface ActivityGroup {
  name: string;
  color: string;
  subItems: ActivityItem[];
}

interface AssessmentDashboardChartsProps {
  students: Student[];
  activities: ActivityGroup[];
  scores: { [studentId: string]: { [itemId: string]: number } };
}

export default function AssessmentDashboardCharts({
  students,
  activities,
  scores
}: AssessmentDashboardChartsProps) {
  
  const stats = useMemo(() => {
    if (students.length === 0 || activities.length === 0) {
      return { barData: [], pieData: [], totalAvg: 0, goodCount: 0, fairCount: 0, improveCount: 0 };
    }

    // --- 1. คำนวณร้อยละคะแนนเฉลี่ยแยกตาม 6 กิจกรรมหลัก (สำหรับกราฟแท่ง) ---
    const barData = activities.map((group) => {
      let totalPointsEarned = 0;
      let totalMaxPossiblePoints = 0;

      group.subItems.forEach((item) => {
        students.forEach((student) => {
          const score = scores[student.student_id]?.[item.id]; 
          if (score !== undefined && score !== null && score !== "") {
            totalPointsEarned += Number(score);
            totalMaxPossiblePoints += 3; 
          }
        });
      });

      const percentage = totalMaxPossiblePoints > 0 
        ? parseFloat(((totalPointsEarned / totalMaxPossiblePoints) * 100).toFixed(2))
        : 0;

      return {
        name: group.name.replace("กิจกรรม", ""), 
        "ร้อยละคะแนนเฉลี่ย": percentage,
        fillColor: group.name.includes("เคลื่อนไหว") ? "#3B82F6" :
                   group.name.includes("ประสบการณ์") ? "#F59E0B" :
                   group.name.includes("สร้างสรรค์") ? "#EC4899" :
                   group.name.includes("เสรี") ? "#8B5CF6" :
                   group.name.includes("กลางแจ้ง") ? "#10B981" : "#F97316"
      };
    });

    // --- 2. คำนวณระดับคุณภาพเด็กรายบุคคล (สำหรับกราฟวงกลม) ---
    let goodCount = 0;
    let fairCount = 0;
    let improveCount = 0;
    let sumOfAllAverages = 0;
    let activeStudentCount = 0;

    students.forEach((student) => {
      let studentSum = 0;
      let studentItemsCount = 0;
      const studentScores = scores[student.student_id] || {};

      activities.forEach((group) => {
        group.subItems.forEach((item) => {
          const score = studentScores[item.id];
          if (score !== undefined && score !== null && score !== "") {
            studentSum += Number(score);
            studentItemsCount++;
          }
        });
      });

      if (studentItemsCount > 0) {
        const studentAvg = studentSum / studentItemsCount;
        sumOfAllAverages += studentAvg;
        activeStudentCount++;

        if (studentAvg >= 2.5) {
          goodCount++;
        } else if (studentAvg >= 1.5) {
          fairCount++;
        } else {
          improveCount++;
        }
      }
    });

    const totalCount = goodCount + fairCount + improveCount;
    const pieData = [
      { name: "ดี (3)", value: goodCount, percentage: totalCount > 0 ? parseFloat(((goodCount / totalCount) * 100).toFixed(1)) : 0, color: "#4ADE80" },
      { name: "พอใช้ (2)", value: fairCount, percentage: totalCount > 0 ? parseFloat(((fairCount / totalCount) * 100).toFixed(1)) : 0, color: "#FBBF24" },
      { name: "ควรส่งเสริม (1)", value: improveCount, percentage: totalCount > 0 ? parseFloat(((improveCount / totalCount) * 100).toFixed(1)) : 0, color: "#F87171" }
    ];

    const totalAvg = activeStudentCount > 0 ? (sumOfAllAverages / activeStudentCount) : 0;

    return { barData, pieData, totalAvg, goodCount, fairCount, improveCount };
  }, [students, activities, scores]);

  if (students.length === 0 || activities.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border-2 border-slate-100 text-center text-slate-400 font-bold mt-6">
        📊 กรุณาอัปโหลดไฟล์แผนการสอนหรือบันทึกคะแนนเพื่อประมวลผลกราฟสถิติ ก1 - ก5 ครับเพื่อนรัก
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 mt-8 no-print">
      
      {/* 🎯 ส่วนที่ 1: คาร์ดตัวเลขสรุปภาพรวม */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border shadow-sm flex flex-col justify-center items-center text-center">
          <span className="text-[10px] font-black text-slate-400 tracking-wider block uppercase">นักเรียนทั้งหมด</span>
          <span className="text-3xl font-black text-slate-700 mt-1">{students.length} <span className="text-sm font-bold text-slate-400">คน</span></span>
        </div>
        <div className="bg-[#E8F6EF] p-5 rounded-3xl border border-green-100 flex flex-col justify-center items-center text-center">
          <span className="text-[10px] font-black text-green-600 tracking-wider block uppercase">ระดับดี</span>
          <span className="text-3xl font-black text-green-600 mt-1">{stats.goodCount} <span className="text-sm font-bold text-green-400">คน</span></span>
        </div>
        <div className="bg-[#FFF9E6] p-5 rounded-3xl border border-yellow-100 flex flex-col justify-center items-center text-center">
          <span className="text-[10px] font-black text-yellow-600 tracking-wider block uppercase">ระดับพอใช้</span>
          <span className="text-3xl font-black text-yellow-600 mt-1">{stats.fairCount} <span className="text-sm font-bold text-yellow-400">คน</span></span>
        </div>
        <div className="bg-[#FDF2F2] p-5 rounded-3xl border border-red-100 flex flex-col justify-center items-center text-center">
          <span className="text-[10px] font-black text-red-500 tracking-wider block uppercase">ควรส่งเสริม</span>
          <span className="text-3xl font-black text-red-500 mt-1">{stats.improveCount} <span className="text-sm font-bold text-red-300">คน</span></span>
        </div>
      </div>

      {/* 📊 ส่วนที่ 2: เลย์เอาต์แสดงกราฟวิเคราะห์คะแนนแบบเคียงข้างกัน */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm lg:col-span-2 flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-black text-slate-700">📊 ผลการจัดกิจกรรมการเรียนรู้แยกตาม 6 กิจกรรมหลัก</h3>
            <p className="text-[10px] text-slate-400 font-bold">สรุปผลร้อยละของคะแนนเฉลี่ยที่ได้จากแผนจัดประสบการณ์</p>
          </div>
          <div className="w-full h-80 flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.barData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 11, fontWeight: 'bold' }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'ร้อยละคะแนนเฉลี่ย']}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="ร้อยละคะแนนเฉลี่ย" radius={[10, 10, 0, 0]} barSize={35}>
                  {stats.barData.map((entry: any, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fillColor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-700">⭕ สัดส่วนระดับคุณภาพนักเรียน</h3>
            <p className="text-[10px] text-slate-400 font-bold">คิดเปรียบเทียบเป็นสัดส่วนร้อยละรวมทั้งห้องเรียน</p>
          </div>
          
          <div className="w-full h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props: any) => [`${value} คน (${props.payload.percentage}%)`, name]} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* 🎯 ปรับปรุงตรงกลางโดนัทให้โชว์เป็นคะแนนเฉลี่ยรวมของทั้งห้องอย่างเป็นทางการ */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-700">
                {stats.totalAvg.toFixed(2)}
              </span>
              <span className="text-[9px] font-bold text-slate-400">คะแนนเฉลี่ยรวม</span>
            </div>
          </div>

          <div className="space-y-1.5 border-t pt-4">
            {stats.pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-bold text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <span className="text-slate-400">{item.value} คน ({item.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}