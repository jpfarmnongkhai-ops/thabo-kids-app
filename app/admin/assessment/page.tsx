"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ExcelImporter from '@/components/ExcelImporter';
import Link from 'next/link';

// 🏢 ฟังก์ชันแปลงรหัสหน้าจอเป็นชื่อแสดงผล
const getCenterFullName = (id: string) => {
  const names: any = { 
    "01": "ศูนย์ 1 ท่าเสด็จ", 
    "11": "ศูนย์ 1 ท่าเสด็จ(เพิ่มเติม)", 
    "02": "ศูนย์ 2 บ้านน้ำโมง"
  };
  return names[id] || `ศูนย์รหัส ${id}`;
};

// 🚪 ฟังก์ชันแปลงรหัสหน้าจอเป็นชื่อห้อง
const getRoomFullName = (roomId: string) => {
  const rooms: any = { 
    "11": "เด็กเล็ก 1/1", 
    "12": "เด็กเล็ก 1/2", 
    "21": "อนุบาล 1/1",
    "22": "อนุบาล 1/2"
  };
  return rooms[roomId] || `ห้อง ${roomId}`;
};

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  nickname: string;
  center_id: any; 
  room_number: any; // ✅ แก้ไขให้ตรงกับตารางหลังบ้าน     
}

interface Template {
  id: string;
  criteria_label: string;
  activity_type: string;
  unit_name: string;
  week?: any;
}

export default function AssessmentPage() {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [selectedCenter, setSelectedCenter] = useState<string>('01'); 
  const [selectedRoom, setSelectedRoom] = useState<string>('11'); 
  const [selectedWeek, setSelectedWeek] = useState<number>(1);    
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const [students, setStudents] = useState<Student[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  
  const [loadingStudents, setLoadingStudents] = useState<boolean>(true);
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true);
const fetchSavedScores = async () => {
    if (!selectedTemplate) return;
    try {
      const { data, error } = await supabase
        .from('student_scores')
        .select('student_id, score_value')
        .eq('template_id', selectedTemplate)
        .eq('day_number', Number(selectedDay || 1));

      if (error) throw error;

      // แปลงข้อมูลให้อยู่ในรูป { "student_id": score_value } เพื่อเอาไปเช็กสีปุ่มง่าย ๆ
      const scoreMap: Record<string, number> = {};
      data?.forEach(item => {
        scoreMap[item.student_id] = item.score_value;
      });
      setScores(scoreMap);
    } catch (err) {
      console.error('Error fetching saved scores:', err);
    }
  };
  // -----------------------------------------------------------------
  // 1. 🚀 [ดึงข้อมูลฝั่งนักเรียน] แก้ไขให้เรียกชื่อคอลัมน์ room_number
  // -----------------------------------------------------------------
  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        console.log(`🎬 [ดึงเด็ก] ศูนย์: ${selectedCenter} | ห้อง: ${selectedRoom}`);
        const { data, error } = await supabase
          .from('students')
          .select('id, first_name, last_name, nickname, center_id, room_number'); // ✅ เปลี่ยนจาก room เป็น room_number

        if (error) throw error;

        const filtered = data?.filter(s => {
          const sCenter = String(s.center_id || '').trim();
          const sRoom = String(s.room_number || '').trim(); // ✅ ดึงค่าจาก room_number มาใช้
          const targetCenter = String(selectedCenter).trim();
          const targetRoom = String(selectedRoom).trim();

          const isCenterMatch = (sCenter === targetCenter) || (Number(sCenter) === Number(targetCenter));
          const isRoomMatch = (sRoom === targetRoom) || (Number(sRoom) === Number(targetRoom));

          return isCenterMatch && isRoomMatch;
        }) || [];

        setStudents(filtered);
        console.log(`✅ [ดึงเด็กสำเร็จ] พบเด็กนักเรียน: ${filtered.length} คน`);
      } catch (err) {
        console.error('❌ Error fetching students:', err);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [selectedCenter, selectedRoom]);

  // -----------------------------------------------------------------
  // 2. 📅 [ดึงข้อมูลฝั่งแผน Excel / สัปดาห์] (โค้ดส่วนนี้ดีอยู่แล้ว)
  // -----------------------------------------------------------------
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
        console.log(`🎬 [ดึงหัวข้อ Excel] ค้นหาสัปดาห์ที่: ${selectedWeek}`);
        const { data, error } = await supabase
          .from('assessment_templates')
          .select('*');

        if (error) throw error;

        const filtered = data?.filter(t => {
          const dbWeek = String(t.week || '').trim();
          const targetWeek = String(selectedWeek).trim();
          return dbWeek === targetWeek || Number(dbWeek) === Number(targetWeek);
        }) || [];

        const finalTemplates = filtered.length > 0 ? filtered : (data || []);
        setTemplates(finalTemplates);

        if (finalTemplates.length > 0) {
          setSelectedTemplate(finalTemplates[0].id);
        } else {
          setSelectedTemplate('');
        }
        console.log(`✅ [ดึงหัวข้อสำเร็จ] พบแผนการประเมิน: ${finalTemplates.length} รายการ`);
      } catch (err) {
        console.error('❌ Error fetching templates:', err);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [selectedWeek]);

  const currentTemplate = templates.find(t => t.id === selectedTemplate);
// 💾 ฟังก์ชันบันทึกคะแนน (เวอร์ชันเคลียร์ขีดแดง แก้ปัญหา undefined)
 const handleSaveScore = async (studentId: string | number, score: number) => {
    if (!selectedTemplate || selectedTemplate === '') {
      alert('กรุณาเลือกหัวข้อการประเมินก่อนบันทึกคะแนนครับเพื่อน!');
      return;
    }

    try {
      console.log(`⏳ [กำลังบันทึก] เด็ก ID: ${studentId} | คะแนน: ${score}`);

      const scoresPayload = {
        score: Number(score),
        saved_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('student_scores')
        .upsert({ 
          student_id: studentId,
          template_id: selectedTemplate,
          score_value: Number(score),
          scores: scoresPayload, 
          day_number: Number(selectedDay || 1), 
          assessment_date: new Date().toISOString().split('T')[0] 
        }, { onConflict: 'student_id,template_id' }); 

      if (error) {
        console.error('❌ Supabase Error Detail:', error);
        throw error;
      }

      // 🌟 เปิดใช้งานเพื่อให้ปุ่มเปลี่ยนสีทันทีที่กดจิ้ม!
      setScores(prev => ({
        ...prev,
        [studentId]: score
      }));

      console.log(`✅ บันทึกคะแนนสำเร็จ! เด็ก ID ${studentId} ได้คะแนน: ${score}`);

    } catch (err: any) {
      console.error('Save score error:', err);
      alert(`บันทึกไม่สำเร็จ: ${err.message || 'ตรวจสอบข้อจำกัดของตารางอีกครั้งครับเพื่อน'}`);
    }
  };
  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-purple-100">
        
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">📊 ระบบบันทึกผลการประเมินหลังแผน</h1>
          <p className="opacity-90 mt-1">ศูนย์พัฒนาเด็กเล็กเทศบาลตำบลท่าบ่อ (สิทธิ์ระบบ Super Admin)</p>
          
          <div className="mt-4 flex justify-center">
            <Link 
              href="/admin/assessment-report" 
              className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-black px-6 py-2.5 rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center gap-2 border-2 border-white"
            >
              👁️ เปิดหน้าแสดงผลรายงาน (Report) ➡️
            </Link>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-8">
             <ExcelImporter 
               selectedWeek={selectedWeek} 
               selectedDay={selectedDay} 
               onComplete={() => {
                 setSelectedWeek(selectedWeek); 
               }} 
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 mb-8 bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
            <div className="lg:col-span-3">
              <label className="block text-sm font-bold text-indigo-700 mb-2 uppercase tracking-wider">🏢 ศูนย์พัฒนาเด็กเล็กฯ</label>
              <select 
                className="w-full bg-white border-2 border-indigo-200 p-3 rounded-xl focus:ring-4 focus:ring-indigo-200 outline-none font-semibold text-indigo-900"
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
              >
                <option value="01">ศูนย์ 1 ท่าเสด็จ</option>
                <option value="11">ศูนย์ 1 ท่าเสด็จ(เพิ่มเติม)</option>
                <option value="02">ศูนย์ 2 บ้านน้ำโมง</option>
              </select>
            </div>

            <div className="lg:col-span-3">
              <label className="block text-sm font-bold text-indigo-700 mb-2 uppercase tracking-wider">🚪 ห้องเรียน</label>
              <select 
                className="w-full bg-white border-2 border-indigo-200 p-3 rounded-xl focus:ring-4 focus:ring-indigo-200 outline-none font-semibold text-indigo-900"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
              >
                <option value="11">เด็กเล็ก 1/1</option>
                <option value="12">เด็กเล็ก 1/2</option>
                <option value="21">อนุบาล 1/1</option>
                <option value="22">อนุบาล 1/2</option>
              </select>
            </div>

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
            
            <div className="lg:col-span-4">
              <label className="block text-sm font-bold text-indigo-700 mb-2 uppercase tracking-wider">☀️ วันที่สอน</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(day => (
                  <button 
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all transform active:scale-95 ${selectedDay === day ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-indigo-600 border-2 border-indigo-200 hover:bg-indigo-100'}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-12 mt-2">
              <label className="block text-sm font-bold text-indigo-700 mb-2 uppercase tracking-wider">🎯 หัวข้อการประเมินจากไฟล์ Excel</label>
              <select 
                className="w-full bg-white border-2 border-indigo-200 p-3 rounded-xl focus:ring-4 focus:ring-indigo-200 outline-none font-medium text-gray-700"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                disabled={loadingTemplates}
              >
                {loadingTemplates ? (
                  <option>กำลังโหลดแผนงานย่อยจากฐานข้อมูล...</option>
                ) : templates.length > 0 ? (
                  templates.map(t => (
                    <option key={t.id} value={t.id}>
                      🎯 {t.week && `[สัปดาห์ที่ ${t.week}]`} {t.criteria_label || t.unit_name || t.activity_type}
                    </option>
                  ))
                ) : (
                  <option disabled>❌ ไม่พบข้อมูลหัวข้อแผนในสัปดาห์นี้</option>
                )}
              </select>
            </div>
          </div>

          <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-6">
              <div>
                <span className="text-xs font-bold text-purple-500 uppercase block tracking-widest">ศูนย์ประจำการ</span>
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

          {loadingStudents ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
              <p className="text-purple-600 font-bold text-lg animate-pulse">กำลังสแกนหาตัวตนของเด็ก ๆ จากฐานข้อมูล... ฮ้าาาา</p>
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
    students.map(std => {
      return (
        <tr key={std.id} className="hover:bg-purple-50/50 transition-colors">
          <td className="p-5">
            <div className="font-bold text-gray-800">{std.first_name} {std.last_name}</div>
          </td>
          <td className="p-5 text-gray-500 font-medium">{std.nickname || '-'}</td>
          <td className="p-5">
            <div className="flex justify-center gap-4">
              {[1, 2, 3].map(score => {
                // 🌟 1. เช็กสเตตว่าคะแนนที่กำลังวนลูปอยู่ ตรงกับคะแนนใน State หน้าจอตอนนี้ไหม
                const isSelected = scores[std.id] === score;

                // 🌟 2. สาดสีไฮไลต์: ถ้าถูกเลือกให้ขึ้นสีทึบตัวหนังสือขาว / ถ้าไม่เลือกให้ใช้กรอบสไตล์ Hover สีจางเดิมของคุณ
                let activeStyle = "";
                if (isSelected) {
                  if (score === 1) activeStyle = "bg-rose-500 text-white border-rose-600 font-bold shadow-md scale-105";
                  if (score === 2) activeStyle = "bg-amber-500 text-white border-amber-600 font-bold shadow-md scale-105";
                  if (score === 3) activeStyle = "bg-emerald-500 text-white border-emerald-600 font-bold shadow-md scale-105";
                } else {
                  if (score === 1) activeStyle = "border-red-500 text-red-600 hover:bg-red-500 hover:text-white";
                  if (score === 2) activeStyle = "border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white";
                  if (score === 3) activeStyle = "border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white";
                }

                return (
                  <button
                    key={score}
                    disabled={false}
                    onClick={() => handleSaveScore(std.id, score)}
                    className={`group relative w-12 h-12 rounded-2xl border-2 font-black transition-all hover:shadow-lg transform active:scale-95 ${activeStyle}`}
                  >
                    {score}
                  </button>
                );
              })}
            </div>
          </td>
        </tr>
      );
    })
  ) : (
    <tr>
      <td colSpan={3} className="p-5 text-center text-gray-400">❌ ไม่พบข้อมูลนักเรียน</td>
    </tr>
  )}
</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}