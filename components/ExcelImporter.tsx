'use client'
import { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'

export default function ExcelImporter({ onComplete }) {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const reader = new FileReader()
    
    reader.onload = async (evt) => {
      const bstr = evt.target?.result
      const wb = XLSX.read(bstr, { type: 'binary' })
      const wsname = wb.SheetNames[0]
      const ws = wb.Sheets[wsname]
      const data = XLSX.utils.sheet_to_json(ws)

      // ตัวอย่างการ Map ข้อมูลจาก Excel เข้าสู่รูปแบบของ Supabase
      // เพื่อน JP ปรับชื่อ Column ให้ตรงกับในไฟล์ Excel ของเพื่อนนะครับ
      // แก้ไขส่วนการ Map ข้อมูลให้ยืดหยุ่นขึ้นครับเพื่อน JP
const templatesToInsert = data.map((row: any) => ({
  unit_name: row['หน่วย'] || 'วิทยาศาสตร์สร้างสรรค์', // ใช้ชื่อคอลัมน์ภาษาไทยตามไฟล์เพื่อน
  week_number: parseInt(row['สัปดาห์ที่']) || 34,
  day_number: parseInt(row['วันที่']) || 2,
  activity_type: row['กิจกรรม'] || 'กิจกรรมเสริมประสบการณ์',
  criteria_label: row['หัวข้อประเมิน'] || row['เกณฑ์การวัด'] || 'ไม่มีชื่อหัวข้อ', 
  academic_year: '2569'
}))

      const { error } = await supabase
        .from('assessment_templates')
        .insert(templatesToInsert)

      if (error) {
        console.error('Error inserting templates:', error)
        alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล ฮ้าาา')
      } else {
        alert('นำเข้าหัวข้อประเมินสำเร็จแล้วครับเพื่อน JP!')
        if (onComplete) onComplete()
      }
      setUploading(false)
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="mb-6 p-4 border-2 border-dashed border-purple-300 rounded-xl bg-purple-50 text-center">
      <p className="text-purple-700 font-bold mb-2">📥 นำเข้าหัวข้อประเมินจาก Excel</p>
      <input 
        type="file" 
        accept=".xlsx, .xls, .csv" 
        onChange={handleFileUpload}
        disabled={uploading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
      />
      {uploading && <p className="mt-2 text-purple-500 animate-pulse">กำลังทำงาน... ฮ้าาาา</p>}
    </div>
  )
}