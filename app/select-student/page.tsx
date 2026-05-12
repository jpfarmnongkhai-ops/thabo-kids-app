"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StudentCardII from "@/components/student/StudentCardII"; // import ตัวใหม่มา!

export default function SelectStudentPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("twin_profiles");
    if (saved) setProfiles(JSON.parse(saved));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-6">
      <div className="w-full max-w-md text-center mb-10">
        <h1 className="text-3xl font-black text-slate-800 mb-2">ยินดีต้อนรับครับ!</h1>
        <p className="text-slate-500">กรุณาเลือกบัญชีนักเรียนเพื่อเข้าสู่ระบบ</p>
      </div>

      <div className="grid gap-4 w-full max-w-md">
        {profiles.map((profile) => (
          <StudentCardII 
  key={profile.id} 
  profile={profile} 
  onSelect={(id) => {
    // 1. บันทึกโปรไฟล์ที่เลือกเข้า user_session จริงๆ เพื่อใช้ในหน้าถัดไป
    localStorage.setItem("user_session", JSON.stringify(profile));
    
    // 2. 🚀 ดีดไปหน้า Dashboard ที่เราเพิ่งสร้าง (อย่าลืมตัว s นะเพื่อน!)
    router.push(`/students/dashboard/${id}`);
  }} 
/>
        ))}
      </div>
    </div>
  );
}