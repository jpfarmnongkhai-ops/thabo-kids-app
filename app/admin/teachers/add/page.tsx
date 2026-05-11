"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddTeacherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    prefix: "นางสาว",
    first_name: "",
    last_name: "",
    nickname: "",
    phone: "",
    center_id: "01",
    room_number: "11", // กำหนดค่าเริ่มต้นเป็นเด็กเล็ก 1/1
    avatar_url: ""
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `teacher-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("agency-assets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("agency-assets")
        .getPublicUrl(filePath);

      setFormData({ ...formData, avatar_url: data.publicUrl });
      setPreviewUrl(data.publicUrl);
    } catch (error: any) {
      alert("อัปโหลดรูปไม่สำเร็จ: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. เพิ่มข้อมูลลงตาราง teachers
    const { error: teacherError } = await supabase
      .from("teachers")
      .insert([formData]);

    if (teacherError) {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูลครู: " + teacherError.message);
    } else {
      // 2. สร้าง Account ในตาราง profiles ให้ครูอัตโนมัติ (รหัส 123456)
      const { error: profileError } = await supabase
        .from("profiles")
        .insert([{
          phone: formData.phone,
          password: "123456", // ตั้งค่าเริ่มต้นให้ตามที่คุยกัน
          display_name: formData.nickname,
          role: "teacher"
        }]);

      if (profileError) {
        console.error("Profile creation error:", profileError.message);
      }

      alert("ยินดีต้อนรับบุคลากรใหม่เข้าสู่ ThaBo Kids System ศูนย์พัฒนาเด็กเล็กเทศบาลเมืองท่าบ่อ ครับ! ✨");
      router.push("/admin/teachers");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF0] p-4 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 flex flex-col items-center">
          <div className="relative group cursor-pointer mb-6">
            <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center text-5xl overflow-hidden border-4 border-white transition-transform group-hover:scale-105">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="animate-bounce-slow">📸</span>
              )}
            </div>
            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} disabled={uploading} />
            <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-xl shadow-lg text-xs font-black">
              {uploading ? "..." : "EDIT"}
            </div>
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter">เพิ่มบุคลากรใหม่</h1>
          <p className="text-indigo-500 font-bold text-xl uppercase ">ศูนย์พัฒนาเด็กเล็กเทศบาลเมืองท่าบ่อ</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur-md rounded-[3.5rem] p-8 md:p-12 shadow-2xl shadow-indigo-100/50 border-4 border-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            <div className="space-y-2">
              <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-2">Prefix / คำนำหน้า</label>
              <select className="w-full p-5 bg-white rounded-2xl font-bold text-slate-700 shadow-inner border-0 focus:ring-4 focus:ring-indigo-100 transition-all appearance-none" value={formData.prefix} onChange={(e) => setFormData({...formData, prefix: e.target.value})}>
                <option value="นางสาว">นางสาว</option>
                <option value="นาง">นาง</option>
                <option value="นาย">นาย</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-2">Nickname / ชื่อเล่น</label>
              <input type="text" placeholder="เช่น ครูดา" className="w-full p-5 bg-white rounded-2xl font-bold text-slate-700 shadow-inner border-0 focus:ring-4 focus:ring-pink-100 transition-all placeholder:text-slate-300" value={formData.nickname} onChange={(e) => setFormData({...formData, nickname: e.target.value})} required />
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-2">First Name / ชื่อจริง</label>
              <input type="text" className="w-full p-5 bg-white rounded-2xl font-bold text-slate-700 shadow-inner border-0 focus:ring-4 focus:ring-emerald-100 transition-all" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} required />
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-2">Last Name / นามสกุล</label>
              <input type="text" className="w-full p-5 bg-white rounded-2xl font-bold text-slate-700 shadow-inner border-0 focus:ring-4 focus:ring-emerald-100 transition-all" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} required />
            </div>

            {/* เพิ่มช่องเลือกห้องเรียน */}
            <div className="space-y-2">
              <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-2">Classroom / ห้องเรียน</label>
              <select 
                className="w-full p-5 bg-white rounded-2xl font-bold text-slate-700 shadow-inner border-0 focus:ring-4 focus:ring-orange-100 transition-all appearance-none"
                value={formData.room_number}
                onChange={(e) => setFormData({...formData, room_number: e.target.value})}
              >
                <option value="11">เด็กเล็ก 1/1</option>
                <option value="12">เด็กเล็ก 1/2</option>
                <option value="21">อนุบาล 1/1</option>
                <option value="22">อนุบาล 1/2</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-2">Center / สังกัดศูนย์</label>
              <select className="w-full p-5 bg-white rounded-2xl font-bold text-slate-700 shadow-inner border-0 focus:ring-4 focus:ring-violet-100 transition-all appearance-none" value={formData.center_id} onChange={(e) => setFormData({...formData, center_id: e.target.value})}>
                <option value="01">ศูนย์ท่าเสด็จ</option>
                <option value="11">ศูนย์ท่าเสด็จ (เพิ่มเติม)</option>
                <option value="02">ศูนย์บ้านน้ำโมง</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-2">Phone / เบอร์โทรศัพท์</label>
              <input type="tel" placeholder="08X-XXXXXXX" className="w-full p-5 bg-white rounded-2xl font-bold text-slate-700 shadow-inner border-0 focus:ring-4 focus:ring-amber-100 transition-all placeholder:text-slate-300" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
            </div>

          </div>

          <button type="submit" disabled={loading || uploading} className="w-full mt-12 p-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl hover:bg-indigo-600 hover:-translate-y-1 transition-all shadow-2xl shadow-indigo-200 disabled:bg-slate-200">
            {loading ? "กำลังจัดทำประวัติ..." : "ยืนยันการเพิ่มบุคลากร 🚀"}
          </button>
        </form>

        <div className="mt-10 text-center">
          <Link href="/admin/teachers" className="text-slate-400 font-bold text-[10px] hover:text-indigo-500 transition-colors uppercase tracking-[0.4em]">
            ← BACK TO TEACHER LIST
          </Link>
        </div>
      </div>
    </div>
  );
}