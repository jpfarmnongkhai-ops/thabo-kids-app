"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function EditTeacherPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // State สำหรับเก็บข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    prefix: "",
    first_name: "",
    last_name: "",
    nickname: "",
    phone: "",
    center_id: "",
    room_number: "",
  });

  // 1. ดึงข้อมูลเดิมของคุณครูคนนี้มาโชว์ก่อน
  useEffect(() => {
    async function fetchTeacherData() {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        alert("หาคุณครูไม่เจอครับ JP!");
        router.push("/admin/teachers");
      } else {
        setFormData(data);
      }
      setLoading(false);
    }
    fetchTeacherData();
  }, [id, router]);

  // 2. ฟังก์ชันบันทึกการแก้ไข
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("teachers")
      .update(formData)
      .eq("id", id);

    if (error) {
      alert("อัปเดตไม่สำเร็จ: " + error.message);
    } else {
      alert("อัปเดตข้อมูลเรียบร้อยแล้วครับ JP! ✨");
      router.push("/admin/teachers");
    }
    setSaving(false);
  };

  if (loading) return <div className="p-20 text-center font-black animate-bounce">กำลังดึงข้อมูลคุณครู... 👩‍🏫</div>;

  return (
    <div className="min-h-screen bg-[#FDFCF0] p-6 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-[3rem] shadow-2xl overflow-hidden border-4 border-white">
        {/* Header สไตล์รุ้งตาม โทนสี.png */}
        <div className="h-4 bg-gradient-to-r from-[#AEC6CF] via-[#B4E3B4] via-[#FFF4B5] via-[#FFB7B2] to-[#C3B1E1]"></div>
        
        <form onSubmit={handleUpdate} className="p-10">
          <h1 className="text-3xl font-black text-slate-800 mb-2">แก้ไขข้อมูลคุณครู ✏️</h1>
          <p className="text-slate-400 text-xs font-bold mb-8 uppercase tracking-widest">Update Teacher Profile</p>

          <div className="grid grid-cols-2 gap-6">
            {/* คำนำหน้า */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 ml-2">คำนำหน้า</label>
              <select 
                className="p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-600 focus:ring-4 focus:ring-indigo-100 transition-all"
                value={formData.prefix}
                onChange={(e) => setFormData({...formData, prefix: e.target.value})}
              >
                <option value="นาง">นาง</option>
                <option value="นางสาว">นางสาว</option>
                <option value="นาย">นาย</option>
              </select>
            </div>

            {/* ชื่อเล่น */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 ml-2">ชื่อเล่น</label>
              <input 
                type="text"
                className="p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-600 focus:ring-4 focus:ring-amber-100 transition-all"
                value={formData.nickname}
                onChange={(e) => setFormData({...formData, nickname: e.target.value})}
              />
            </div>

            {/* ชื่อจริง */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 ml-2">ชื่อจริง</label>
              <input 
                type="text"
                className="p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-600 focus:ring-4 focus:ring-indigo-100"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              />
            </div>

            {/* นามสกุล */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 ml-2">นามสกุล</label>
              <input 
                type="text"
                className="p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-600 focus:ring-4 focus:ring-indigo-100"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
              />
            </div>

            {/* ศูนย์ (ยึดตาม logic JP) */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 ml-2">สังกัดศูนย์</label>
              <select 
                className="p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-600"
                value={formData.center_id}
                onChange={(e) => setFormData({...formData, center_id: e.target.value})}
              >
                <option value="01">ศูนย์ 1 ท่าเสด็จ</option>
                <option value="11">ศูนย์ 1 ท่าเสด็จ(เพิ่มเติม)</option>
                <option value="02">ศูนย์ 2 บ้านน้ำโมง</option>
                <option value="12">ศูนย์ 2 บ้านน้ำโมง</option>
              </select>
            </div>

            {/* ห้องเรียน (ยึดตาม logic JP) */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 ml-2">ห้องเรียน</label>
              <select 
                className="p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-600"
                value={formData.room_number}
                onChange={(e) => setFormData({...formData, room_number: e.target.value})}
              >
                <option value="11">เด็กเล็ก 1/1</option>
                <option value="12">เด็กเล็ก 1/2</option>
                <option value="21">อนุบาล 1/1</option>
                <option value="22">อนุบาล 1/2</option>
              </select>
            </div>
          </div>

          <div className="mt-10 flex gap-4">
            <Link href="/admin/teachers" className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-center hover:bg-slate-200 transition-all">ยกเลิก</Link>
            <button 
              type="submit" 
              disabled={saving}
              className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-600 disabled:bg-slate-300 transition-all"
            >
              {saving ? "กำลังบันทึก..." : "ยืนยันการแก้ไข ✅"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}