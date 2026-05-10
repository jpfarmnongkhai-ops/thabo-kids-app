"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Smartphone, Terminal } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. ตรวจสอบข้อมูลจากตาราง profiles โดยใช้ Phone เป็น Username
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("phone", username.trim())
      .eq("password", password.trim())
      .single();

    if (error || !data) {
      alert("⚠️ ACCESS DENIED: รหัสผ่านหรือเบอร์โทรไม่ถูกต้อง!");
    } else {
      // 2. บันทึก Session ลง LocalStorage
      localStorage.setItem("user_session", JSON.stringify(data));

      // 🚀 3. LOGIC แยกทางเดิน 5 ระดับ (ร่างทองฉบับสมบูรณ์)
      const role = data.role?.toLowerCase();

      if (role === "super_admin" || role === "admin") {
        // ระดับ 4-5: JP & Admin ไปฐานบัญชาการ Sci-Fi
        router.push("/admin"); 
      } 
      else if (role === "director") {
        // ระดับ 3: ผอ. ไปหน้าสถิติ (ที่ซ่อนแชทไว้)
        router.push("/admin/director");
      } 
      else if (role === "teacher") {
        // ระดับ 2: คุณครู ไปหน้าจัดการเด็กปกติ
        router.push("/"); 
      }
      else {
        // ระดับ 1: อื่นๆ/นักเรียน
        router.push("/profile");
      }
    }
    setLoading(false);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 overflow-hidden relative font-mono text-cyan-400">
      {/* HUD Background Decor */}
      <div className="absolute inset-0 opacity-10" 
           style={{ backgroundImage: 'linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.6)]"></div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md bg-slate-900/40 backdrop-blur-md border border-cyan-500/30 p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        
        {/* HUD Corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500"></div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-cyan-500/50 text-[10px] tracking-[0.3em] mb-4 bg-cyan-950/30">
            <ShieldCheck size={12} /> AUTHENTICATION_REQUIRED
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-2 italic">
            THABO<span className="text-cyan-500">_</span>KIDS
          </h1>
          <p className="text-[10px] text-cyan-700 uppercase tracking-[0.5em]">System_Interface_v1.0</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Username Input */}
          <div className="space-y-1">
            <label className="text-[10px] text-cyan-600 uppercase flex items-center gap-2">
              <Smartphone size={10} /> User_Phone
            </label>
            <input 
              type="text" 
              className="w-full p-3 bg-black/60 border border-cyan-900 text-cyan-100 outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ENTER PHONE NUMBER"
              required
            />
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="text-[10px] text-cyan-600 uppercase flex items-center gap-2">
              <Lock size={10} /> Pass_Key
            </label>
            <input 
              type="password" 
              className="w-full p-3 bg-black/60 border border-cyan-900 text-cyan-100 outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {/* Login Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 relative group"
          >
            {loading ? "INITIALIZING..." : "LOGIN TO SYSTEM"}
            <div className="absolute inset-0 border-2 border-white/20 scale-105 opacity-0 group-hover:opacity-100 transition-all"></div>
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-cyan-950 flex justify-between items-center text-[9px] text-cyan-900">
          <div className="flex items-center gap-1"><Terminal size={10}/> STATUS: READY</div>
          <div>© 2026 THABO_MUNICIPALITY</div>
        </div>
      </div>

      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
    </div>
  );
}