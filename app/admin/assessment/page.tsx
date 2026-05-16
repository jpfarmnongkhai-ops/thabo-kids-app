'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'
import ExcelImporter from '@/components/ExcelImporter'

const getCenterFullName = (id: string) => {
  const names: any = { 
    "01": "ศูนย์ 1 ท่าเสด็จ", 
    "11": "ศูนย์ 1 ท่าเสด็จ(เพิ่มเติม)", 
    "02": "ศูนย์ 2 บ้านน้ำโมง"
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

interface Center {
  id: string; 
  name: string;
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  nickname: string;
  center_id: any; 
  room_number: any; 
}

interface Template {
  id: string;
  criteria_label: string;
  activity_type: string;
  unit_name: string;
  week_number?: number;
  day_number?: any;
}

export default function AssessmentPage() {
  const [centers, setCenters] = useState<Center[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedCenter, setSelectedCenter] = useState<string>('01') 
  const [selectedRoom, setSelectedRoom] = useState<string>('11') 
  const [selectedWeek, setSelectedWeek] = useState<number>(1) 
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
const router = useRouter();
  // 1. โหลดรายชื่อศูนย์สแตนด์บาย
  useEffect(() => {
    const fetchCenters = async () => {
      const { data } = await supabase
        .from('center')
        .select('id, name')
        .order('id')
      
      if (data && data.length > 0) {
        const formattedCenters = data.map(c => ({
          id: String(c.id).padStart(2, '0'),
          name: c.name
        }))
        setCenters(formattedCenters)
      }
    }
    fetchCenters()
  }, [])

  // 2. ดึงข้อมูลนักเรียนและแผนประเมินที่สัมพันธ์กัน
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const centerStr = String(selectedCenter).trim();
        const centerNum = parseInt(selectedCenter, 10);
        const roomStr = String(selectedRoom).trim(); 
        const roomNum = parseInt(selectedRoom, 10);

        // ดึงรายชื่อนักเรียนจาก Supabase
        const { data: stdData, error: stdError } = await supabase
          .from('students')
          .select('id, first_name, last_name, nickname, center_id, room_number')
          .or(`center_id.eq.${centerStr},center_id.eq.${isNaN(centerNum) ? -1 : centerNum}`)
          .order('id')

        if (stdError) throw stdError

        const matchedStudents = stdData?.filter(s => {
          const studentRoom = String(s.room_number || '').trim();
          return studentRoom === roomStr || parseInt(studentRoom, 10) === roomNum;
        }) || []
        
        setStudents(matchedStudents)

        // ดึงข้อมูลแผนการประเมินทั้งหมด
        const { data: tempData, error: tempError } = await supabase
          .from('assessment_templates')
          .select('*')
          .order('created_at', { ascending: false })

        if (tempError) throw tempError

        // 🎯 กำหนด Mapping แปลงตัวเลขปุ่ม (1-5) เป็นข้อความวันในสัปดาห์ภาษาไทย
        const dayNames: any = { 1: "วันจันทร์", 2: "วันอังคาร", 3: "วันพุธ", 4: "วันพฤหัสบดี", 5: "วันศุกร์" };
        const targetDayName = dayNames[selectedDay] || "";

        // 🎯 จุดแก้ไขสำคัญ: ปรับปรุงเงื่อนไขให้ฉลาดขึ้น แมตช์ได้ทั้งตัวเลข (2) และชื่อข้อความ ("วันอังคาร")
        const filteredTemplates = tempData?.filter(t => {
          const matchWeek = String(t.week_number) === String(selectedWeek);
          
          const dbDayStr = String(t.day_number || '').trim();
          const matchDay = dbDayStr === String(selectedDay) || dbDayStr === targetDayName;
          
          return matchWeek && matchDay;
        }) || []

        // แผนสำรอง: ถ้ากรองแบบตรงเป๊ะแล้วไม่เจอ ให้เอาแผนทั้งหมดโชว์ประทังไปก่อนเพื่อความยืดหยุ่น
        const finalTemplates = filteredTemplates.length > 0 ? filteredTemplates : (tempData || [])
        setTemplates(finalTemplates)

        if (finalTemplates.length > 0) {
          const defaultSelect = filteredTemplates.length > 0 ? filteredTemplates[0].id : finalTemplates[0].id
          setSelectedTemplate(defaultSelect)
        } else {
          setSelectedTemplate('')
        }
      } catch (err) {
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedCenter, selectedRoom, selectedWeek, selectedDay])

  const currentTemplate = templates.find(t => t.id === selectedTemplate)

  const handleSaveScore = async (studentId: number, score: number) => {
    if (!selectedTemplate) {
      alert('กรุณาเลือกหัวข้อประเมินก่อนครับเพื่อน JP!')
      return
    }

    try {
      const { error } = await supabase
        .from('student_scores')
        .upsert({ 
          student_id: studentId, 
          template_id: selectedTemplate, 
          score_value: score,
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id,template_id' })

      if (error) throw error
      console.log(`Saved! Student ID: ${studentId}, Score: ${score}`)
    } catch (err) {
      console.error('Save error:', err)
      alert('บันทึกคะแนนไม่สำเร็จครับเพื่อน!')
    }
  }

 return (
  <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
    <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-purple-100">
      
      {/* 1. Header ส่วนหัวระบบ */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">📊 ระบบบันทึกผลการประเมินหลังแผน</h1>
        <p className="opacity-90 mt-1">ศูนย์พัฒนาเด็กเล็กเทศบาลเมืองท่าบ่อ</p>
      </div>

      {/* ส่วนเนื้อหาหลักภายใน Card */}
      <div className="p-6">
        
        {/* 2. Action Zone: ปุ่มอัปโหลด Excel และ ปุ่มลิงก์ดูรายงานรายงาน */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
          <div className="flex-1 w-full">
            
            {/* ปลดคอมเมนต์ตรงนี้ออก เพื่อให้ปุ่มอัปโหลดทำงาน */}
            <ExcelImporter 
              selectedWeek={selectedWeek} 
              selectedDay={selectedDay} 
              selectedCenter={selectedCenter} /* แนะนำให้ส่ง selectedCenter ไปด้วยหาก ExcelImporter ต้องใช้บันทึกแยกศูนย์ */
              onComplete={() => {
                // โค้ดที่ต้องการให้ทำงานเมื่ออัปโหลดเสร็จ เช่น ดึงข้อมูลใหม่ (Refresh Data)
                setSelectedWeek(selectedWeek);
              }} 
            />
            
          </div>
          
          <button
  type="button"
  onClick={() => {
    // ใช้ตัวแปรแฝง String วิ่งตรงเข้าโฟลเดอร์ของระบบตามโครงสร้าง App Router ได้เลยครับ
    router.push(`/admin/assessment/assessment-report?week=${selectedWeek}&center=${selectedCenter}`);
  }}
  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
>
  📊 คำนวณและดูหน้ารายงาน (Preview) →
</button>
        </div>
          {/* แผงควบคุม คัดกรอง */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 mb-8 bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
            
            {/* รายการศูนย์พัฒนาเด็กเล็ก */}
            <div className="lg:col-span-3">
              <label className="block text-sm font-bold text-indigo-700 mb-2 uppercase tracking-wider">🏢 ศูนย์พัฒนาเด็กเล็ก</label>
              <select 
                className="w-full bg-white border-2 border-indigo-200 p-3 rounded-xl focus:ring-4 focus:ring-indigo-200 outline-none font-semibold text-indigo-900"
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
              >
                {["01", "11", "02"].map(id => (
                  <option key={id} value={id}>{getCenterFullName(id)}</option>
                ))}
              </select>
            </div>

            {/* รายการห้องเรียน */}
            <div className="lg:col-span-3">
              <label className="block text-sm font-bold text-indigo-700 mb-2 uppercase tracking-wider">🚪 ห้องเรียน</label>
              <select 
                className="w-full bg-white border-2 border-indigo-200 p-3 rounded-xl focus:ring-4 focus:ring-indigo-200 outline-none font-semibold text-indigo-900"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
              >
                {["11", "12", "21", "22"].map(roomId => (
                  <option key={roomId} value={roomId}>{getRoomFullName(roomId)}</option>
                ))}
              </select>
            </div>

            {/* 📅 ช่องเลือกสัปดาห์ แบบรันลูป 1-40 สัปดาห์ */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-bold text-indigo-700 mb-2 uppercase tracking-wider">📅 สัปดาห์</label>
              <select 
                className="w-full bg-white border-2 border-indigo-200 p-3 rounded-xl focus:ring-4 focus:ring-indigo-200 outline-none font-semibold text-indigo-900"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
              >
                {Array.from({ length: 40 }, (_, i) => i + 1).map(w => (
                  <option key={w} value={w}>สัปดาห์ที่ {w}</option>
                ))}
              </select>
            </div>
            
            {/* เลือกวันที่สอน */}
            <div className="lg:col-span-4">
              <label className="block text-sm font-bold text-indigo-700 mb-2 uppercase tracking-wider">☀️ วันที่สอน</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(day => {
                  const labelNames: any = { 1: "จ.", 2: "อ.", 3: "พ.", 4: "พฤ.", 5: "ศ." };
                  return (
                    <button 
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all transform active:scale-95 ${selectedDay === day ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-indigo-600 border-2 border-indigo-200 hover:bg-indigo-100'}`}
                    >
                      {labelNames[day] || day}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ส่วนหัวข้อประเมินจาก Excel */}
            <div className="lg:col-span-12 mt-2">
              <label className="block text-sm font-bold text-indigo-700 mb-2 uppercase tracking-wider">🎯 หัวข้อการประเมินจากไฟล์ Excel</label>
              <select 
                className="w-full bg-white border-2 border-indigo-200 p-3 rounded-xl focus:ring-4 focus:ring-indigo-200 outline-none font-medium text-gray-700"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                {templates.length > 0 ? (
                  templates.map(t => (
                    <option key={t.id} value={t.id}>
                      🎯 {t.week_number && `[สัปดาห์ที่ ${t.week_number} วันที่ ${t.day_number}]`} {t.criteria_label || t.unit_name}
                    </option>
                  ))
                ) : (
                  <option disabled>❌ ยังไม่มีข้อมูลในระบบ</option>
                )}
              </select>
            </div>
          </div>

          {/* ป้ายแสดงข้อมูลประจำห้อง */}
          <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-6">
              <div>
                <span className="text-xs font-bold text-purple-500 uppercase block tracking-widest">ศูนย์ที่ระบุ</span>
                <span className="text-md font-bold text-slate-700">{getCenterFullName(selectedCenter)}</span>
              </div>
              <div>
                <span className="text-xs font-bold text-purple-500 uppercase block tracking-widest">ห้องเรียน</span>
                <span className="text-md font-bold text-slate-700">{getRoomFullName(selectedRoom)}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-purple-500 uppercase block tracking-widest">หน่วยการเรียนรู้ย่อย</span>
              <span className="text-sm font-semibold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">{currentTemplate?.unit_name || 'ไม่ระบุหน่วย'}</span>
            </div>
          </div>

          {/* ตารางแสดงรายชื่อและการกรอกคะแนน */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
              <p className="text-purple-600 font-bold text-lg animate-pulse">กำลังตรวจสอบทะเบียนรายชื่อเด็กนักเรียน... ฮ้าาาา</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="p-5 font-semibold">ชื่อ-นามสกุล</th>
                    <th className="p-5 font-semibold">ชื่อเล่น</th>
                    <th className="p-5 text-center font-semibold">ระดับผลการประเมิน (คลิกเพื่อบันทึก)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.length > 0 ? (
                    students.map(std => (
                      <tr key={std.id} className="hover:bg-purple-50/50 transition-colors">
                        <td className="p-5">
                          <div className="font-bold text-gray-800">{std.first_name} {std.last_name}</div>
                        </td>
                        <td className="p-5 text-gray-500 font-medium">{std.nickname}</td>
                        <td className="p-5">
                          <div className="flex justify-center gap-4">
                            {[1, 2, 3].map(score => {
                              const colors = [
                                "", 
                                "border-red-500 text-red-600 hover:bg-red-500",
                                "border-amber-500 text-amber-600 hover:bg-amber-500",
                                "border-emerald-500 text-emerald-600 hover:bg-emerald-500"
                              ];
                              return (
                                <button
                                  key={score}
                                  onClick={() => handleSaveScore(std.id, score)}
                                  className={`group relative w-12 h-12 rounded-2xl border-2 font-black transition-all hover:text-white hover:shadow-lg transform hover:-translate-y-1 active:scale-90 ${colors[score]}`}
                                >
                                  {score}
                                </button>
                              )
                            })}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center p-10 text-gray-400 font-medium">
                        📭 ไม่พบรายชื่อนักเรียนใน {getCenterFullName(selectedCenter)} ({getRoomFullName(selectedRoom)})
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}