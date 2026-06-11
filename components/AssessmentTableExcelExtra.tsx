"use client";
import { useEffect } from "react";

export default function AssessmentTableExcel({
  students = [],
  activities = [],
  selectedWeek,
  selectedDay,
  onSaveScore,
  currentSet,
  setCurrentSet = () => {},
}: any) {
  
  useEffect(() => {
    if (activities.length > 0 && (currentSet < 0 || currentSet >= activities.length)) {
      setCurrentSet(0);
    }
  }, [activities, currentSet, setCurrentSet]);

  if (activities.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
        <p className="text-slate-400 font-medium">ยังไม่มีกิจกรรมสำหรับสัปดาห์/วันที่นี้</p>
      </div>
    );
  }

  const safeIndex = (currentSet >= 0 && currentSet < activities.length) ? currentSet : 0;
  const currentActivity = activities[safeIndex];

  const subLabel = 
    currentActivity?.unit_name || 
    currentActivity?.sub_activity || 
    currentActivity?.subSubstance || 
    "ทั่วไป"; // ปรับคำ default ให้ดูเป็นธรรมชาติ

  return (
    // เพิ่ม printable-area เพื่อให้สั่งพิมพ์เฉพาะตารางนี้ได้
    <div className="printable-area overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="p-4 bg-slate-800 text-white text-center font-bold">
        สัปดาห์ที่ {selectedWeek} | วันที่ {selectedDay} | สาระการเรียนรู้ย่อย: {subLabel}
      </div>

      <table className="w-full text-xs border-collapse">
        <thead className="bg-slate-800 text-white">
          <tr>
            <th rowSpan={2} className="p-2 border w-12">ลำดับ</th>
            <th rowSpan={2} className="p-2 border max-w-xs text-left">ชื่อ-นามสกุล</th>

            <th colSpan={currentActivity?.subItems?.length || 1} className="no-print p-2 border text-center bg-slate-700">
              <div className="flex justify-between items-center px-2">
                <button
                  type="button"
                  onClick={() => setCurrentSet((prev: number) => Math.max(0, prev - 1))}
                  disabled={currentSet <= 0}
                  className="p-1 px-2 bg-slate-600 rounded hover:bg-slate-500 disabled:opacity-30 transition text-white"
                >◀</button>
                
                <span className="font-bold text-sm mx-2">
                  {currentActivity?.name || "กำลังโหลด..."} ({currentSet + 1} / {activities.length})
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentSet((prev: number) => Math.min(activities.length - 1, prev + 1))}
                  disabled={currentSet >= activities.length - 1}
                  className="p-1 px-2 bg-slate-600 rounded hover:bg-slate-500 disabled:opacity-30 transition text-white"
                >▶</button>
              </div>
            </th>
          </tr>

          <tr>
            {currentActivity?.subItems?.map((sub: any) => (
              <th key={sub.id} className="p-2 border text-center font-normal min-w-[120px] bg-slate-500 text-white text-[11px] leading-tight">
                {sub.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {students.map((std: any, i: number) => {
            const prefix = std.gender_code === "01" ? "ด.ช." : "ด.ญ.";
            return (
              <tr key={std.id} className="border-b hover:bg-slate-50 transition-colors">
                <td className="p-2 border text-center font-bold text-slate-500">{i + 1}</td>
                
                <td className="p-2 border font-bold text-slate-700 whitespace-nowrap">
                  {prefix} {std.first_name} {std.last_name} 
                  {std.nickname ? <span className="text-pink-500 ml-1 font-normal">({std.nickname})</span> : ''}
                </td>
                
                {currentActivity?.subItems?.map((sub: any) => {
                  const currentScore = std.scores ? std.scores[sub.id] : undefined; 
                  
                  return (
                    <td key={sub.id} className="p-2 border text-center bg-white">
                      {/* เพิ่ม no-print ที่นี่ เพื่อให้ปุ่มไม่แสดงตอนพิมพ์ ถ้าอยากให้แสดงแค่ค่าที่เลือกไว้ */}
                      <div className="no-print flex justify-center gap-1.5">
                        {[1, 2, 3].map(v => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => onSaveScore(std.id, sub.id, v)}
                            className={`w-7 h-7 rounded-full shadow-sm transition-all text-xs font-black border active:scale-90 
                              ${currentScore === v 
                                ? "bg-gradient-to-b from-pink-500 to-rose-500 text-white border-rose-600 scale-110 shadow-md" 
                                : "bg-slate-100 hover:bg-pink-400 hover:text-white text-slate-600 border-slate-200"
                              }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                      
                      {/* เพิ่มส่วนนี้: เพื่อให้ตอนพิมพ์แสดงเฉพาะตัวเลขที่เลือก */}
                      <div className="hidden print:block font-bold text-lg">
                        {currentScore || "-"}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}