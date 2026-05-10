"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from "recharts";
import Link from "next/link";

export default function DirectorUnifiedDashboard() {
  const [stats, setStats] = useState({ total: 0, boys: 0, girls: 0 });
  const [reportData, setReportData] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  
  const [profile, setProfile] = useState({ 
    name: "นางภรธิดา สุขสวัสดิ์", 
    role: "ผู้อำนวยการกองการศึกษา เทศบาลเมืองท่าบ่อ", 
    imageUrl: "" 
  });

  const rainbowPalette = ["#FFB7B2", "#FFDAC1", "#E2F0CB", "#B5EAD7", "#C7CEEA", "#E0BBE4"];

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getCenterFullName = (id: string) => {
    const names: any = { 
      "01": "ศูนย์ 1 ท่าเสด็จ", 
      "11": "ศูนย์ 1 ท่าเสด็จ(เพิ่มเติม)", 
      "02": "ศูนย์ 2 บ้านน้ำโมง", 
      "12": "ศูนย์ 2 บ้านน้ำโมง" 
    };
    return names[id] || `ศูนย์รหัส ${id}`;
  };

  const getRoomFullName = (roomId: string) => {
    const rooms: any = { 
      "11": "เด็กเล็ก 1/1", 
      "12": "เด็กเล็ก 1/2", 
      "21": "อนุบาล 1/1", 
      "22": "อนุบาล 1/2" 
    };
    return rooms[roomId] || `ห้อง ${roomId}`;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. ดึงข้อมูลนักเรียน
      const { data: students, error: studentError } = await supabase
        .from("students")
        .select("*");

      if (studentError) throw studentError;

      // 2. ดึงข้อมูลครู
      const { data: teacherList } = await supabase.from("teachers").select("*");
      if (teacherList) setTeachers(teacherList);

      if (students) {
        // --- ส่วนประมวลผลข้อมูลสำหรับกราฟและตาราง ---
        const grouped = students.reduce((acc: any, std: any) => {
          const key = `${std.center_id}-${std.room_number}`;
          if (!acc[key]) {
            acc[key] = {
              centerName: getCenterFullName(std.center_id),
              roomName: getRoomFullName(std.room_number),
              ชาย: 0,
              หญิง: 0,
              รวม: 0
            };
          }
          
          const gender = String(std.gender_code).trim();
          if (gender === "01") acc[key].ชาย += 1;
          else if (gender === "02") acc[key].หญิง += 1;
          
          acc[key].รวม += 1;
          return acc;
        }, {});

        setReportData(Object.values(grouped));

        setStats({
          total: students.length,
          boys: students.filter(s => String(s.gender_code).trim() === "01").length,
          girls: students.filter(s => String(s.gender_code).trim() === "02").length,
        });
      }
    } catch (error) {
      console.error("Fetch Data Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const centerTotals = reportData.reduce((acc: any, curr: any) => {
    acc[curr.centerName] = (acc[curr.centerName] || 0) + curr.รวม;
    return acc;
  }, {});

  if (!mounted) return <div className="min-h-screen bg-[#FDFCF0]" />;

  return (
    <div className="min-h-screen bg-[#FDFCF0] pb-24 font-sans text-slate-900 overflow-x-hidden">
      {/* --- HEADER --- */}
      <div className="bg-white shadow-xl border-b-8 border-[#C7CEEA] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
              <Link href="/" className="p-3 bg-slate-100 rounded-full hover:bg-[#FFDAC1] transition-colors shadow-inner">
                🏠
              </Link>
              <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-tr from-[#FFB7B2] to-[#C7CEEA] p-1 shadow-lg">
                <div className="w-full h-full bg-white rounded-[1.8rem] md:rounded-[2.2rem] overflow-hidden flex items-center justify-center">
                  {profile.imageUrl ? <img src={profile.imageUrl} className="w-full h-full object-cover"/> : <span className="text-3xl md:text-4xl">👨‍💼</span>}
                </div>
              </div>
              <div>
                <h2 className="text-[10px] md:text-sm font-black text-[#8A6DBE] uppercase tracking-widest mb-1">Tha Bo Municipality Child Development Center</h2>
                <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">{profile.name}</h1>
                <p className="text-sm md:text-lg font-bold text-slate-500">{profile.role}</p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                  <Link href="/teachers" className="px-4 py-1.5 bg-[#C7CEEA] text-[#4A5568] text-[10px] font-black rounded-xl shadow-md hover:brightness-95 transition-all">👨‍🏫 รายชื่อคณะครู</Link>
                  <button className="px-4 py-1.5 bg-[#FFB7B2] text-[#942A24] text-[10px] font-black rounded-xl shadow-md hover:brightness-95 transition-all">📄 EXPORT PDF</button>
                  <button className="px-4 py-1.5 bg-[#B5EAD7] text-[#2D5A47] text-[10px] font-black rounded-xl shadow-md hover:brightness-95 transition-all">📊 EXCEL</button>
                </div>
              </div>
            </div>
            <div className="w-full md:w-auto bg-slate-900 text-white px-6 md:px-10 py-4 md:py-6 rounded-[2rem] md:rounded-[3rem] shadow-2xl border-b-8 border-[#FFDAC1] text-center">
               <p className="text-2xl md:text-4xl font-mono font-black text-[#FFDAC1]">
                 {currentTime.toLocaleTimeString('th-TH')}
               </p>
               <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-1 md:mt-2 uppercase tracking-widest leading-none">
                 {currentTime.toLocaleDateString('th-TH', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
               </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8 md:mt-12 space-y-8 md:space-y-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <StatCard title="นักเรียนรวม" value={stats.total} bg="#FFB7B2" textColor="#942A24" />
          <StatCard title="เด็กชาย" value={stats.boys} bg="#FFDAC1" textColor="#965D2E" />
          <StatCard title="เด็กหญิง" value={stats.girls} bg="#E2F0CB" textColor="#4F632E" />
          <StatCard title="คณะครู" value={teachers.length} bg="#B5EAD7" textColor="#2D5A47" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
          <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl border-4 border-white relative">
            <div className="absolute top-0 left-0 w-full h-3 md:h-4 bg-[#B5EAD7]"></div>
            <h3 className="text-lg md:text-xl font-black text-slate-800 mb-6 flex items-center gap-2">📊 สถิติรายห้องเรียน</h3>
            <div className="h-[250px] md:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="roomName" tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip contentStyle={{borderRadius: '15px', border: 'none'}} />
                  <Bar name="ชาย" dataKey="ชาย" fill="#C7CEEA" radius={[5, 5, 0, 0]} />
                  <Bar name="หญิง" dataKey="หญิง" fill="#FFB7B2" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl border-4 border-white relative">
            <div className="absolute top-0 left-0 w-full h-3 md:h-4 bg-[#FFDAC1]"></div>
            <h3 className="text-lg md:text-xl font-black text-slate-800 mb-6">🍰 สัดส่วนเพศรวม</h3>
            <div className="h-[250px] md:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{name: 'ชาย', value: stats.boys}, {name: 'หญิง', value: stats.girls}]} innerRadius="60%" outerRadius="80%" paddingAngle={8} dataKey="value">
                    <Cell fill="#C7CEEA" />
                    <Cell fill="#FFB7B2" />
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* --- TABLE --- */}
        <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] shadow-2xl overflow-hidden border-4 md:border-8 border-white">
          <div className="p-6 md:p-10 bg-slate-900 text-white flex justify-between items-center border-b-4 border-[#E0BBE4]">
            <h2 className="text-sm md:text-2xl font-black uppercase">วิเคราะห์ข้อมูลรายศูนย์ฯ</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="bg-[#F8FAFC] text-[10px] md:text-[14px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="p-6 md:p-10">ศูนย์พัฒนาเด็กเล็ก</th>
                  <th className="p-6 md:p-10">ระดับห้อง</th>
                  <th className="p-6 md:p-10 text-center">ชาย</th>
                  <th className="p-6 md:p-10 text-center">หญิง</th>
                  <th className="p-6 md:p-10 text-center bg-[#FDFCF0]">รวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                {reportData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-all">
                    <td className="p-6 md:p-10 text-sm md:text-lg text-slate-900 font-black border-l-4" style={{borderColor: rainbowPalette[idx % rainbowPalette.length]}}>{item.centerName}</td>
                    <td className="p-6 md:p-10 text-xs md:text-slate-500">{item.roomName}</td>
                    <td className="p-6 md:p-10 text-center text-xl text-blue-600 font-black">{item.ชาย}</td>
                    <td className="p-6 md:p-10 text-center text-xl text-pink-600 font-black">{item.หญิง}</td>
                    <td className="p-6 md:p-10 text-center text-2xl font-black bg-[#FDFCF0] text-slate-900">{item.รวม}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-black">
                <tr>
                  <td colSpan={5} className="p-6 md:p-10 border-t-4 border-[#E0BBE4]">
                    <div className="grid grid-cols-2 md:flex md:justify-center gap-4 md:gap-12">
                      {Object.entries(centerTotals).map(([name, total]) => (
                        <div key={name} className="flex flex-col items-center">
                          <span className="text-[#FFDAC1] text-[14px] uppercase tracking-widest">{name}</span>
                          <span className="text-xl">{total as number} คน</span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
                <tr className="bg-black">
                  <td colSpan={2} className="p-6 md:p-10 text-sm md:text-2xl font-black text-[#E2F0CB]">สรุปยอดสุทธิ</td>
                  <td className="p-6 md:p-10 text-center text-[#C7CEEA] text-lg md:text-3xl">{stats.boys} ชาย</td>
                  <td className="p-6 md:p-10 text-center text-[#FFB7B2] text-lg md:text-3xl">{stats.girls} หญิง</td>
                  <td className="p-6 md:p-10 text-center text-[#FFDAC1] text-3xl md:text-5xl bg-[#1A1A1A]">{stats.total}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, bg, textColor }: any) {
  return (
    <div className="p-6 md:p-10 rounded-[2rem] md:rounded-[3.5rem] shadow-xl flex flex-col items-center justify-center transition-transform active:scale-95" style={{ backgroundColor: bg }}>
      <p className="text-[9px] md:text-[11px] font-black uppercase tracking-widest mb-2 opacity-70" style={{ color: textColor }}>{title}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl md:text-6xl font-black tracking-tighter" style={{ color: textColor }}>{value}</span>
        <span className="text-[10px] md:text-lg font-bold opacity-60" style={{ color: textColor }}>คน</span>
      </div>
    </div>
  );
}