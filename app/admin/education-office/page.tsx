"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function EducationOfficeHQ() {
  const [activeFeed, setActiveFeed] = useState(0); // ระบบสลับ Feed
  const [staff, setStaff] = useState([
    { id: 1, name: "นางภรธิดา สุขสวัสดิ์", pos: "ผู้อำนวยการกองการศึกษา", tier: 1, avatar: null },
    { id: 2, name: "นางสุปรียา ธรรมสาร", pos: "นักวิชาการศึกษาชำนาญการ", tier: 2, avatar: null },
    { id: 3, name: "นางสาวณัชยาพร ละทัยนิล", pos: "นักวิชาการศึกษาปฏิบัติการ", tier: 2, avatar: null },
    { id: 4, name: "นายสุรศักดิ์ ชมกลิ่น", pos: "นักสันทนาการปฏิบัติการ", tier: 2, avatar: null },
    { id: 14, name: "STAFF NEW_UNIT", pos: "ตำแหน่งที่เพิ่มใหม่", tier: 2, avatar: null }, 
    { id: 5, name: "Staff L2", pos: "หัวหน้าฝ่ายการเงิน", tier: 3, avatar: null },
    { id: 6, name: "Staff L3", pos: "หัวหน้าฝ่ายกิจกรรม", tier: 3, avatar: null },
    { id: 7, name: "Staff L4", pos: "นักวิชาการ", tier: 3, avatar: null },
    { id: 8, name: "Staff L5", pos: "งานธุรการ", tier: 3, avatar: null },
    { id: 9, name: "Staff R1", pos: "หัวหน้าฝ่ายทะเบียน", tier: 3, avatar: null },
    { id: 10, name: "Staff R2", pos: "หัวหน้าฝ่ายแผนงาน", tier: 3, avatar: null },
    { id: 11, name: "Staff R3", pos: "งานสวัสดิการ", tier: 3, avatar: null },
    { id: 12, name: "Staff R4", pos: "งาน ICT", tier: 3, avatar: null },
    { id: 13, name: "Staff R5", pos: "งานนิเทศ", tier: 3, avatar: null },
  ]);

  // ข้อมูลเฟสบุ๊ค 3 ศูนย์ที่เพื่อนต้องการ
  const facebookFeeds = [
    { name: "กองการศึกษา", url: "https://www.facebook.com/kongkansuksapp" },
    { name: "ศูนย์ 1 ท่าเสด็จ", url: "https://www.facebook.com/profile.php?id=100063858442351" },
    { name: "ศูนย์ 2 บ้านน้ำโมง", url: "https://www.facebook.com/profile.php?id=61579706492216" }
  ];

  const handleAvatarChange = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStaff(prev => prev.map(s => s.id === id ? { ...s, avatar: reader.result as string } : s));
      };
      reader.readAsDataURL(file);
    }
  };

  const MemberCard = ({ member, size = "normal" }: any) => {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
      <div className="group flex flex-col items-center relative">
        <div className={`${size === "large" ? "w-28 h-28" : "w-20 h-20"} border-2 border-[#22d3ee]/40 rounded-full p-1 bg-black shadow-[0_0_15px_rgba(34,211,238,0.2)] group-hover:border-[#22d3ee] transition-all relative overflow-hidden`}>
          <input type="file" ref={inputRef} className="hidden" accept="image/*" onChange={(e) => handleAvatarChange(member.id, e)} />
          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border border-[#22d3ee]/20 relative">
            {member.avatar ? (
              <img src={member.avatar} className="w-full h-full object-cover" alt={member.name} />
            ) : (
              <span className={`${size === "large" ? "text-4xl" : "text-2xl"} opacity-30`}>👤</span>
            )}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(34,211,238,0.1)_50%)] bg-[length:100%_4px] animate-[scan_3s_linear_infinite] pointer-events-none"></div>
            <button 
              onClick={() => inputRef.current?.click()}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold text-cyan-400 backdrop-blur-[2px]"
            >
              EDIT_IMG
            </button>
          </div>
        </div>
        <div className="mt-2 text-center bg-black/60 border border-[#22d3ee]/20 p-1 backdrop-blur-sm min-w-[100px]">
          <p className="text-[9px] font-black text-white leading-tight">{member?.name}</p>
          <p className="text-[7px] text-[#22d3ee] font-bold uppercase tracking-tighter">{member?.pos}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#020617] text-[#22d3ee] p-4 font-mono overflow-hidden relative">
      <div className="fixed inset-4 border-2 border-[#22d3ee]/30 rounded-sm pointer-events-none shadow-[0_0_20px_rgba(34,211,238,0.1)]"></div>

      <div className="max-w-[1600px] mx-auto relative z-10 grid grid-cols-12 gap-6">
        
        {/* --- LEFT COLUMN: NAV & 3-CHANNEL FEED --- */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="border-b-2 border-[#22d3ee] pb-2 text-center">
             <h2 className="text-xs font-black uppercase tracking-widest text-white">Education Department</h2>
          </div>
          
          <div className="bg-[#22d3ee]/5 border border-[#22d3ee]/20 p-4">
            <nav className="flex flex-col gap-2">
              <NavLink href="/" label="GO TO MAIN HUB" icon="🏠" status="SYSTEM" />
              <NavLink href="/admin/matrix" label="Back to Matrix" icon="⬅️" status="READY" />
              <NavLink href="/admin/students" label="Student Database" icon="📁" status="ONLINE" />
              <div className="mt-4 pt-4 border-t border-[#22d3ee]/30">
                <p className="text-[9px] font-black text-[#22d3ee]/60 mb-2 tracking-[0.2em]">DOCUMENT STORAGE</p>
                <NavLink href="/admin/docs-cdc" label="คลังเอกสาร" icon="📂" status="SCHOOL" />
              </div>
            </nav>
          </div>

          {/* แทรกแทนที่ Facebook Feed เดิม ด้วยระบบ 3 ช่อง */}
          <div className="bg-black/60 border border-[#22d3ee]/30 overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.05)]">
            <div className="flex bg-[#22d3ee]/10 border-b border-[#22d3ee]/30">
              {facebookFeeds.map((f, i) => (
                <button 
                  key={i} 
                  onClick={() => setActiveFeed(i)} 
                  className={`flex-1 text-[8px] py-3 transition-all font-black uppercase tracking-tighter ${activeFeed === i ? 'bg-[#22d3ee] text-black shadow-[inset_0_0_10px_rgba(0,0,0,0.3)]' : 'text-[#22d3ee] hover:bg-[#22d3ee]/20'}`}
                >
                  FEED_{i+1}
                </button>
              ))}
            </div>
            <div className="p-2">
              <div className="text-[7px] mb-2 opacity-40 animate-pulse tracking-[0.3em]">
                // LIVE_LINK_ESTABLISHED: {facebookFeeds[activeFeed].name}
              </div>
              <div className="relative w-full h-[380px] border border-[#22d3ee]/20 overflow-hidden bg-white/5">
                <iframe 
                  src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(facebookFeeds[activeFeed].url)}&tabs=timeline&width=340&height=380&small_header=true&adapt_container_width=true&hide_cover=true&show_facepile=false`} 
                  className="absolute inset-0 w-full h-full filter grayscale-[0.5] contrast-[1.1] hover:grayscale-0 transition-all duration-500" 
                  style={{ border: 'none' }} 
                  scrolling="yes" 
                  frameBorder="0" 
                  allowFullScreen={true} 
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                ></iframe>
                {/* เส้นแสกนบน Feed */}
                <div className="absolute top-0 left-0 w-full h-[1.5px] bg-[#22d3ee] shadow-[0_0_15px_#22d3ee] animate-[scan_6s_linear_infinite] pointer-events-none z-20"></div>
              </div>
            </div>
          </div>
        </div>

        {/* --- CENTER COLUMN: ORG CHART (คงเดิมตามความขลัง) --- */}
        <div className="col-span-12 lg:col-span-6 space-y-8">
          <div className="relative border border-[#22d3ee]/10 bg-black/20 p-8 min-h-[85vh] overflow-hidden">
            <div className="absolute top-4 left-8 flex flex-col items-center group">
               <div className="relative w-32 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 border-2 border-[#22d3ee]/20 rounded-full animate-[ping_3s_linear_infinite]"></div>
                  <div className="absolute inset-2 border border-[#22d3ee]/40 rounded-full border-dashed animate-[spin_10s_linear_infinite]"></div>
                  <div className="w-24 h-24 border-2 border-[#22d3ee] rounded-full flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-hidden p-2">
                     <img src="/logo.png" alt="Logo" className="w-full h-full object-contain group-hover:scale-110 transition-all" />
                  </div>
               </div>
            </div>

            <div className="mt-32">
              <div className="flex justify-center mb-12 relative">
                <MemberCard member={staff.find(s => s.tier === 1)} size="large" />
                <div className="absolute top-full left-1/2 w-[1px] h-10 bg-[#22d3ee]/30 -translate-x-1/2"></div>
              </div>
              <div className="flex justify-center gap-12 mb-12 relative border-t border-[#22d3ee]/20 pt-10">
                 {staff.filter(s => s.tier === 2).map(m => (
                    <MemberCard key={m.id} member={m} />
                 ))}
                 <div className="absolute top-full left-1/2 w-[1px] h-10 bg-[#22d3ee]/30 -translate-x-1/2"></div>
              </div>
              <div className="border-t border-[#22d3ee]/10 pt-10">
                <div className="flex flex-wrap justify-center gap-4">
                  {staff.filter(s => s.tier === 3).map(m => (
                    <MemberCard key={m.id} member={m} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: RADAR & INTEL --- */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
           <div className="border border-[#22d3ee]/20 p-4 h-64 relative overflow-hidden bg-black/40 shadow-[inset_0_0_20px_rgba(34,211,238,0.1)]">
              <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(transparent,transparent_2px,rgba(34,211,238,0.05)_2px,rgba(34,211,238,0.05)_4px)]"></div>
              <p className="text-[9px] mb-4 uppercase tracking-widest text-[#22d3ee] font-black">Strategic Intelligence</p>
              <p className="text-[10px] leading-relaxed opacity-70">Monitoring personnel hierarchy and operational stability. Data integrity confirmed by AI_JP_ASSISTANT.</p>
           </div>
           
           <div className="border border-[#22d3ee]/20 p-4 flex flex-col items-center bg-black/40">
              <div className="w-32 h-32 rounded-full border border-[#22d3ee]/30 relative overflow-hidden mb-4 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                 <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0%,rgba(34,211,238,0.3)_100%)] animate-[spin_4s_linear_infinite]"></div>
                 <div className="absolute top-1/2 w-full h-[1px] bg-[#22d3ee]/20"></div>
                 <div className="absolute left-1/2 h-full w-[1px] bg-[#22d3ee]/20"></div>
              </div>
              <p className="text-[8px] tracking-[0.5em] font-black uppercase text-[#22d3ee] animate-pulse">Area Scan Active</p>
           </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan { 0% { transform: translateY(-100%); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(100%); opacity: 0; } }
      `}</style>
    </div>
  );
}

function NavLink({ href, label, icon, status }: any) {
  return (
    <Link href={href} className="flex items-center justify-between p-3 border border-[#22d3ee]/10 hover:border-[#22d3ee] hover:bg-[#22d3ee]/10 transition-all group">
      <div className="flex items-center gap-3">
        <span className="text-sm">{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-[7px] font-black text-green-400 uppercase tracking-tighter">{status}</span>
    </Link>
  );
}