"use client";
import { useState } from "react";
import { X, UserCheck, Smartphone, UserCircle } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, phone: string, role: string) => void;
}

export default function AddMemberModal({ isOpen, onClose, onConfirm }: ModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("student");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (name.trim() && phone.trim()) {
      onConfirm(name, phone, role);
      setName("");
      setPhone("");
      setRole("student");
    } else {
      alert("กรุณากรอกชื่อและเบอร์โทรให้ครบครับเพื่อน JP!");
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-[#020617] border-2 border-cyan-500 w-full max-w-md shadow-[0_0_60px_rgba(34,211,238,0.3)] font-mono relative overflow-hidden">
        {/* เลเซอร์สแกนหัวฟอร์ม */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-[scan_2s_linear_infinite]"></div>
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 border-b border-cyan-500/20 pb-4">
            <h3 className="text-white font-black text-sm uppercase tracking-[0.2em] flex items-center gap-2">
              <UserCircle size={18} className="text-cyan-400" /> REGISTER_NEW_UNIT
            </h3>
            <button onClick={onClose} className="text-cyan-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-5">
            {/* Input ชื่อ */}
            <div>
              <label className="text-[10px] block mb-1.5 text-cyan-500/60 font-black uppercase">Identity_Name</label>
              <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black border border-cyan-500/30 p-3 text-cyan-400 text-xs focus:border-cyan-400 outline-none transition-all shadow-[inset_0_0_10px_rgba(34,211,238,0.1)]"
                placeholder="ชื่อ-นามสกุล..."
              />
            </div>
            
            {/* Input เบอร์โทร (แทน Email เดิม) */}
            <div>
              <label className="text-[10px] block mb-1.5 text-cyan-500/60 font-black uppercase">Mobile_Link (Phone)</label>
              <div className="relative">
                <input 
                  value={phone}
                  type="tel"
                  maxLength={10}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-black border border-cyan-500/30 p-3 pl-10 text-cyan-400 text-xs focus:border-cyan-400 outline-none transition-all shadow-[inset_0_0_10px_rgba(34,211,238,0.1)]"
                  placeholder="08X-XXX-XXXX"
                />
                <Smartphone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500/50" />
              </div>
            </div>

            {/* เลือกประเภทสมาชิก */}
            <div>
              <label className="text-[10px] block mb-1.5 text-cyan-500/60 font-black uppercase">Clearance_Level</label>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-black border border-cyan-500/30 p-3 text-cyan-400 text-xs focus:border-cyan-400 outline-none cursor-pointer appearance-none"
              >
                <option value="student">LEVEL_03: STUDENT (นักเรียน)</option>
                <option value="teacher">LEVEL_02: EDUCATOR (ครู)</option>
                <option value="admin">LEVEL_01: SYSTEM_ADMIN (แอดมิน)</option>
              </select>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={handleSubmit}
                className="flex-1 bg-cyan-500 text-black font-black py-4 hover:bg-white transition-all text-[11px] uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
              >
                <UserCheck size={16} /> Confirm_Data
              </button>
              <button 
                onClick={onClose}
                className="px-6 border border-red-500/50 text-red-500 font-black py-4 hover:bg-red-500 hover:text-white transition-all text-[11px] uppercase"
              >
                Abort
              </button>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes scan { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
}