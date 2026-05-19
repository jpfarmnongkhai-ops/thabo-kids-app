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
  room_number: any; 
}

interface Template {
  id: string;
  criteria_label: string;
  activity_type: string;
  unit_name: string;
  week?: any;
}

export default function AssessmentPage() {
  // 🌟 State คุมหน้าจอ ยึดตามชุดดั้งเดิมที่ทำงานได้ชัวร์
  const [selectedCenter, setSelectedCenter] = useState<string>('01'); 
  const [selectedRoom, setSelectedRoom] = useState<string>('11'); 
  const [selectedWeek, setSelectedWeek] = useState<number>(1);    
  const [selectedDay, setSelectedDay] = useState<string>('จันทร์'); 
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const [students, setStudents] = useState<Student[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  
  // 🌟 State เก็บคะแนนของแต่ละคน แยกตาม 6 กิจกรรมย่อย
  const [scores, setScores] = useState<Record<number, Record<string, number>>>({});
  
  const [loadingStudents, setLoadingStudents] = useState<boolean>(true);
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true);

  const HARDCODED_TERM_ID = "0168"; // รหัสเทอมล็อกหลังบ้าน

  // 🌟 โครงสร้าง 6 กิจกรรมหลักประจำวันของคุณครู
  const activities = [
    { key: "act_moving", label: "เคลื่อนไหว" },
    { key: "act_experience", label: "เสริมประสบการณ์" },
    { key: "act_creative", label: "สร้างสรรค์" },
    { key: "act_free", label: "เสรี" },
    { key: "act_outdoor", label: "กลางแจ้ง" },
    { key: "act_game", label: "เกมการศึกษา" }
  ];

  // 🔄 1. ดึงคะแนนสะสมที่เคยบันทึกไว้ (แกะโครงสร้าง JSONB ค้นหาตามหัวข้อแผน และวันสอน)
  const fetchSavedScores = async () => {
    if (!selectedTemplate) return;
    try {
      const { data, error } = await supabase
        .from('student_scores')
        .select('student_id, scores')
        .eq('template_id', selectedTemplate)
        .eq('term_id', HARDCODED_TERM_ID)
        .eq('week_number', selectedWeek);

      if (error) throw error;

      const scoreMap: Record<number, Record<string, number>> = {};
      data?.forEach(item => {
        const dbScores = item.scores || {};
        // ดึงคะแนน 6 กิจกรรมของวันที่ระบุ (เช่น dbScores["จันทร์"])
        if (dbScores[selectedDay]) {
          scoreMap[item.student_id] = dbScores[selectedDay];
        }
      });
      setScores(scoreMap);
    } catch (err) {
      console.error('Error fetching saved scores:', err);
    }
  };

  // 🔄 2. ดึงข้อมูลนักเรียน (ถอดสูตร Filter คลีนสาย ข้อมูลขึ้น 100% ตัดตัวค้างเรียงลำดับออก)
  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const { data, error } = await supabase
          .from('students')
          .select('id, first_name, last_name, nickname, center_id, room_number'); 

        if (error) throw error;

        const filtered = data?.filter(s => {
          const sCenter = String(s.center_id || '').trim();
          const sRoom = String(s.room_number || '').trim(); 
          const targetCenter = String(selectedCenter).trim();
          const targetRoom = String(selectedRoom).trim();

          const isCenterMatch = (sCenter === targetCenter) || (Number(sCenter) === Number(targetCenter));
          const isRoomMatch = (sRoom === targetRoom) || (Number(sRoom) === Number(targetRoom));

          return isCenterMatch && isRoomMatch;
        }) || [];

        // ลบโค้ดชุดดัก .sort() เจ้าปัญหาออกแล้ว ข้อมูลจะไหลมาแบบปลอดภัยชัวร์ครับเพื่อน!
        setStudents(filtered);
      } catch (err) {
        console.error('❌ Error fetching students:', err);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [selectedCenter, selectedRoom]);

  // 🔄 3. ดึงข้อมูลหัวข้อจากไฟล์ Excel (ตามสัปดาห์ที่เลือก)
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
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
      } catch (err) {
        console.error('❌ Error fetching templates:', err);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [selectedWeek]);

  // Trigger ดึงคะแนนเมื่อ Template หรือ วัน เปลี่ยนแปลง
  useEffect(() => {
    fetchSavedScores();
  }, [selectedTemplate, selectedDay]);

  const currentTemplate = templates.find(t => t.id === selectedTemplate);

  // 💾 ฟังก์ชันบันทึกคะแนน (เซฟลงก้อน JSONB แยกตามวันและผูกตามกิจกรรม)
  const handleSaveScore = async (studentId: number, activityKey: string, scoreValue: number) => {
    if (!selectedTemplate || selectedTemplate === '') {
      alert('กรุณาเลือกหัวข้อการประเมินก่อนบันทึกคะแนนครับเพื่อน!');
      return;
    }

    // เปลี่ยนสีปุ่มทันทีบนจอ
    const currentStudentDayScores = scores[studentId] || {};
    const updatedStudentDayScores = { ...currentStudentDayScores, [activityKey]: scoreValue };
    
    setScores(prev => ({
      ...prev,
      [studentId]: updatedStudentDayScores
    }));

    try {
      // ดึงแถวคะแนนเดิมมาเช็กเพื่อรักษาวันอื่น ๆ ไว้
      const { data: existingRow } = await supabase
        .from('student_scores')
        .select('id, scores')
        .eq('student_id', studentId)
        .eq('template_id', selectedTemplate)
        .eq('term_id', HARDCODED_TERM_ID)
        .maybeSingle();

      const totalScoresObject = existingRow?.scores || {};
      
      const finalScoresToSave = {
        ...totalScoresObject,
        [selectedDay]: {
          ...(totalScoresObject[selectedDay] || {}),
          [activityKey]: scoreValue
        }
      };

      if (existingRow) {
        await supabase
          .from('student_scores')
          .update({ 
            score_value: scoreValue, 
            scores: finalScoresToSave, 
            updated_at: new Date() 
          })
          .eq('id', existingRow.id);
      } else {
        await supabase
          .from('student_scores')
          .insert([{
            student_id: studentId,
            template_id: selectedTemplate,
            term_id: HARDCODED_TERM_ID,
            week_number: selectedWeek,
            score_value: scoreValue,
            scores: finalScoresToSave,
            assessment_date: new Date().toISOString().split('T')[0]
          }]);
      }
    } catch (err: any) {
      console.error('Save score error:', err);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-purple-100">
        
        {/* 👑 ส่วนหัวระบบบันทึกผล */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">📊 ระบบบันทึกผลการประเมินหลังแผน</h1>
          <p className="opacity-90 mt-1">ศูนย์พัฒนาเด็กเล็กเทศบาลตำบลท่าบ่อ (สิทธิ์ระบบ Super Admin)</p>
          
          {/* 👑 ปุ่มเปิดหน้ารายงานเวอร์ชันส่งข้อมูลข้ามไปแท็บใหม่ */}
<div className="mt-4 flex justify-center">
  <Link 
    href={`/admin/assessment-report?center=${selectedCenter}&room=${selectedRoom}&week=${selectedWeek}`} 
    target="_blank" // 🚀 สั่งเปิดแท็บใหม่ชัวร์ๆ
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
               onComplete={() => fetchSavedScores()} 
             />
          </div>

          {/* 🔍 แผงควบคุมตัวกรอง */}
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
                {['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'].map(dayName => (
                  <button 
                    key={dayName}
                    onClick={() => setSelectedDay(dayName)}
                    className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all transform active:scale-95 ${selectedDay === dayName ?
                    'bg-indigo-600 text-white shadow-lg' : 'bg-white text-indigo-600 border-2 border-indigo-200 hover:bg-indigo-100'}`}
                  >
                    {dayName.replace('วัน', '')}
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

          {/* ป้ายแสดงข้อมูลสรุปหัวเรื่อง */}
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
              <span className="text-sm font-semibold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                {currentTemplate?.unit_name || 'ไม่ระบุหน่วย'}
              </span>
            </div>
          </div>

          {/* 📋 โครงสร้างตารางรายชื่อเด็ก + แผง 6 กิจกรรมหลักย่อย เรียงหน้ากระดานลงตรงกลางเป๊ะ */}
          {loadingStudents ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
              <p className="text-purple-600 font-bold text-lg animate-pulse">กำลังสแกนหาตัวตนของเด็ก ๆ จากฐานข้อมูล... ฮ้าาาา</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1100px]">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold text-sm">
                      <th className="p-4 w-16 text-center">ลำดับ</th>
                      <th className="p-4 w-64">ชื่อ - นามสกุล</th>
                      <th className="p-4 w-24 text-center">ชื่อเล่น</th>
                      <th className="p-4 text-center">การประเมินพัฒนาการ 6 กิจกรรมหลักย่อย (คลิกปุ่มเพื่อบันทึกทันที)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {students.length > 0 ? (
                      students.map((std, index) => {
                        const studentDayScores = scores[std.id] || {};

                        return (
                          <tr key={std.id} className="hover:bg-purple-50/40 transition-colors">
                            {/* 1. ลำดับที่แถว */}
                            <td className="p-4 text-center font-bold text-gray-500">{index + 1}</td>
                            
                            {/* 2. ชื่อ-นามสกุล */}
                            <td className="p-4 font-bold text-gray-800">{std.first_name} {std.last_name}</td>
                            
                            {/* 3. ชื่อเล่น */}
                            <td className="p-4 text-center text-purple-600 font-semibold">{std.nickname || '-'}</td>
                            
                            {/* 4. 🎯 แผงปุ่มคะแนน 6 กิจกรรมหลัก เรียงหน้ากระดานตรงกลางเป๊ะ ปุ่มไซส์มินิ w-9 h-9 */}
                            <td className="p-4">
                              <div className="flex justify-center items-center gap-4 py-1">
                                {activities.map((act) => {
                                  const currentScore = studentDayScores[act.key] || 0;

                                  return (
                                    <div key={act.key} className="flex flex-col items-center min-w-[105px]">
                                      {/* ป้ายชื่อกิจกรรมย่อยด้านบนปุ่ม */}
                                      <span className="text-[10px] font-bold text-gray-500 mb-1 bg-slate-100 px-2 py-0.5 rounded-full">
                                        {act.label}
                                      </span>
                                      
                                      {/* ปุ่มกดระดับคะแนน 1, 2, 3 ขนาดมินิพรีเมียม w-9 h-9 */}
                                      <div className="flex gap-1">
                                        {[1, 2, 3].map((score) => {
                                          const isSelected = currentScore === score;

                                          let activeStyle = "";
                                          if (isSelected) {
                                            if (score === 1) activeStyle = "bg-rose-500 text-white border-rose-600 font-black shadow-md scale-105";
                                            if (score === 2) activeStyle = "bg-amber-500 text-white border-amber-600 font-black shadow-md scale-105";
                                            if (score === 3) activeStyle = "bg-emerald-500 text-white border-emerald-600 font-black shadow-md scale-105";
                                          } else {
                                            if (score === 1) activeStyle = "border-rose-300 text-rose-500 hover:bg-rose-500 hover:text-white";
                                            if (score === 2) activeStyle = "border-amber-300 text-amber-500 hover:bg-amber-500 hover:text-white";
                                            if (score === 3) activeStyle = "border-emerald-300 text-emerald-500 hover:bg-emerald-500 hover:text-white";
                                          }

                                          return (
                                            <button
                                              key={score}
                                              onClick={() => handleSaveScore(std.id, act.key, score)}
                                              className={`w-9 h-9 text-xs rounded-xl border-2 font-black transition-all transform active:scale-95 ${activeStyle}`}
                                            >
                                              {score}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-gray-400 font-semibold">
                          ❌ ไม่พบข้อมูลนักเรียนในศูนย์และห้องเรียนนี้
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}