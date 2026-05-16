'use client'
import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'

interface ExcelImporterProps {
  selectedWeek: number;
  selectedDay: number;
  onComplete: () => void;
}

export default function ExcelImporter({ selectedWeek, selectedDay, onComplete }: ExcelImporterProps) {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const reader = new FileReader()

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws)

        // ✨ นำเข้าล็อกสัปดาห์และวันที่ ที่ตรงกับหน้าเว็บปัจจุบันของคุณครู
        const templatesToInsert = data.map((row: any) => ({
          unit_name: row['หน่วย'] || 'วิทยาศาสตร์สร้างสรรค์',
          week_number: selectedWeek, 
          day_number: selectedDay,   
          activity_type: row['กิจกรรม'] || 'กิจกรรมเสริมประสบการณ์',
          criteria_label: row['หัวข้อประเมิน'] || row['เกณฑ์การวัด'] || 'ไม่มีหัวข้อ',
          academic_year: '2569'
        }))

        const { error } = await supabase
          .from('assessment_templates')
          .insert(templatesToInsert)

        if (error) {
           alert('Supabase ฟ้องว่า: ' + error.message)
           throw error
        }

        alert(`สำเร็จ! นำเข้าหัวข้อสำหรับ สัปดาห์ที่ ${selectedWeek} วันที่ ${selectedDay} เรียบร้อยแล้วครับเพื่อน JP`)
        if (onComplete) onComplete() 

      } catch (err: any) {
        console.error(err)
        alert('เกิดข้อผิดพลาด: ' + (err.message || 'ไม่ทราบสาเหตุ ฮ้าาา'))
      } finally {
        setUploading(false) 
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="mb-6 p-4 border-2 border-dashed border-purple-300 rounded-xl bg-purple-50 text-center">
      <p className="text-purple-700 font-bold mb-2">📥 นำเข้าหัวข้อประเมินจาก Excel</p>
      <p className="text-xs text-purple-600 mb-3 bg-purple-100 py-1.5 px-3 rounded-lg max-w-md mx-auto font-semibold">
        📢 ระบบล็อกตำแหน่งไว้ที่: <b>สัปดาห์ที่ {selectedWeek} วันที่ {selectedDay}</b> (ตามที่เลือกอยู่ด้านล่าง)
      </p>
      <input 
        type="file" 
        accept=".xlsx, .xls" 
        onChange={handleFileUpload}
        disabled={uploading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 disabled:opacity-50"
      />
      {uploading && <p className="mt-2 text-purple-500 animate-pulse font-bold">ระบบกำลังส่งข้อมูลเข้าโกดัง... ฮ้าาาา</p>}
    </div>
  )
}