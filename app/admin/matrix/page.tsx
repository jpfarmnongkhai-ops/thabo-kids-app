"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase"; 
import AddMemberModal from "@/components/AddMemberModal";
import { 
  UserPlus, Cpu, MessageSquare, Mic, Send, Users, Terminal, Home, ShieldCheck, Activity
} from "lucide-react";

export default function JPUltimateWarRoom() {
  // --- STATES ---
  const [users, setUsers] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [activeFeed, setActiveFeed] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'SYSTEM_ONLINE: JP War Room กลับมาออนไลน์ 100% แล้วครับเพื่อน! ฮ้าาาาา!' }
  ]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const facebookFeeds = [
    { name: "กองการศึกษา", url: "https://www.facebook.com/kongkansuksapp" },
    { name: "ศูนย์ 1 ท่าเสด็จ", url: "https://www.facebook.com/profile.php?id=100063858442351" },
    { name: "ศูนย์ 2 บ้านน้ำโมง", url: "https://www.facebook.com/profile.php?id=61579706492216" }
  ];

  // --- ACTIONS ---
  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // แก้ไข: ดึงข้อมูลจากตารางที่ถูกต้องและโชว์เบอร์โทร
  async function fetchMembers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "admin")
      .order('created_at', { ascending: false });
    
    if (data) setUsers(data);
    if (error) console.error("Fetch Error:", error.message);
  }

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setChatHistory(prev => [...prev, { role: 'user', text: chatInput }]);
    const currentInput = chatInput;
    setChatInput("");
    
    setTimeout(() => {
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        text: `ฮ้าาาาา! รับทราบคำสั่ง "${currentInput}" ครับเพื่อน JP! ระบบ Matrix กำลังประมวลผล...` 
      }]);
    }, 800);
  };

  // แก้ไข: ระบบเพิ่มสมาชิกแบบแยก Role และรองรับเบอร์โทร
  // ✨ โค้ดฉบับ Modify ตามสั่ง: สำหรับเพิ่มสิทธิ์บัญชาการแอดมิน/ครู ลงตาราง profiles เท่านั้น
  const handleAddMember = async (name: string, phone: string, role: string) => {
    try {
      const cleanPhone = phone.trim().replace(/-/g, "");

      // ยิงตรงเข้าตาราง profiles อย่างเดียว ปลอดภัยจากบั๊ก full_name แน่นอน
      const { error } = await supabase
        .from("profiles")
        .insert([{
          id: crypto.randomUUID(), // สยบบั๊ก Not-Null Constraint 
          phone_number: cleanPhone,
          password: "123456",      // รหัสดีฟอลต์เริ่มต้น
          role: role,              // ควบคุมสิทธิ์ผ่านการเลือก role ตรงๆ ตามที่เพื่อนต้องการ
          display_name: name,
          first_name: name,
          last_name: "บัญชาการ",    // นามสกุลระบบชั่วคราว
          center_id: "11",         // สังกัดศูนย์ควบคุมหลัก
          is_first_login: false
        }]);

      if (error) throw error;

      // 🎉 อัปเดต UI ทันทีหลังการ Inject สำเร็จ
      setIsModalOpen(false);
      fetchMembers(); // รีโหลดลิสต์ขวามือให้รายชื่อใหม่เด้งขึ้นมา
      
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        text: `SYSTEM: อนุมัติการเข้าถึงระบบของ "${name}" ในฐานะ [${role.toUpperCase()}] เรียบร้อยแล้วครับเพื่อน JP!` 
      }]);

    } catch (err: any) {
      console.error("War Room Inject Error:", err);
      alert("❌ เกิดข้อผิดพลาดในระบบวอร์รูม: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-[#22d3ee] p-4 font-mono relative overflow-hidden">
      {/* Background Scanline Overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%] pointer-events-none z-50 opacity-20"></div>

      <div className="max-w-[1700px] mx-auto grid grid-cols-12 gap-6 relative z-10">
        
        {/* --- LEFT SIDE: NAV & FEEDS --- */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="border-b border-cyan-500/30 pb-2 text-center bg-cyan-950/20 py-2 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
            <h1 className="text-[14px] font-black text-white uppercase tracking-widest animate-pulse">EDUCATION COMMAND CENTER</h1>
          </div>

          <div className="bg-cyan-500/5 border border-cyan-500/20 p-3 shadow-inner">
            <div className="text-[10px] mb-2 opacity-50 flex items-center gap-2 font-black italic">
              <Cpu size={12} className="text-cyan-400" /> // SYSTEM_NAVIGATOR
            </div>
            <div className="flex flex-col gap-1.5">
              <a href="/" className="p-2 border border-cyan-400 bg-cyan-400/10 hover:bg-cyan-400 hover:text-black transition-all text-[11px] flex justify-between items-center group font-black shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                <span className="flex items-center gap-2"><Home size={14}/> BACK TO HOME</span>
                <span className="text-[8px] opacity-0 group-hover:opacity-100">GO_DIRECT</span>
              </a>
              <div className="p-2 border border-cyan-500/10 hover:bg-cyan-500/10 text-[10px] flex justify-between cursor-pointer group">
                <span className="group-hover:translate-x-1 transition-transform">📁 STUDENT DATABASE</span> <span className="text-green-400 font-bold">READY</span>
              </div>
              <div className="p-2 border border-cyan-500/10 hover:bg-cyan-500/10 text-[10px] flex justify-between cursor-pointer group">
                <span className="group-hover:translate-x-1 transition-transform">📡 STAFF COMMS</span> <span className="text-green-400 font-bold">STABLE</span>
              </div>
            </div>
          </div>

          {/* Facebook Feed Container */}
          <div className="bg-black border border-cyan-500/30 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)] rounded-sm">
            <div className="flex bg-cyan-500/10 border-b border-cyan-500/30">
              {facebookFeeds.map((f, i) => (
                <button 
                  key={i} 
                  onClick={() => setActiveFeed(i)} 
                  className={`flex-1 text-[9px] py-3 transition-all font-black border-r border-cyan-500/20 last:border-none ${activeFeed === i ? 'bg-cyan-500 text-black shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]' : 'hover:bg-cyan-400/20 text-cyan-500/60'}`}
                >
                  FEED_{i+1}
                </button>
              ))}
            </div>
            <div className="relative">
               <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-400/30 z-10 animate-[scan_4s_linear_infinite]"></div>
               <iframe 
                src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(facebookFeeds[activeFeed].url)}&tabs=timeline&width=340&height=400&small_header=true&adapt_container_width=true`}
                className="w-full h-[380px] border-none grayscale-[0.2] contrast-110"
               />
            </div>
          </div>
        </div>

        {/* --- CENTER: AI HOLOGRAM & TERMINAL --- */}
        <div className="col-span-12 lg:col-span-6 flex flex-col items-center">
          {/* Hologram Circle */}
          <div className="relative w-80 h-80 flex items-center justify-center mb-6">
            <div className="absolute inset-0 border-2 border-dashed border-cyan-500/10 rounded-full animate-[spin_30s_linear_infinite]"></div>
            <div className="absolute inset-4 border border-cyan-500/5 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
            
            {/* กลางโฮโลแกรม */}
            <div className="relative w-64 h-64 rounded-full overflow-hidden border-b-4 border-cyan-400/40 shadow-[0_30px_70px_rgba(34,211,238,0.25)] bg-cyan-950/10">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-cyan-400 shadow-[0_0_20px_#22d3ee] z-30 animate-[scan_2.5s_linear_infinite]"></div>
              <img 
                src="https://qcjlohkkcqooenptakdc.supabase.co/storage/v1/object/public/agency-assets/ai-assistant-hud.png" 
                className="w-full h-full object-cover animate-[float_4s_ease-in-out_infinite] scale-110 hue-rotate-[180deg]"
                alt="AI Hologram"
              />
            </div>
          </div>

          {/* Terminal Box */}
          <div className="w-full bg-black/90 border-2 border-cyan-500/40 flex flex-col h-[350px] shadow-[0_0_50px_rgba(0,0,0,0.9)] relative">
            <div className="bg-cyan-500/10 p-2.5 border-b border-cyan-500/20 flex justify-between items-center text-[11px] font-black">
              <span className="flex items-center gap-2"><Terminal size={14} className="text-cyan-400" /> AI_HOLOGRAPHIC_PROTOCOL_V3_JP</span>
              <span className="text-green-500 animate-pulse flex items-center gap-1.5 font-bold tracking-widest uppercase">
                <Activity size={12}/> ENCRYPTED_LINK_ACTIVE
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 text-[12px] custom-scrollbar bg-[rgba(0,0,0,0.4)]">
              {chatHistory.map((m, i) => (
                <div key={i} className={m.role === 'ai' ? 'text-cyan-400' : 'text-white'}>
                  <span className="opacity-40 font-black">[{m.role.toUpperCase()}] &gt;</span> {m.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-cyan-500/20 flex gap-2 bg-[#010409]">
              <input 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="พิมพ์คำสั่งเพื่อควบคุมระบบ Matrix..."
                className="flex-1 bg-transparent border-none outline-none text-cyan-400 placeholder-cyan-900 text-[12px] px-2"
              />
              <button onClick={handleSendMessage} className="bg-cyan-500/20 p-2.5 border border-cyan-500/50 hover:bg-cyan-500 hover:text-black transition-all shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* --- RIGHT SIDE: STAFF LIST & RADAR --- */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-black/60 border border-cyan-500/20 p-4 h-[400px] flex flex-col shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <div className="text-[11px] mb-4 uppercase flex items-center gap-2 border-b border-cyan-500/20 pb-3 font-black tracking-widest text-white">
              <Users size={14} className="text-cyan-400" /> UNIT_DEPLOYMENT_LIST
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
              {users.map((u, i) => (
                <div key={i} className="flex justify-between p-3 bg-cyan-950/20 border-l-4 border-cyan-500 hover:bg-cyan-500/10 transition-all group cursor-default">
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tighter">{u.display_name}</span>
                    <span className="text-[9px] opacity-50 uppercase tracking-[0.2em] font-bold">
                       {u.role || 'GUEST'} | {u.phone_number || 'NO_LINK'}
                    </span>
                  </div>
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_12px_#22c55e]"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Radar Section */}
          <div className="bg-black/60 border border-cyan-500/20 p-5 flex flex-col items-center relative overflow-hidden group">
            <div className="relative w-32 h-32 rounded-full border-2 border-cyan-500/10 overflow-hidden mb-6 bg-cyan-950/30">
                {/* แถบกวาดเรด้า */}
                <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0%,rgba(34,211,238,0.3)_100%)] animate-[spin_3s_linear_infinite]"></div>
                {/* เส้นวงกลมเรด้า */}
                <div className="absolute inset-4 border border-cyan-500/10 rounded-full"></div>
                <div className="absolute inset-10 border border-cyan-500/10 rounded-full"></div>
                <div className="absolute inset-0 flex items-center justify-center text-[9px] opacity-40 font-black tracking-widest group-hover:opacity-100 transition-opacity">SCANNING...</div>
                {/* จุดเป้าหมายปลอมๆ */}
                <div className="absolute top-1/4 right-1/4 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
                <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-cyan-500/10 border-2 border-cyan-500/40 py-4 flex items-center justify-center gap-3 hover:bg-cyan-500 hover:text-black transition-all text-[11px] font-black shadow-[0_0_25px_rgba(34,211,238,0.15)] group"
            >
              <UserPlus size={20} className="group-hover:scale-110 transition-transform" /> REGISTER_NEW_UNIT
            </button>
            <div className="mt-3 text-[9px] opacity-40 tracking-[0.4em] font-black uppercase text-center">Authorized Access Only</div>
          </div>
        </div>
      </div>

      {/* MODAL COMPONENT (ต้องเป็นไฟล์ที่รองรับ phone & role นะครับเพื่อน JP) */}
      <AddMemberModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={handleAddMember} 
      />

      {/* CUSTOM ANIMATIONS */}
      <style jsx>{`
        @keyframes scan { 0% { top: 0%; opacity: 0; } 50% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34, 211, 238, 0.4); border-radius: 10px; }
      `}</style>
    </div>
  );
}