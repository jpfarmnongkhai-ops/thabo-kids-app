'use client'
import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'

export default function ExcelImporter({ onComplete }: any) {
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

        // 🎯 เช็กให้ชัวร์ว่าหัวตารางใน Excel ตรงกับภาษาไทยในนี้ครับ
        const templatesToInsert = data.map((row: any) => ({
          unit_name: row['หน่วย'] || 'วิทยาศาสตร์สร้างสรรค์',
          week_number: 34,
          day_number: 2,
          activity_type: 'กิจกรรมเสริมประสบการณ์',
          criteria_label: row['หัวข้อประเมิน'] || row['เกณฑ์การวัด'] || 'ไม่มีหัวข้อ',
          academic_year: '2569'
        }))

        const { error } = await supabase
          .from('assessment_templates')
          .insert(templatesToInsert)

        if (error) {
           alert('Supabase ฟ้องว่า: ' + error.message) // ถ้าสิทธิ์ RLS ไม่ผ่าน มันจะฟ้องตรงนี้ครับ
           throw error
        }

        alert('สำเร็จ! หัวข้อประเมินเข้าสู่ระบบแล้วครับเพื่อน JP')
        if (onComplete) onComplete() // สั่งให้หน้าหลักรีเฟรชข้อมูล

      } catch (err: any) {
        console.error(err)
        alert('เกิดข้อผิดพลาด: ' + (err.message || 'ไม่ทราบสาเหตุ ฮ้าาา'))
      } finally {
        setUploading(false) // ปลดล็อกสถานะ "กำลังทำงาน"
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="mb-6 p-4 border-2 border-dashed border-purple-300 rounded-xl bg-purple-50 text-center">
      <p className="text-purple-700 font-bold mb-2">📥 นำเข้าหัวข้อประเมินจาก Excel</p>
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