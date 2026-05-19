"use client";

interface Student {
  student_id_10: string;
  first_name: string;
  last_name: string;
  nickname: string;
  gender_code: string;
}

interface AttendanceTableProps {
  students: Student[];
  attendance: { [key: string]: string };
  onCheck: (studentId: string, status: string) => void;
}

export default function AttendanceTable({ students, attendance, onCheck }: AttendanceTableProps) {
  
  // 🎨 ข้อมูลปุ่มสถานะพร้อมโค้ดสีพาสเทล
  const statusConfig = [
    { key: "present", label: "มา", activeStyle: "bg-[#B7E5B4] text-green-800 border-green-400 font-black", normalStyle: "bg-slate-50 text-slate-400 hover:bg-green-50" },
    { key: "late", label: "สาย", activeStyle: "bg-[#FFF4B5] text-yellow-800 border-yellow-400 font-black", normalStyle: "bg-slate-50 text-slate-400 hover:bg-yellow-50" },
    { key: "leave", label: "ลา", activeStyle: "bg-[#B2D7F5] text-blue-800 border-blue-400 font-black", normalStyle: "bg-slate-50 text-slate-400 hover:bg-blue-50" },
    { key: "absent", label: "ขาด", activeStyle: "bg-[#F5B7D9] text-pink-800 border-pink-400 font-black", normalStyle: "bg-slate-50 text-slate-400 hover:bg-pink-50" },
  ];

  return (
    <div className="w-full bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border-4 border-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F6F5FB] border-b-2 border-slate-100 text-slate-600 text-xs font-black uppercase tracking-wider">
              <th className="p-4 text-center w-12">ลำดับ</th>
              <th className="p-4">รายชื่อน้อง ๆ</th>
              <th className="p-4 text-center w-64">บันทึกการเข้าเรียน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-sans">
            {students.map((std, index) => {
              const currentStatus = attendance[std.student_id_10];

              return (
                <tr key={std.student_id_10} className="hover:bg-slate-50/50 transition-colors">
                  {/* ลำดับตัวเลข */}
                  <td className="p-4 text-center font-bold text-slate-400">{index + 1}</td>
                  
                  {/* รายชื่อ + นามสกุล + เพศ */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{std.gender_code === "01" ? "👦" : "👧"}</span>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-base leading-tight">
                          น้อง{std.nickname || std.first_name}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                          {std.first_name} {std.last_name}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* แผงปุ่มกดเลือกสถานะในแถวตาราง */}
                  <td className="p-4">
                    <div className="grid grid-cols-4 gap-1.5 bg-slate-100/60 p-1 rounded-2xl border border-slate-200/40">
                      {statusConfig.map((s) => {
                        const isActive = currentStatus === s.key;
                        return (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => onCheck(std.student_id_10, s.key)}
                            className={`py-2 px-1 rounded-xl text-xs text-center font-black border-2 transition-all active:scale-95 ${
                              isActive ? `${s.activeStyle} border-white shadow-sm` : `${s.normalStyle} border-transparent`
                            }`}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}