'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import ExcelImporter from '@/components/ExcelImporter'

// กำหนดประเภทข้อมูลเพื่อลด Error (TypeScript)
interface Student {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string;
}

interface Template {
  id: string;
  criteria_label: string;
  activity_type: string;
  week_number?: number;
  day_number?: number;
}

export default function AssessmentPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedWeek, setSelectedWeek] = useState<number>(1)
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(true)

  // 1. ดึงข้อมูลนักเรียนและหัวข้อประเมิน
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // ดึงรายชื่อนักเรียน
        const { data: stdData } = await supabase
          .from('students')
          .select('id, first_name, last_name, nickname')
          .order('id')

        // ดึงหัวข้อประเมิน (ฉบับปรับปรุง: ดึงมาทั้งหมดก่อนเพื่อความชัวร์)
        const { data: tempData, error: tempError } = await supabase
          .from('assessment_templates')
          .select('*')
          .order('created_at', { ascending: false })

        if (tempError) throw tempError

        setStudents(stdData || [])
        
        // กรองข้อมูลเบื้องต้นตามสัปดาห์/วันที่เลือก
        const filteredTemplates = tempData?.filter(t => 
          t.week_number === selectedWeek && t.day_number === selectedDay
        ) || []

        // ถ้ากรองแล้วไม่มี ให้โชว์ทั้งหมดไปก่อนเพื่อนจะได้เห็นข้อมูล (Smart Fallback)
        const finalTemplates = filteredTemplates.length > 0 ? filteredTemplates : (tempData || [])
        setTemplates(finalTemplates)

        if (finalTemplates.length > 0) {
          setSelectedTemplate(finalTemplates[0].id)
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
  }, [selectedWeek, selectedDay])

  // 2. ฟังก์ชันบันทึกคะแนน (ปรับให้ลื่นไหลขึ้น)
  const handleSaveScore = async (studentId: string, score: number) => {
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
      console.log(`Saved score ${score} for student ${studentId}`)
      // เพิ่มความเท่: เพื่อนสามารถทำ Notification เล็กๆ ตรงนี้ได้
    } catch (err) {
      console.error('Save error:', err)
      alert('บันทึกไม่สำเร็จ ลองเช็กเน็ตดูนะเพื่อน!')
    }
  }

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-purple-100">
        
        {/* Header ส่วนหัวสุดเจ๋ง */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">📊 ระบบบันทึกผลการประเมิน</h1>
          <p className="opacity-90 mt-1">Municipality Child Development Center Dashboard</p>
        </div>

        <div className="p-6">
          {/* ส่วนนำเข้าไฟล์ */}
          <div className="mb-8">
             <ExcelImporter onComplete={() => window.location.reload()} />
          </div>

          {/* แผงควบคุม (Filters) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
            <div className="lg:col-span-2">
              <label className="block text-sm font-bold text-indigo-700 mb-2 uppercase tracking-wider">สัปดาห์</label>
              <select 
                className="w-full bg-white border-2 border-indigo-200 p-3 rounded-xl focus:ring-4 focus:ring-indigo-200 outline-none transition-all font-semibold text-indigo-900"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 34].map(w => <option key={w} value={w}>สัปดาห์ที่ {w}</option>)}
              </select>
            </div>
            
            <div className="lg:col-span-3">
              <label className="block text-sm font-bold text-indigo-700 mb-2 uppercase tracking-wider">วันที่สอน</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(day => (
                  <button 
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all transform active:scale-95 ${selectedDay === day ? 'bg-indigo-600 text-white shadow-lg -translate-y-1' : 'bg-white text-indigo-600 border-2 border-indigo-200 hover:bg-indigo-100'}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7">
              <label className="block text-sm font-bold text-indigo-700 mb-2 uppercase tracking-wider">หัวข้อการประเมินที่เลือก</label>
              <select 
                className="w-full bg-white border-2 border-indigo-200 p-3 rounded-xl focus:ring-4 focus:ring-indigo-200 outline-none transition-all font-medium text-gray-700"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                {templates.length > 0 ? (
                  templates.map(t => (
                    <option key={t.id} value={t.id}>
                      🎯 [{t.activity_type || 'ทั่วไป'}] {t.criteria_label}
                    </option>
                  ))
                ) : (
                  <option disabled>❌ ยังไม่มีข้อมูลสัปดาห์นี้ (ลองเลือกสัปดาห์อื่นหรืออัปโหลด Excel)</option>
                )}
              </select>
            </div>
          </div>

          {/* ส่วนแสดงตาราง */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
              <p className="text-purple-600 font-bold text-lg animate-pulse">กำลังเรียกนักเรียนมาเข้าแถว... ฮ้าาาา</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="p-5 font-semibold">ชื่อ-นามสกุล</th>
                    <th className="p-5 font-semibold">ชื่อเล่น</th>
                    <th className="p-5 text-center font-semibold">ระดับผลการประเมิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map(std => (
                    <tr key={std.id} className="hover:bg-purple-50/50 transition-colors">
                      <td className="p-5">
                        <div className="font-bold text-gray-800">{std.first_name} {std.last_name}</div>
                      </td>
                      <td className="p-5 text-gray-500 font-medium">{std.nickname}</td>
                      <td className="p-5">
                        <div className="flex justify-center gap-4">
                          {[1, 2, 3].map(score => {
                            const colors = [
                              "", // dummy
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
                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  {score === 3 ? 'ดีมาก' : score === 2 ? 'พอใช้' : 'ปรับปรุง'}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <p className="text-center mt-6 text-gray-400 text-sm">Powered by Gemini AI for Friend JP 💜</p>
    </div>
  )
}