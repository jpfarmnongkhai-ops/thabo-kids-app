'use client'
import { useRouter } from 'next/router'; // หรือ 'next/navigation' ตามเวอร์ชันที่ใช้
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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

// 6 กิจกรรมหลัก
const FIXED_ACTIVITIES = [
  { key: "กิจกรรมเคลื่อนไหวและจังหวะ", short: "เคลื่อนไหวและจังหวะ" },
  { key: "กิจกรรมเสริมประสบการณ์", short: "เสริมประสบการณ์" },
  { key: "กิจกรรมสร้างสรรค์", short: "สร้างสรรค์" },
  { key: "กิจกรรมเสรี", short: "เสรี / เล่นตามมุม" },
  { key: "กิจกรรมกลางแจ้ง", short: "กลางแจ้ง" },
  { key: "กิจกรรมเกมการศึกษา", short: "เกมการศึกษา" }
];

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  nickname: string;
}

interface Template {
  id: string;
  activity_type: string;
  criteria_label: string;
  day_number: number;
  unit_name: string;
}

export default function AssessmentReportWeek20Page() {
  const [students, setStudents] = useState<Student[]>([])
  const [dayTemplates, setDayTemplates] = useState<Template[]>([])
  const [scores, setScores] = useState<{ [key: string]: number }>({})
  const [unitName, setUnitName] = useState<string>('สิ่งมีชีวิตและสิ่งไม่มีชีวิต')
  
  // Controls
  const [selectedCenter, setSelectedCenter] = useState<string>('11')
  const [selectedRoom, setSelectedRoom] = useState<string>('12')
  const [selectedWeek, setSelectedWeek] = useState<number>(20)
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true)
      try {
        const centerStr = String(selectedCenter).trim();
        const roomStr = String(selectedRoom).trim();

        const { data: stdData } = await supabase
          .from('students')
          .select('id, first_name, last_name, nickname, center_id, room_number')
          .or(`center_id.eq.${centerStr},center_id.eq.${parseInt(centerStr, 10) || -1}`)
          .order('id')

        const matchedStudents = stdData?.filter(s => {
          const studentRoom = String(s.room_number || '').trim();
          return studentRoom === roomStr || parseInt(studentRoom, 10) === parseInt(roomStr, 10);
        }) || []
        setStudents(matchedStudents)

        const { data: tempData } = await supabase
          .from('assessment_templates')
          .select('id, activity_type, criteria_label, day_number, unit_name')
          .eq('week_number', selectedWeek)
          .eq('day_number', selectedDay)

        const validTemplates = tempData || []
        setDayTemplates(validTemplates)
        
        if (validTemplates.length > 0) {
          setUnitName(validTemplates[0].unit_name || 'สิ่งมีชีวิตและสิ่งไม่มีชีวิต')
        }

        if (matchedStudents.length > 0 && validTemplates.length > 0) {
          const studentIds = matchedStudents.map(s => s.id)
          const templateIds = validTemplates.map(t => t.id)

          const { data: scoreData } = await supabase
            .from('student_scores')
            .select('student_id, template_id, score_value')
            .in('student_id', studentIds)
            .in('template_id', templateIds)

          const scoreObj: { [key: string]: number } = {}
          scoreData?.forEach(row => {
            scoreObj[`${row.student_id}_${row.template_id}`] = row.score_value
          })
          setScores(scoreObj)
        } else {
          setScores({})
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchReportData()
  }, [selectedCenter, selectedRoom, selectedWeek, selectedDay])

  // คำนวณคะแนนเฉลี่ยรายกิจกรรม
  const getAverageScoreForActivity = (studentId: number, activityName: string) => {
    const filteredIds = dayTemplates
      .filter(t => t.activity_type === activityName)
      .map(t => t.id)

    if (filteredIds.length === 0) return null

    let sum = 0
    let count = 0
    filteredIds.forEach(id => {
      const score = scores[`${studentId}_${id}`]
      if (score !== undefined && score !== null) {
        sum += score
        count++
      }
    })

    if (count === 0) return null
    return Math.round(sum / count)
  };

  // โลจิกคำนวณสรุปท้ายแถวของเด็กแต่ละคน (คะแนนรวม, เฉลี่ย, ระดับ)
  const getStudentSummaryRow = (studentId: number) => {
    let totalScore = 0
    let activityCount = 0

    FIXED_ACTIVITIES.forEach(act => {
      const avg = getAverageScoreForActivity(studentId, act.key)
      if (avg !== null) {
        totalScore += avg
        activityCount++
      }
    })

    if (activityCount === 0) {
      return { total: '-', average: '-', level: 'ไม่มีข้อมูล', rawAvg: 0 }
    }

    const overallAvg = totalScore / activityCount
    let level = 'ควรส่งเสริม'
    if (overallAvg >= 2.51) level = 'ดี'
    else if (overallAvg >= 1.51) level = 'พอใช้'

    return {
      total: totalScore,
      average: overallAvg.toFixed(2),
      level: level,
      rawAvg: overallAvg
    }
  };

  // คำนวณสถิติภาพรวมสำหรับสรุปท้ายรายงาน
  const stats = (() => {
    let goodCount = 0, fairCount = 0, improveCount = 0;
    let countedStudents = 0;

    students.forEach(std => {
      const summary = getStudentSummaryRow(std.id)
      if (summary.total !== '-') {
        countedStudents++
        if (summary.level === 'ดี') goodCount++
        else if (summary.level === 'พอใช้') fairCount++
        else if (summary.level === 'ควรส่งเสริม') improveCount++
      }
    })
    
    const total = countedStudents || 1
    return {
      good: { count: goodCount, percent: ((goodCount / total) * 100).toFixed(1) },
      fair: { count: fairCount, percent: ((fairCount / total) * 100).toFixed(1) },
      improve: { count: improveCount, percent: ((improveCount / total) * 100).toFixed(1) }
    }
  })()

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen print:bg-white print:p-0">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden print:shadow-none print:border-none print:rounded-none">
        
        {/* 🎛️ แผงควบคุมควบคุมแอปพลิเคชัน */}
        <div className="p-5 bg-slate-900 text-white flex flex-wrap gap-4 items-end justify-between print:hidden">
          <div className="flex flex-wrap gap-4 flex-1">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">🏢 ศูนย์พัฒนาเด็กเล็ก</label>
              <select className="bg-slate-800 border border-slate-700 text-white p-2.5 rounded-xl font-medium text-sm focus:ring-2 focus:ring-indigo-500" value={selectedCenter} onChange={(e) => setSelectedCenter(e.target.value)}>
                {["01", "11", "02"].map(id => <option key={id} value={id}>{getCenterFullName(id)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">🚪 ห้องเรียน</label>
              <select className="bg-slate-800 border border-slate-700 text-white p-2.5 rounded-xl font-medium text-sm focus:ring-2 focus:ring-indigo-500" value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
                {["11", "12", "21", "22"].map(roomId => <option key={roomId} value={roomId}>{getRoomFullName(roomId)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">📅 สัปดาห์</label>
              <select className="bg-slate-800 border border-slate-700 text-white p-2.5 rounded-xl font-medium text-sm" value={selectedWeek} onChange={(e) => setSelectedWeek(Number(e.target.value))}>
                {Array.from({ length: 40 }, (_, i) => i + 1).map(w => <option key={w} value={w}>สัปดาห์ที่ {w}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1.5">☀️ วันทำการเรียนรู้</label>
              <div className="flex gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                {[1, 2, 3, 4, 5].map(d => (
                  <button key={d} onClick={() => setSelectedDay(d)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedDay === d ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-700'}`}>
                    วัน {d === 1 ? 'จ.' : d === 2 ? 'อ.' : d === 3 ? 'พ.' : d === 4 ? 'พฤ.' : 'ศ.'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg active:scale-95">
            🖨️ พิมพ์รายงานหลังแผน (A4)
          </button>
        </div>

        {/* 📄 เนื้อหารายงานผล */}
        <div className="p-6 md:p-8 print:p-2">
          <div className="text-center mb-6 pb-4 border-b-2 border-slate-800">
            <h1 className="text-lg md:text-xl font-black text-slate-950">แบบบันทึกผลการประเมินพัฒนาการหลังการจัดประสบการณ์</h1>
            <h2 className="text-sm font-bold text-slate-600 mt-0.5">ศูนย์พัฒนาเด็กเล็กเทศบาลตำบลท่าบ่อ</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 text-xs font-semibold text-slate-600 bg-slate-50 p-2 rounded-xl print:bg-white print:p-0">
              <span className="truncate"><strong>ศูนย์:</strong> {getCenterFullName(selectedCenter)}</span>
              <span><strong>ชั้นเรียน:</strong> {getRoomFullName(selectedRoom)}</span>
              <span><strong>สัปดาห์ที่:</strong> {selectedWeek}</span>
              <span><strong>วันที่ประเมิน:</strong> วันที่ {selectedDay}</span>
              <span className="col-span-2 sm:col-span-1 truncate"><strong>หน่วย:</strong> {unitName}</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-24 font-bold text-slate-400 animate-pulse text-xs">กำลังคำนวณข้อมูลสถิติรายวัน...</div>
          ) : (
            <div>
              {/* 📊 บล็อกสถิติด้านบน */}
              <div className="mb-6 grid grid-cols-3 gap-3 print:hidden">
                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3 text-center">
                  <span className="block text-[11px] font-bold text-emerald-700">ระดับ ดี (3)</span>
                  <span className="text-2xl font-black text-emerald-600 mt-0.5 block">{stats.good.count} <span className="text-xs font-normal text-slate-400">คน</span></span>
                  <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md mt-1">ร้อยละ {stats.good.percent}</span>
                </div>
                <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3 text-center">
                  <span className="block text-[11px] font-bold text-amber-700">ระดับ พอใช้ (2)</span>
                  <span className="text-2xl font-black text-amber-600 mt-0.5 block">{stats.fair.count} <span className="text-xs font-normal text-slate-400">คน</span></span>
                  <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md mt-1">ร้อยละ {stats.fair.percent}</span>
                </div>
                <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-3 text-center">
                  <span className="block text-[11px] font-bold text-rose-700">ควรส่งเสริม (1)</span>
                  <span className="text-2xl font-black text-rose-600 mt-0.5 block">{stats.improve.count} <span className="text-xs font-normal text-slate-400">คน</span></span>
                  <span className="inline-block bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-md mt-1">ร้อยละ {stats.improve.percent}</span>
                </div>
              </div>

              {/* 🛠️ ตารางหลัก (เพิ่มคอลัมน์ รวม/เฉลี่ย/ระดับคุณภาพ ด้านขวาสุด) */}
              <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-sm print:border-none print:rounded-none print:shadow-none">
                <table className="w-full text-left border-collapse border-2 border-slate-700 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-center font-bold text-slate-800 h-11 border-b-2 border-slate-700">
                      <th className="border border-slate-300 p-2 w-[4%]">ที่</th>
                      <th className="border border-slate-300 p-2 w-[20%] text-left">ชื่อ - นามสกุล</th>
                      <th className="border border-slate-300 p-2 w-[8%]">ชื่อเล่น</th>
                      {FIXED_ACTIVITIES.map((act, idx) => (
                        <th key={idx} className="border border-slate-300 p-1 text-center text-slate-900 bg-indigo-50/40 font-extrabold text-[10px] leading-tight w-[9%]">
                          {act.short}
                        </th>
                      ))}
                      {/* 🌟 3 คอลัมน์ที่เพิ่มขึ้นมาใหม่ต่อท้ายผลงานนักเรียนแต่ละคน */}
                      <th className="border border-slate-300 p-1 text-center font-black bg-slate-900 text-white w-[5%]">รวม</th>
                      <th className="border border-slate-300 p-1 text-center font-black bg-slate-900 text-white w-[6%]">ค่าเฉลี่ย</th>
                      <th className="border border-slate-300 p-1 text-center font-black bg-slate-900 text-white w-[8%]">ระดับคุณภาพ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length > 0 ? (
                      students.map((std, index) => {
                        // คำนวณสรุปรายคนล่วงหน้า
                        const summary = getStudentSummaryRow(std.id);

                        return (
                          <tr key={std.id} className="hover:bg-indigo-50/20 even:bg-slate-50/60 h-7 border-b border-slate-300">
                            <td className="border border-slate-300 p-1 text-center text-slate-500 font-medium">{index + 1}</td>
                            <td className="border border-slate-300 p-1 font-bold text-slate-800 px-2 truncate">{std.first_name} {std.last_name}</td>
                            <td className="border border-slate-300 p-1 text-center text-slate-600 font-medium truncate">{std.nickname || '-'}</td>
                            
                            {/* ช่องคะแนนเฉลี่ย 6 กิจกรรมหลัก */}
                            {FIXED_ACTIVITIES.map((act, idx) => {
                              const avgScore = getAverageScoreForActivity(std.id, act.key);
                              let scoreBg = "";
                              if (avgScore === 3) scoreBg = "text-emerald-600 bg-emerald-50/20 font-black";
                              if (avgScore === 2) scoreBg = "text-amber-600 bg-amber-50/20 font-bold";
                              if (avgScore === 1) scoreBg = "text-red-500 bg-red-50/20 font-bold";
                              return (
                                <td key={idx} className={`border border-slate-300 p-1 text-center text-xs ${scoreBg}`}>
                                  {avgScore !== null ? avgScore : '-'}
                                </td>
                              )
                            })}

                            {/* 🌟 แสดงผลลัพธ์ข้อมูลสรุปท้ายแถว */}
                            <td className="border border-slate-300 p-1 text-center font-bold text-slate-800 bg-slate-100">
                              {summary.total}
                            </td>
                            <td className="border border-slate-300 p-1 text-center font-bold text-indigo-600 bg-slate-100">
                              {summary.average}
                            </td>
                            <td className={`border border-slate-300 p-1 text-center font-black bg-slate-50 ${
                              summary.level === 'ดี' ? 'text-emerald-600' : 
                              summary.level === 'พอใช้' ? 'text-amber-600' : 
                              summary.level === 'ควรส่งเสริม' ? 'text-rose-600' : 'text-slate-400'
                            }`}>
                              {summary.level}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={3 + FIXED_ACTIVITIES.length + 3} className="border border-slate-300 text-center p-12 text-slate-400 font-bold">
                          ไม่พบข้อมูลสรุปคะแนนหลังแผนในระบบ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ท้ายแผ่นงานสำหรับเล่มรายงาน */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px] text-slate-500 font-medium">
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 print:bg-white">
                  <span className="text-slate-800 font-bold block mb-1">💡 สรุปเกณฑ์คุณภาพช่วงคะแนนเฉลี่ย:</span>
                  <p>ระดับ 3 (ดี): ช่วงคะแนนเฉลี่ย ๒.๕๑ - ๓.๐๐</p>
                  <p>ระดับ 2 (พอใช้): ช่วงคะแนนเฉลี่ย ๑.๕๑ - ๒.๕๐</p>
                  <p>ระดับ 1 (ควรส่งเสริม): ช่วงคะแนนเฉลี่ย ๑.๐๐ - ๑.๕๐</p>
                </div>
                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50 print:block hidden text-slate-800 font-bold">
                  <span className="block mb-1 text-slate-900">📊 สรุปสถิติสำหรับกรอกท้ายแผน (หน้า ก{selectedDay}):</span>
                  <p>• ระดับ ดี: {stats.good.count} คน (ร้อยละ {stats.good.percent})</p>
                  <p>• ระดับ พอใช้: {stats.fair.count} คน (ร้อยละ {stats.fair.percent})</p>
                  <p>• ควรส่งเสริม: {stats.improve.count} คน (ร้อยละ {stats.improve.percent})</p>
                </div>
              </div>

              <div className="mt-12 grid grid-cols-2 gap-6 text-center text-xs font-bold text-slate-700 hidden print:grid">
                <div className="mt-4">
                  <p>ลงชื่อ...........................................................ผู้ประเมิน</p>
                  <p className="mt-1.5 text-[10px] text-slate-400 font-normal">(...........................................................)</p>
                  <p className="mt-1 text-[10px] text-slate-500 font-semibold">ตำแหน่ง ครูผู้ดูแลเด็ก</p>
                </div>
                <div className="mt-4">
                  <p>ลงชื่อ...........................................................ผู้รับรอง</p>
                  <p className="mt-1.5 text-[10px] text-slate-400 font-normal">(...........................................................)</p>
                  <p className="mt-1 text-[10px] text-slate-500 font-semibold">ตำแหน่ง หัวหน้าสถานศึกษา</p>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}