// src/app/(dashboard)/kalender/page.js
"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Package, 
  User, 
  Clock,
  ArrowRightCircle,
  ArrowLeftCircle,
  Loader2
} from "lucide-react";
import Link from "next/link";

export default function KalenderPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // ================= FIREBASE LISTENER =================
  useEffect(() => {
    // Menarik semua transaksi yang aktif atau akan datang
    const q = query(
      collection(db, "transactions"), 
      where("status_pinjam", "in", ["disetujui", "aktif_dipinjam", "menunggu_acc"])
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedData = snapshot.docs.map(doc => ({
        id_transaksi: doc.id,
        ...doc.data()
      }));
      setTransactions(fetchedData);
      setLoading(false);
    }, (error) => {
      console.error("Gagal menarik data kalender:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ================= LOGIKA KALENDER =================
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Fungsi untuk mendapatkan daftar transaksi pada tanggal tertentu
  const getTransactionsForDate = (dateToExclude) => {
    return transactions.filter(tx => {
      if (!tx.tgl_ambil || !tx.tgl_kembali) return false;
      
      const start = tx.tgl_ambil.toDate();
      const end = tx.tgl_kembali.toDate();
      
      // Normalisasi waktu ke jam 00:00:00 untuk perbandingan akurat
      const checkDate = new Date(dateToExclude.getFullYear(), dateToExclude.getMonth(), dateToExclude.getDate()).getTime();
      const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
      const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

      return checkDate >= startDate && checkDate <= endDate;
    });
  };

  // Transaksi untuk tanggal yang diklik (Panel Kanan)
  const selectedDayTransactions = getTransactionsForDate(selectedDate);

  // Helper untuk mengecek status kegiatan hari ini (Ambil atau Kembali?)
  const getActionType = (tx, date) => {
    if (!tx.tgl_ambil || !tx.tgl_kembali) return null;
    const start = tx.tgl_ambil.toDate();
    const end = tx.tgl_kembali.toDate();
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    
    if (checkDate === new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()) return "ambil";
    if (checkDate === new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime()) return "kembali";
    return "berlangsung";
  };

  return (
    <>
      <style>{`
        /* COMPONENT SPECIFIC STYLES - PIXEL GEAR TEMA */
        .pg-page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        
        .pg-page-title h2 {
          font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 700; color: #fff; margin: 0 0 4px 0; letter-spacing: -0.02em;
        }
        
        .pg-page-title p {
          font-family: 'Space Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.4); margin: 0; text-transform: uppercase; letter-spacing: 0.1em;
        }

        /* LAYOUT GRID */
        .pg-kalender-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          align-items: start;
        }

        /* KOTAK KACA UMUM (GLASSMORPHISM) */
        .pg-glass-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          backdrop-filter: blur(10px);
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }

        /* BAGIAN KIRI: KALENDER */
        .pg-cal-container {
          padding: 24px;
        }

        .pg-cal-header {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
        }
        .pg-cal-title {
          font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 10px;
        }
        .pg-cal-nav {
          display: flex; gap: 8px; align-items: center;
        }
        
        .pg-btn-icon {
          width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;
        }
        .pg-btn-icon:hover { background: rgba(255,255,255,0.08); color: #fff; }
        
        .pg-btn-today {
          background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); color: #10b981; padding: 0 16px; height: 36px; border-radius: 10px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
        }
        .pg-btn-today:hover { background: rgba(16,185,129,0.2); border-color: #10b981; color: #fff; box-shadow: 0 0 15px rgba(16,185,129,0.1); }

        .pg-cal-grid {
          display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;
        }
        .pg-cal-dow {
          text-align: center; font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.1em; padding-bottom: 12px;
        }

        .pg-cal-cell {
          height: 100px; padding: 8px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.03); background: rgba(0,0,0,0.2); cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; overflow: hidden; position: relative;
        }
        .pg-cal-cell.empty { background: transparent; border-color: transparent; cursor: default; }
        .pg-cal-cell:not(.empty):hover { border-color: rgba(16,185,129,0.3); background: rgba(255,255,255,0.02); }
        .pg-cal-cell.selected { border-color: #10b981; background: rgba(16,185,129,0.1); box-shadow: inset 0 0 20px rgba(16,185,129,0.05); }

        .pg-cell-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
        
        .pg-date-num {
          width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 6px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.6);
        }
        .pg-date-num.today { background: #10b981; color: #020408; box-shadow: 0 0 10px rgba(16,185,129,0.4); }
        .pg-cal-cell.selected .pg-date-num:not(.today) { color: #10b981; }

        .pg-act-count {
          font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px;
        }

        .pg-cell-events {
          flex: 1; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; scrollbar-width: none;
        }
        .pg-cell-events::-webkit-scrollbar { display: none; }
        
        .pg-event-pill {
          font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 600; padding: 4px 6px; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border-left: 2px solid transparent;
        }
        .pg-event-ambil { background: rgba(59,130,246,0.1); color: #3b82f6; border-left-color: #3b82f6; }
        .pg-event-kembali { background: rgba(239,68,68,0.1); color: #ef4444; border-left-color: #ef4444; }
        .pg-event-berlangsung { background: rgba(16,185,129,0.1); color: #10b981; border-left-color: #10b981; }
        
        .pg-event-more { font-family: 'Space Mono', monospace; font-size: 9px; color: rgba(255,255,255,0.3); padding-left: 4px; }

        /* BAGIAN KANAN: PANEL DETAIL */
        .pg-side-panel {
          display: flex; flex-direction: column; height: 100%; max-height: calc(100vh - 120px);
        }
        .pg-side-header {
          padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.2);
        }
        .pg-side-header p { font-family: 'Space Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 4px 0; }
        .pg-side-header h3 { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: #fff; margin: 0; }

        .pg-side-body {
          padding: 24px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 16px;
        }
        .pg-side-body::-webkit-scrollbar { width: 4px; }
        .pg-side-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

        .pg-tx-card {
          background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; position: relative; overflow: hidden; transition: all 0.2s;
        }
        .pg-tx-card:hover { border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); }
        
        .pg-tx-ribbon {
          position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
        }
        .pg-tx-ribbon.ambil { background: #3b82f6; box-shadow: 0 0 10px rgba(59,130,246,0.5); }
        .pg-tx-ribbon.kembali { background: #ef4444; box-shadow: 0 0 10px rgba(239,68,68,0.5); }
        .pg-tx-ribbon.berlangsung { background: #10b981; box-shadow: 0 0 10px rgba(16,185,129,0.5); }

        .pg-tx-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; padding-left: 8px; }
        .pg-tx-status {
          display: flex; align-items: center; gap: 6px; font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 8px; border-radius: 6px;
        }
        .pg-tx-status.ambil { background: rgba(59,130,246,0.1); color: #3b82f6; border: 1px solid rgba(59,130,246,0.2); }
        .pg-tx-status.kembali { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
        .pg-tx-status.berlangsung { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }

        .pg-btn-detail-mini {
          font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.05); border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; transition: all 0.2s;
        }
        .pg-btn-detail-mini:hover { background: rgba(16,185,129,0.1); color: #10b981; }

        .pg-tx-info { display: flex; gap: 12px; padding-left: 8px; }
        .pg-tx-avatar {
          width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.5); flex-shrink: 0;
        }
        .pg-tx-name { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #fff; margin: 0 0 2px 0; }
        .pg-tx-kegiatan { font-family: 'Syne', sans-serif; font-size: 12px; color: rgba(255,255,255,0.5); margin: 0; }
        
        .pg-tx-alat {
          display: flex; align-items: center; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px dashed rgba(255,255,255,0.05); margin-left: 8px;
        }
        .pg-tx-alat p { font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.8); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* EMPTY STATES */
        .pg-state-panel {
          background: transparent; border: 1px dashed rgba(255,255,255,0.1); border-radius: 16px; padding: 40px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 200px;
        }
        .pg-state-icon {
          width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
        }
        .pg-state-panel h4 { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.7); margin: 0 0 4px 0; }
        .pg-state-panel p { font-family: 'Space Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.4); margin: 0; line-height: 1.5; }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .pg-kalender-layout { grid-template-columns: 1fr; }
          .pg-side-panel { max-height: 500px; }
        }
        @media (max-width: 640px) {
          .pg-cal-cell { height: 80px; padding: 4px; }
          .pg-date-num { width: 20px; height: 20px; font-size: 10px; }
          .pg-event-pill { font-size: 9px; padding: 2px 4px; }
        }
      `}</style>

      <div>
        {/* HEADER */}
        <div className="pg-page-header">
          <div className="pg-page-title">
            <h2>Kalender Sirkulasi</h2>
            <p>Pantau jadwal akuisisi dan restorasi logistik laboratorium</p>
          </div>
        </div>

        <div className="pg-kalender-layout">
          
          {/* ================= BAGIAN KIRI: KALENDER ================= */}
          <div className="pg-glass-card pg-cal-container">
            
            <div className="pg-cal-header">
              <h3 className="pg-cal-title">
                <CalendarIcon size={24} color="#10b981" />
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <div className="pg-cal-nav">
                <button onClick={prevMonth} className="pg-btn-icon"><ChevronLeft size={18} /></button>
                <button onClick={() => setCurrentDate(new Date())} className="pg-btn-today">Hari Ini</button>
                <button onClick={nextMonth} className="pg-btn-icon"><ChevronRight size={18} /></button>
              </div>
            </div>

            {loading ? (
              <div className="pg-state-panel" style={{ border: 'none', height: '400px' }}>
                <Loader2 className="animate-spin" size={32} color="#10b981" style={{ marginBottom: 16 }} />
                <p>Sinkronisasi Timeline...</p>
              </div>
            ) : (
              <div>
                <div className="pg-cal-grid">
                  {dayNames.map(day => (
                    <div key={day} className="pg-cal-dow">{day}</div>
                  ))}
                </div>

                <div className="pg-cal-grid">
                  {/* Sel Kosong */}
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="pg-cal-cell empty"></div>
                  ))}

                  {/* Sel Tanggal */}
                  {Array.from({ length: daysInMonth }).map((_, index) => {
                    const dateNum = index + 1;
                    const loopDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dateNum);
                    
                    const isSelected = selectedDate.getDate() === dateNum && 
                                       selectedDate.getMonth() === currentDate.getMonth() && 
                                       selectedDate.getFullYear() === currentDate.getFullYear();
                    
                    const today = new Date();
                    const isToday = dateNum === today.getDate() && 
                                    currentDate.getMonth() === today.getMonth() && 
                                    currentDate.getFullYear() === today.getFullYear();

                    const dayTransactions = getTransactionsForDate(loopDate);

                    return (
                      <div 
                        key={dateNum} 
                        onClick={() => setSelectedDate(loopDate)}
                        className={`pg-cal-cell ${isSelected ? 'selected' : ''}`}
                      >
                        <div className="pg-cell-top">
                          <span className={`pg-date-num ${isToday ? 'today' : ''}`}>
                            {dateNum}
                          </span>
                          {dayTransactions.length > 0 && (
                            <span className="pg-act-count">{dayTransactions.length}</span>
                          )}
                        </div>

                        <div className="pg-cell-events">
                          {dayTransactions.slice(0, 3).map((tx, i) => {
                            const type = getActionType(tx, loopDate);
                            return (
                              <div key={i} className={`pg-event-pill pg-event-${type}`}>
                                {tx.nama_peminjam?.split(" ")[0] || "Siswa"}
                              </div>
                            );
                          })}
                          {dayTransactions.length > 3 && (
                            <div className="pg-event-more">+{dayTransactions.length - 3} log</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ================= BAGIAN KANAN: PANEL DETAIL ================= */}
          <div className="pg-glass-card pg-side-panel">
            <div className="pg-side-header">
              <p>Jadwal Protokol pada Tanggal</p>
              <h3>{selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
            </div>

            <div className="pg-side-body">
              {selectedDayTransactions.length > 0 ? (
                selectedDayTransactions.map(tx => {
                  const actType = getActionType(tx, selectedDate);
                  
                  return (
                    <div key={tx.id_transaksi} className="pg-tx-card">
                      <div className={`pg-tx-ribbon ${actType}`}></div>
                      
                      <div className="pg-tx-top">
                        <div className={`pg-tx-status ${actType}`}>
                          {actType === "ambil" ? <ArrowRightCircle size={12} /> :
                           actType === "kembali" ? <ArrowLeftCircle size={12} /> :
                           <Clock size={12} />}
                          {actType === "ambil" ? "Jadwal Ambil" : actType === "kembali" ? "Batas Kembali" : "Sedang Dipinjam"}
                        </div>
                        <Link href={`/detail/${tx.id_transaksi}`} style={{ textDecoration: 'none' }}>
                          <button className="pg-btn-detail-mini">DETAIL</button>
                        </Link>
                      </div>

                      <div className="pg-tx-info">
                        <div className="pg-tx-avatar">
                          <User size={18} />
                        </div>
                        <div>
                          <h4 className="pg-tx-name">{tx.nama_peminjam || "Unknown"}</h4>
                          <p className="pg-tx-kegiatan">{tx.kegiatan || "-"}</p>
                        </div>
                      </div>

                      <div className="pg-tx-alat">
                        <Package size={14} color="rgba(255,255,255,0.3)" />
                        <p>{tx.nama_alat || "Hardware Modul"}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="pg-state-panel">
                  <div className="pg-state-icon">
                    <CalendarIcon size={24} />
                  </div>
                  <h4>Sektor Waktu Kosong</h4>
                  <p>Tidak ada logistik masuk atau keluar pada koordinat tanggal ini.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}