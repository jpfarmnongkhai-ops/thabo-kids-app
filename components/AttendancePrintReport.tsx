"use client";
import React from "react";

interface Student {
  student_id_10: string;
  first_name: string;
  last_name: string;
  nickname: string;
}

interface AttendanceReportProps {
  centerName?: string;
  roomLabel?: string;
  teacherName?: string;
  students?: Student[];
  attendance?: { [key: string]: string };
  thaiDate?: string; // 📅 รับค่าวันที่ไทยจากหน้าหลักมาแสดงผลบนหัวกระดาษ
}

export default function AttendancePrintReport({
  centerName = "ศูนย์ 1 ท่าเสด็จ (เพิ่มเติม)",
  roomLabel = "เด็กเล็ก 1/1",
  teacherName = "ครูพัชรินทร์ ดวงดี",
  students = [], 
  attendance = {},
  thaiDate = ""
}: AttendanceReportProps) {

  // 📝 ฟังก์ชันแปลงสถานะภาษาอังกฤษ/ค่าว่าง ให้เป็นภาษาไทยเพื่อการรายงานที่สมบูรณ์
  const getThaiStatus = (status: string) => {
    if (!status || status === "-") return "ยังไม่เช็ค";
    if (status === "present" || status === "มา") return "มา";
    if (status === "absent" || status === "ขาด") return "ขาด";
    if (status === "late" || status === "สาย") return "สาย";
    if (status === "leave" || status === "ลา") return "ลา";
    return status; // คืนค่าเดิมกรณีที่มีการส่งค่าภาษาไทยมาอยู่แล้ว
  };

  // 🎨 ฟังก์ชันกำหนดสีของตัวอักษรตามสถานะภาษาไทย
  const getStatusColor = (thaiStatus: string) => {
    switch (thaiStatus) {
      case "มา": return "#10B981";      // สีเขียวสดใส
      case "ขาด": return "#EF4444";     // สีแดงเด่นชัด
      case "ลา": return "#3B82F6";      // สีฟ้า (เพิ่มเคสใบลา)
      case "สาย": return "#F59E0B";     // สีส้มอมเหลือง
      default: return "#94A3B8";        // สีเทาสำหรับกลุ่มยังไม่เช็คชื่อ
    }
  };

  return (
    <div className="report-print-wrapper">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          body {
            background-color: #FDFCF0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print { display: none !important; }
        }

        .report-container {
          font-family: 'Sarabun', sans-serif;
          color: #334155;
          width: 100%;
          max-width: 210mm;
          margin: 0 auto;
          background-color: #FDFCF0;
        }

        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          border-bottom: 3px solid #A084D6;
          padding-bottom: 10px;
        }

        .header-left h1 {
          margin: 0;
          font-size: 16pt;
          font-weight: 900;
          color: #A084D6;
          letter-spacing: -0.5px;
        }

        .header-left p {
          margin: 4px 0 0 0;
          font-size: 9pt;
          color: #64748B;
          font-weight: bold;
        }

        .report-logo {
          height: 60px;
          width: auto;
          object-fit: contain;
        }

        .info-bar {
          display: flex;
          gap: 20px;
          background: white;
          padding: 8px 15px;
          border-radius: 10px;
          font-size: 9pt;
          font-weight: bold;
          margin-bottom: 12px;
          border: 1px solid #E2E8F0;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          font-size: 9pt;
        }

        .data-table th {
          background-color: #E6E6FA;
          color: #483D8B;
          font-weight: 900;
          padding: 7px 4px;
          border: 1px solid #CBD5E1;
          text-transform: uppercase;
        }

        .data-table td {
          padding: 5px 4px;
          border: 1px solid #CBD5E1;
          text-align: center;
          font-weight: 600;
        }

        .row-even { background-color: #F8FAFC; }
        .text-left { text-align: left !important; padding-left: 10px !important; }
        .status-badge { font-weight: 900; font-size: 9pt; }
      `}</style>

      <div className="report-container">
        {/* ปุ่มสั่งพิมพ์ซ่อนอัตโนมัติเมื่อกดพิมพ์จริง */}
        <div className="no-print" style={{ textAlign: 'right', marginBottom: '15px' }}>
          <button 
            onClick={() => window.print()}
            className="px-6 py-2 bg-[#A084D6] text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
          >
            🖨️ พิมพ์รายงาน (A4)
          </button>
        </div>

        <div className="report-header">
          <div className="header-left">
            <h1>รายงานการเช็คชื่อนักเรียนประจำวัน 📋</h1>
            <p>COMMAND CENTER: ระบบบริหารจัดการศูนย์พัฒนาเด็กเล็กเทศบาลเมืองท่าบ่อ</p>
          </div>
          <img 
            className="report-logo" 
            src="https://qcjlohkkcqooenptakdc.supabase.co/storage/v1/object/public/agency-assets/logo-jp.png" 
            alt="Agency Logo" 
          />
        </div>

        <div className="info-bar">
          <span><strong style={{color: '#A084D6'}}>ศูนย์:</strong> {centerName}</span>
          <span><strong style={{color: '#A084D6'}}>ห้อง:</strong> {roomLabel}</span>
          <span><strong style={{color: '#A084D6'}}>ครูประจำชั้น:</strong> {teacherName}</span>
          {thaiDate && <span><strong style={{color: '#A084D6'}}>ประจำวันที่:</strong> {thaiDate}</span>}
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '7%' }}>ที่</th>
              <th style={{ width: '23%' }}>รหัสประจำตัว</th>
              <th style={{ width: '40%' }}>ชื่อ - นามสกุล</th>
              <th style={{ width: '15%' }}>ชื่อเล่น</th>
              <th style={{ width: '15%' }}>เช็คชื่อ</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => {
              // 🎯 ดึงสถานะดิบจากอ็อบเจกต์มาทำการแปลงให้เป็นภาษาไทยที่สมบูรณ์
              const rawStatus = attendance[student.student_id_10] || "-";
              const thaiStatus = getThaiStatus(rawStatus);

              return (
                <tr key={student.student_id_10} className={index % 2 === 0 ? "" : "row-even"}>
                  <td>{index + 1}</td>
                  <td style={{ color: "#64748B", fontFamily: 'monospace' }}>{student.student_id_10}</td>
                  <td className="text-left">{student.first_name} {student.last_name}</td>
                  <td>{student.nickname}</td>
                  <td>
                    <span className="status-badge" style={{ color: getStatusColor(thaiStatus) }}>
                      {thaiStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}