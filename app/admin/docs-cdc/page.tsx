"use client";
import HUDHomeButton from "@/components/HUDHomeButton";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// 🆔 Interface ใหม่ที่อ้างอิงจากตาราง file_metadata ของเพื่อน
interface StorageFile {
  id: string;
  storage_path: string;
  display_name: string;
  zone: string;
  created_at: string;
}

const HUDProgressBar = ({ progress, color }: { progress: number; color: string }) => (
  <div className={`mb-6 p-4 border-2 ${color === 'cyan' ? 'border-cyan-500/50' : 'border-green-500/50'} bg-black/90 relative overflow-hidden ring-1 ring-white/10`}>
    <div className={`absolute inset-0 bg-gradient-to-b ${color === 'cyan' ? 'from-cyan-500/10' : 'from-green-500/10'} to-transparent h-full animate-[scan_2s_linear_infinite]`}></div>
    <div className="flex justify-between items-end mb-2 relative z-10 font-black">
      <span className={`text-[10px] ${color === 'cyan' ? 'text-cyan-400' : 'text-green-400'} uppercase tracking-tighter`}>TRANSMITTING_DATA...</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl ${color === 'cyan' ? 'text-cyan-400' : 'text-green-400'} animate-pulse`}>{progress}</span>
        <span className="text-[10px] opacity-50">%</span>
      </div>
    </div>
    <div className="h-2 w-full bg-black/60 border border-white/5 relative z-10">
      <div className={`h-full ${color === 'cyan' ? 'bg-cyan-500' : 'bg-green-500'} transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.5)]`} style={{ width: `${progress}%` }}></div>
    </div>
  </div>
);

export default function DocumentHub() {
  const [hqSearch, setHqSearch] = useState("");
  const [cdcSearch, setCdcSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTarget, setUploadTarget] = useState("");
  const [allFiles, setAllFiles] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🔄 Fetch Data จากตาราง file_metadata แทนการดึงจาก Storage ตรงๆ
  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('file_metadata')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setAllFiles(data);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  // 🔍 Filter Logic (ตอนนี้ค้นหาเป็นภาษาไทยใน display_name ได้แล้ว!)
  const filteredHQ = useMemo(() => 
    allFiles.filter(f => f.zone === 'hq' && f.display_name.toLowerCase().includes(hqSearch.toLowerCase())), 
    [hqSearch, allFiles]
  );
  
  const filteredCDC = useMemo(() => 
    allFiles.filter(f => f.zone === 'cdc' && f.display_name.toLowerCase().includes(cdcSearch.toLowerCase())), 
    [cdcSearch, allFiles]
  );

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, zoneKey: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const originalName = file.name;
    // ล้างชื่อไฟล์สำหรับเก็บใน Storage (เพื่อความปลอดภัย)
    const safeName = originalName.replace(/[^\x00-\x7F]/g, "").replace(/\s+/g, "_") || "unnamed_file";
    const storageName = `${Date.now()}_${safeName}`;
    const storagePath = `${zoneKey}/${storageName}`;

    setUploadTarget(zoneKey === 'hq' ? 'A' : 'B');
    setIsUploading(true);
    setUploadProgress(10);

    try {
      // 1. อัปโหลดไฟล์ไปที่ Storage
      const { error: storageError } = await supabase.storage
        .from('cdc-documents')
        .upload(storagePath, file);

      if (storageError) throw storageError;
      setUploadProgress(50);

      // 2. บันทึก Metadata ลงตาราง (เก็บชื่อไทยไว้ที่นี่!)
      const { error: dbError } = await supabase
        .from('file_metadata')
        .insert([{
          storage_path: storagePath,
          display_name: originalName,
          zone: zoneKey
        }]);

      if (dbError) throw dbError;

      setUploadProgress(100);
      setTimeout(() => { 
        setIsUploading(false); 
        fetchFiles(); 
      }, 500);

    } catch (err: any) {
      alert("SYSTEM_REJECTION: " + err.message);
      setIsUploading(false);
    }
  };

  const handleDownload = (path: string) => {
    const { data } = supabase.storage.from('cdc-documents').getPublicUrl(path);
    if (data?.publicUrl) window.open(data.publicUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#020617] text-[#22d3ee] p-8 font-mono">
      <header className="mb-12 border-b border-cyan-500/20 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black italic animate-pulse">⚡ CENTRAL_DOC_REPOSITORY</h1>
          <p className="text-[10px] opacity-50 tracking-[0.5em]">THA-BO MUNICIPALITY INTEGRATED SYSTEM</p>
        </div>
        <Link href="/admin" className="text-[10px] border border-cyan-500/30 px-6 py-2 hover:bg-cyan-500 hover:text-black transition-all">RETURN_BASE</Link>
      </header>

      {isLoading ? (
        <div className="py-20 text-center animate-pulse italic opacity-40">SYNCING_DATABASE_NODES...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {[ 
            {id:'A', key:'hq', name:'กองการศึกษา (HQ)', data:filteredHQ, search:hqSearch, setSearch:setHqSearch, color:'cyan'},
            {id:'B', key:'cdc', name:'ศูนย์พัฒนาเด็กเล็ก (CDC)', data:filteredCDC, search:cdcSearch, setSearch:setCdcSearch, color:'green'}
          ].map(zone => (
            <div key={zone.id} className="space-y-6">
              <div className={`flex justify-between items-center border-l-4 ${zone.id === 'A' ? 'border-cyan-500' : 'border-green-500'} pl-4`}>
                <h2 className="text-lg font-black uppercase tracking-tighter">{zone.name}</h2>
                <span className="text-[10px] font-bold px-2 bg-white/10">ZONE_0{zone.id}</span>
              </div>

              <div className="flex gap-2">
                <input type="text" value={zone.search} onChange={e => zone.setSearch(e.target.value)} placeholder="ค้นหาชื่อเอกสารภาษาไทย..." className="flex-1 bg-black/40 border border-white/10 p-2 text-[11px] focus:outline-none focus:border-cyan-500/50" />
                <label className={`cursor-pointer px-4 flex items-center text-[10px] font-bold border ${zone.id === 'A' ? 'border-cyan-500/30 hover:bg-cyan-500' : 'border-green-500/30 hover:bg-green-500'} hover:text-black transition-all`}>
                  UPLOAD+ <input type="file" className="hidden" onChange={e => handleFileUpload(e, zone.key)} disabled={isUploading} />
                </label>
              </div>

              {isUploading && uploadTarget === zone.id && <HUDProgressBar progress={uploadProgress} color={zone.color} />}

              <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {zone.data.length > 0 ? zone.data.map(file => (
                  <div key={file.id} className="group flex justify-between items-center p-3 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
                    <div className="flex flex-col overflow-hidden mr-4">
                      <span className="text-[12px] font-bold group-hover:text-cyan-400 truncate">{file.display_name}</span>
                      <span className="text-[8px] opacity-30 italic">UPLOADED: {new Date(file.created_at).toLocaleString('th-TH')}</span>
                    </div>
                    <button onClick={() => handleDownload(file.storage_path)} className="shrink-0 bg-white text-black px-3 py-1 text-[9px] font-black hover:bg-cyan-500 transition-colors">DOWNLOAD</button>
                  </div>
                )) : <div className="py-10 text-center border border-dashed border-white/5 opacity-20 text-[9px]">-- NO_DATA_IN_THIS_ZONE --</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.2); border-radius: 10px; }
      `}</style>
      <HUDHomeButton />
    </div>
  );
}