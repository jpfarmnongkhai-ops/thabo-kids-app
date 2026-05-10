"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; 
import Link from "next/link";

export default function SuperAdminCommandHUD() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    const { data } = await supabase.from("profiles").select("*");
    if (data) setUsers(data);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#020617] text-[#22d3ee] p-4 font-mono overflow-hidden relative">
      {/* --- HUD FRAME DECOR --- */}
      <div className="fixed inset-4 border-2 border-[#22d3ee]/30 rounded-sm pointer-events-none shadow-[0_0_20px_rgba(34,211,238,0.1)]"></div>
      <div className="fixed inset-6 border border-[#22d3ee]/10 rounded-sm pointer-events-none"></div>

      <div className="max-w-[1600px] mx-auto relative z-10 grid grid-cols-12 gap-6 h-full">
        
        {/* --- LEFT COLUMN: NAVIGATOR & FB MONITOR --- */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="border-b-2 border-[#22d3ee] pb-2 pt-4">
             <h2 className="text-center text-l font-black uppercase text-white">กองการศึกษา เทศบาลเมืองท่าบ่อ</h2>
          </div>

          <div className="bg-[#22d3ee]/5 border border-[#22d3ee]/20 p-4 text-cyan-400">
            <p className="text-[10px] mb-2 opacity-50 tracking-tighter">// SYSTEM_NAVIGATOR</p>
            <nav className="flex flex-col gap-2">
              <NavLink href="/admin/students" label="Student Database" icon="📁" status="READY" />
              <NavLink href="/admin/teachers" label="Staff Comms" icon="📡" status="STABLE" />
              <NavLink href="/director" label="Strategic Analytics" icon="📈" status="ACTIVE" />
              <NavLink href="/admin/attendance" label="Daily Attendance" icon="⏱️" status="SYNCING" />
            </nav>
          </div>

          {/* Facebook Feed Monitor: กองการศึกษา (แบบแจ่ม!) */}
          <div className="p-2 border border-[#22d3ee]/20 bg-black/40 relative">
            <p className="text-[9px] mb-2 opacity-50 tracking-tighter text-[#22d3ee]">// LIVE_FEED: EDUCATION_OFFICE_THABO</p>
            <div className="relative w-full h-[400px] border border-[#22d3ee]/30 overflow-hidden bg-white/5 group">
                <iframe 
                  src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fkongkansuksapp&tabs=timeline&width=340&height=400&small_header=true&adapt_container_width=true&hide_cover=true&show_facepile=false" 
                  className="absolute inset-0 w-full h-full filter grayscale-[0.7] brightness-[0.7] contrast-[1.3] hover:grayscale-0 hover:brightness-100 transition-all duration-700"
                  style={{ border: 'none', overflow: 'hidden' }} 
                  scrolling="yes" 
                  frameBorder="0" 
                  allowFullScreen={true} 
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                ></iframe>
                
                {/* Scanner Overlay Line */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-[#22d3ee]/50 shadow-[0_0_15px_#22d3ee] animate-[scan_6s_linear_infinite] pointer-events-none"></div>
                {/* HUD Corners */}
                <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#22d3ee]/50 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#22d3ee]/50 pointer-events-none"></div>
            </div>
            <div className="flex justify-between text-[8px] mt-2 font-black opacity-50">
                <span className="text-[#22d3ee]">REF_ID: KONG_KAN_SUKSA_FB</span>
                <span className="animate-pulse">CONNECTED</span>
            </div>
          </div>
        </div>

        {/* --- CENTER COLUMN: CORE HUD & LOGO --- */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          <div className="relative h-[400px] flex items-center justify-center border-x border-[#22d3ee]/10">
             <div className="absolute w-72 h-72 border border-[#22d3ee]/20 rounded-full animate-[spin_30s_linear_infinite]"></div>
             <div className="absolute w-64 h-64 border-2 border-dashed border-[#22d3ee]/40 rounded-full animate-[spin_15s_linear_reverse_infinite]"></div>

             <div className="relative w-48 h-48 group">
                <div className="absolute inset-0 z-20 overflow-hidden rounded-full pointer-events-none">
                   <div className="w-full h-[2px] bg-[#22d3ee] shadow-[0_0_15px_#22d3ee] animate-[scan_3s_ease-in-out_infinite] opacity-70"></div>
                </div>
                <div className="absolute inset-0 bg-[#22d3ee]/10 rounded-full blur-2xl animate-pulse"></div>
                <img 
                  src="https://qcjlohkkcqooenptakdc.supabase.co/storage/v1/object/public/agency-assets/logo-jp.png" 
                  className="relative z-10 w-full h-full object-contain p-4 filter brightness-110 saturate-125 transition-transform duration-500 group-hover:scale-110"
                />
             </div>

             <div className="absolute bottom-4 text-center">
                <h2 className="text-xl font-black text-white drop-shadow-md">Tha Bo Municipality Child Development Center</h2>
                <div className="flex items-center justify-center gap-2 mt-1">
                   <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                   <p className="text-[9px] font-bold text-[#22d3ee]/80 uppercase tracking-widest">System Integrity: 100%</p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {users.map(user => (
              <div key={user.id} className="bg-black/40 border border-[#22d3ee]/10 p-3 hover:border-[#22d3ee]/50 transition-all group">
                <div className="flex justify-between items-start">
                   <div>
                      <p className="text-[8px] opacity-40">UID_{user.id?.substring(0,6)}</p>
                      <h3 className="text-xs font-bold text-white uppercase group-hover:text-[#22d3ee]">{user.display_name || user.first_name || 'System User'}</h3>
                   </div>
                   <span className="text-[8px] bg-[#22d3ee]/10 px-1.5 py-0.5 border border-[#22d3ee]/20 text-[#22d3ee]">{user.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- RIGHT COLUMN: STRATEGIC INTEL --- */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
           <div className="border border-[#22d3ee]/20 p-4 h-64 relative overflow-hidden bg-black/40">
              <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(transparent,transparent_2px,rgba(34,211,238,0.05)_2px,rgba(34,211,238,0.05)_4px)]"></div>
              <p className="text-[9px] mb-4 uppercase tracking-widest text-[#22d3ee]">Strategic Intelligence</p>
              <p className="text-[10px] leading-relaxed opacity-70">
                Data synchronization active. Monitoring municipal registration flow and automated system protocols...
              </p>
           </div>

           <div className="border border-[#22d3ee]/20 p-4 flex flex-col items-center bg-black/40">
              <div className="w-32 h-32 rounded-full border border-[#22d3ee]/30 relative overflow-hidden mb-4">
                 <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0%,rgba(34,211,238,0.3)_100%)] animate-[spin_4s_linear_infinite]"></div>
                 <div className="absolute top-1/2 w-full h-[1px] bg-[#22d3ee]/20"></div>
                 <div className="absolute left-1/2 h-full w-[1px] bg-[#22d3ee]/20"></div>
              </div>
              <p className="text-[8px] tracking-[0.5em] font-black uppercase text-[#22d3ee]">Area Scan Active</p>
           </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #22d3ee; border-radius: 10px; }
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(400px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function NavLink({ href, label, icon, status }: any) {
  return (
    <Link href={href} className="flex items-center justify-between p-3 border border-[#22d3ee]/10 hover:border-[#22d3ee] hover:bg-[#22d3ee]/10 transition-all group">
      <div className="flex items-center gap-3">
        <span className="text-sm grayscale group-hover:grayscale-0">{icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-[8px] font-black text-green-400 group-hover:animate-pulse">{status}</span>
    </Link>
  );
}