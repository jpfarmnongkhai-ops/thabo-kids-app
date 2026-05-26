"use client";
// AssessmentTableExcel.tsx
export default function AssessmentTableExcel({ students, activities, scores, onSaveScore }: any) {
  return (
    // ให้ div อยู่ชั้นนอกสุดเพียงชั้นเดียว
    <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="p-4 bg-slate-50 border-b font-bold text-slate-700 text-center">
        {activities?.[0]?.unit_name ? `หน่วยการเรียนรู้: ${activities[0].unit_name}` : "กำลังโหลดข้อมูลหน่วย..."}
      </div>
      <table className="w-full text-xs border-collapse">
        {/* ห้ามมี div แทรกระหว่าง table กับ thead */}
        <thead className="bg-slate-800 text-white">
          <tr>
            <th rowSpan={2} className="p-0.5 border w-12 ">ลำดับ</th>
            <th rowSpan={2} className="p-4 border w-40">ชื่อ-นามสกุล</th>
            {activities.map((act: any) => (
              <th 
  key={act.name} 
  colSpan={act.subItems?.length || 1} // เพิ่ม ?. และค่า default กรณีเป็น undefined
  className="p-3 border text-center bg-slate-700"
>
  {act.name}
</th>
            ))}
          </tr>
          <tr>
            {activities.flatMap((act: any) => 
  (act.subItems || []).map((sub: any) => ( // เพิ่ม (act.subItems || []) เพื่อความปลอดภัย
    <th key={sub.id} className="p-2 border text-center font-normal min-w-[80px]">
      {sub.label}
    </th>
  ))
)}
          </tr>
        </thead>
        {/* ห้ามมี div แทรกระหว่าง table กับ tbody */}
       <tbody>
  {students.map((std: any, i: number) => {
    // 1. สร้างตัวแปรคำนำหน้าก่อน render แถว
    const prefix = std.gender_code === "01" ? "ด.ช." : std.gender_code === "02" ? "ด.ญ." : "";
    
    return (
      <tr key={std.id} className="border-b hover:bg-slate-50">
        <td className="p-1 font-bold border w-12 text-center ">{i + 1}</td>
        
        {/* 2. ใช้ตัวแปร prefix แทน std.prefix ที่เป็นค่าว่าง */}
        <td className="p-1 font-bold border whitespace-nowrap w-40">
          {prefix} {std.first_name} {std.last_name}
        </td>

        {activities.flatMap((act: any) => 
          act.subItems.map((sub: any) => (
            <td key={sub.id} className="p-2 border text-center">
              <div className="flex justify-center gap-1">
                {[1, 2, 3].map(v => (
                  <button 
                    key={v} 
                    onClick={() => onSaveScore(std.id, sub.id, v)} 
                    className="w-6 h-6 rounded-full bg-slate-100"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </td>
          ))
        )}
      </tr>
    );
  })}
</tbody>
      </table>
    </div>
  );
}