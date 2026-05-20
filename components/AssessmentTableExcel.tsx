"use client";
import { useState } from "react";

// สมมติโครงสร้างข้อมูลหัวข้อกิจกรรมย่อยจาก Excel วันที่ 1 ของเพื่อนรัก
const mainActivities = [
  {
    name: "กิจกรรมเคลื่อนไหวและจังหวะ",
    color: "bg-[#D9F3FF] text-blue-800", // สีฟ้าพาสเทล
    subItems: [
      { id: "m1", label: "เคลื่อนไหวร่างกายตามอิสระได้" },
      { id: "m2", label: "ทำท่าทางประกอบเพลงได้" },
      { id: "m3", label: "เคลื่อนไหวประกอบเพลงได้" }
    ]
  },
  {
    name: "กิจกรรมเสริมประสบการณ์",
    color: "bg-[#FFF4B5] text-yellow-800", // สีเหลืองพาสเทล
    subItems: [
      { id: "e1", label: "ร่วมแสดงความคิดเห็น" },
      { id: "e2", label: "บอกชื่ออุปกรณ์การล้างหน้าได้" },
      { id: "e3", label: "หยิบบัตรพยัญชนะ ง ได้" }
    ]
  },
  {
    name: "กิจกรรมสร้างสรรค์",
    color: "bg-[#FFE4F2] text-pink-800", // สีชมพูพาสเทล
    subItems: [
      { id: "c1", label: "ระบายสีรูปแปรงสีฟันด้วยสีเทียนได้" },
      { id: "c2", label: "ร่วมกิจกรรมกับผู้อื่นได้" },
      { id: "c3", label: "ทำความสะอาดร่างกายหลังทำกิจกรรมได้" }
    ]
  }
];

export default function AssessmentTableExcel({ students, scores, onSaveScore }: any) {
  return (
    <div className="w-full bg-white rounded-[2.5rem] shadow-xl border-4 border-white overflow-hidden">
      {/* 📐 กล่อง scroll แนวนอนแบบตาราง Excel */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full border-collapse table-fixed">
          <thead>
            {/* Header แถวที่ 1: กิจกรรมหลัก (ผสานเซลล์ยาว ๆ) */}
            <tr className="bg-slate-100 text-xs font-black">
              <th className="sticky left-0 bg-slate-100 z-30 p-4 border-b-2 border-r-2 w-[50px] text-center">เลขที่</th>
              <th className="sticky left-50 bg-slate-100 z-30 p-4 border-b-2 border-r-2 w-[180px]">ชื่อ-สกุล นักเรียน</th>
              {mainActivities.map((act, i) => (
                <th 
                  key={i} 
                  colSpan={act.subItems.length} 
                  className={`p-3 text-center border-b-2 border-r-2 ${act.color} text-[11px] tracking-tight`}
                >
                  {act.name}
                </th>
              ))}
            </tr>
            
            {/* Header แถวที่ 2: หัวข้อย่อยแนวตั้ง/เอียง หรือข้อความสั้นหมุนองศา */}
            <tr className="bg-[#F8F9FA] text-[10px] font-bold text-slate-500">
              <th className="sticky left-0 bg-[#F8F9FA] border-b-2 border-r-2 z-30"></th>
              <th className="sticky left-50 bg-[#F8F9FA] border-b-2 border-r-2 z-30"></th>
              {mainActivities.flatMap(act => act.subItems).map((sub) => (
                <th key={sub.id} className="p-2 border-b-2 border-r-2 w-[90px] text-center align-top h-24">
                  <div className="line-clamp-4 hover:line-clamp-none transition-all cursor-help" title={sub.label}>
                    {sub.label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body: รายชื่อเด็กและช่องคะแนน */}
          <tbody className="divide-y divide-slate-100 text-xs font-sans">
            {students.map((std: any, index: number) => (
              <tr key={std.id} className="hover:bg-slate-50/60 transition-colors">
                {/* เลขที่ */}
                <td className="sticky left-0 bg-white font-bold text-slate-400 text-center border-r-2 z-10 p-3">
                  {index + 1}
                </td>
                
                {/* ชื่อเด็ก (ตรึงไว้ด้านซ้ายไม่ให้เลื่อนตามแถว) */}
                <td className="sticky left-12 bg-white font-black text-slate-700 border-r-2 z-10 p-3 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                  <div className="truncate w-[160px]">
                    {std.first_name} {std.last_name}
                  </div>
                </td>

                {/* วนลูปสร้างช่องคะแนนตามตัวชี้วัดย่อยทั้งหมด */}
                {mainActivities.flatMap(act => act.subItems).map((sub) => {
                  const currentScore = scores[std.id]?.[sub.id] || "";
                  
                  // กำหนดสีของคะแนนพาสเทลแจ่ม ๆ 
                  let scoreBg = "bg-slate-50 text-slate-400";
                  if (currentScore === 3) scoreBg = "bg-[#B7E5B4] text-green-800 font-black"; // ดี
                  if (currentScore === 2) scoreBg = "bg-[#FFF4B5] text-yellow-800 font-black"; // พอใช้
                  if (currentScore === 1) scoreBg = "bg-[#F5B7D9] text-pink-800 font-black"; // ควรส่งเสริม

                  return (
                    <td key={sub.id} className="p-1 border-r border-b border-slate-100 text-center">
                      {/* ปุ่มจิ้มคะแนนวนลูป สะดวก รวดเร็ว สวยงาม */}
                      <button
                        type="button"
                        onClick={() => {
                          // ลอจิกกดเปลี่ยนคะแนน: ว่าง -> 3 -> 2 -> 1 -> ว่าง
                          let nextScore: any = "";
                          if (!currentScore) nextScore = 3;
                          else if (currentScore === 3) nextScore = 2;
                          else if (currentScore === 2) nextScore = 1;
                          onSaveScore(std.id, sub.id, nextScore);
                        }}
                        className={`w-full h-9 rounded-xl border border-transparent transition-all active:scale-90 flex items-center justify-center text-sm ${scoreBg}`}
                      >
                        {currentScore || "-"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}