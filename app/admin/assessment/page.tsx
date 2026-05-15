'use client'
import ExcelImporter from '@/components/ExcelImporter' // เพิ่มบรรทัดนี้ด้านบนสุด
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AssessmentPage() {
  const [students, setStudents] = useState([])
  const [templates, setTemplates] = useState([]) // เก็บหัวข้อประเมิน
  const [selectedTemplate, setSelectedTemplate] = useState('') // เก็บ id หัวข้อที่เลือก
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [selectedDay, setSelectedDay] = useState(1)
  const [loading, setLoading] = useState(true)

  // 1. ดึงข้อมูลนักเรียน และ หัวข้อประเมิน (Templates)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      // ดึงรายชื่อนักเรียน
      const { data: stdData } = await supabase
        .from('students')
        .select('id, first_name, last_name, nickname')
        .order('id')
      
      // ดึงหัวข้อประเมินตามสัปดาห์และวันที่เลือก (จากตารางที่เราเพิ่งสร้าง)
      const { data: tempData } = await supabase
        .from('assessment_templates')
        .select('id, criteria_label, activity_type')
        .eq('week_number', selectedWeek)
        .eq('day_number', selectedDay)

      setStudents(stdData || [])
      setTemplates(tempData || [])
      if (tempData?.length > 0) setSelectedTemplate(tempData[0].id)
      setLoading(false)
    }
    fetchData()
  }, [selectedWeek, selectedDay]) // เมื่อเปลี่ยนสัปดาห์หรือวัน ให้โหลดข้อมูลใหม่

  // 2. ฟังก์ชันบันทึกคะแนน
  const handleSaveScore = async (studentId, score) => {
    if (!selectedTemplate) {
      alert('กรุณาเลือกหัวข้อประเมินก่อนครับเพื่อน!')
      return
    }

    const { error } = await supabase
      .from('student_scores')
      .upsert({ 
        student_id: studentId, 
        template_id: selectedTemplate, 
        score_value: score
      }, { onConflict: 'student_id,template_id' }) // ป้องกันข้อมูลซ้ำ

    if (error) {
      console.error('Error saving:', error)
    } else {
      // ทำ Effect เล็กๆ ให้รู้ว่าบันทึกแล้ว (เช่น เปลี่ยนสีปุ่มชั่วคราว)
      console.log('Saved!')
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-purple-700">บันทึกผลการประเมินหลังแผน</h1>
      {/* 🚀 ติดตั้งเครื่องจักรนำเข้าตรงนี้ครับเพื่อน JP! */}
      <ExcelImporter onComplete={() => window.location.reload()} />
      
      <div className="grid grid-cols-1 md:flex gap-4 mb-6 bg-purple-50 p-4 rounded-xl border border-purple-100">
        <div>
          <label className="block text-sm font-medium text-purple-600 mb-1">สัปดาห์ที่</label>
          <select 
            className="border-2 border-purple-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
          >
            {[1, 2, 3, 4].map(w => <option key={w} value={w}>สัปดาห์ที่ {w}</option>)}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-purple-600 mb-1">วันที่สอน</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(day => (
              <button 
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`w-10 h-10 rounded-lg font-bold transition-all ${selectedDay === day ? 'bg-purple-600 text-white scale-110 shadow-lg' : 'bg-white text-purple-600 border border-purple-200'}`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-purple-600 mb-1">หัวข้อที่ต้องการประเมิน (จากไฟล์ Excel)</label>
          <select 
            className="w-full border-2 border-purple-200 p-2 rounded-lg focus:outline-none"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
          >
            {templates.length > 0 ? (
              templates.map(t => (
                <option key={t.id} value={t.id}>[{t.activity_type}] {t.criteria_label}</option>
              ))
            ) : (
              <option disabled>ยังไม่มีข้อมูลหัวข้อ (กรุณาเพิ่มในฐานข้อมูล)</option>
            )}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-10 text-purple-500">กำลังโหลดข้อมูลนักเรียน... ฮ้าาาา</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-purple-600 text-white">
                <th className="p-4">ชื่อ-นามสกุล</th>
                <th className="p-4">ชื่อเล่น</th>
                <th className="p-4 text-center">ประเมินผล (1-3)</th>
              </tr>
            </thead>
            <tbody>
              {students.map(std => (
                <tr key={std.id} className="border-b border-gray-100 hover:bg-purple-50 transition-colors">
                  <td className="p-4 font-medium text-gray-700">{std.first_name} {std.last_name}</td>
                  <td className="p-4 text-gray-600">{std.nickname}</td>
                  <td className="p-4">
                    <div className="flex justify-center gap-3">
                      {[1, 2, 3].map(score => (
                        <button
                          key={score}
                          onClick={() => handleSaveScore(std.id, score)}
                          className={`w-10 h-10 rounded-full border-2 font-bold transition-all
                            ${score === 3 ? 'border-green-500 text-green-600 hover:bg-green-500 hover:text-white' : ''}
                            ${score === 2 ? 'border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white' : ''}
                            ${score === 1 ? 'border-red-500 text-red-600 hover:bg-red-500 hover:text-white' : ''}
                          `}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}