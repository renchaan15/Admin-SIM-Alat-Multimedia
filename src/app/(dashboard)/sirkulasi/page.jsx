// src/app/(dashboard)/sirkulasi/page.js
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { 
  RefreshCcw, 
  AlertTriangle, 
  Settings, 
  CheckCircle2, 
  Clock, 
  User, 
  CalendarDays,
  Loader2,
  Package,
  History,
  X,
  ExternalLink
} from "lucide-react";

export default function SirkulasiPage() {
  const [activeTab, setActiveTab] = useState("aktif"); // "aktif" atau "riwayat"
  const [loading, setLoading] = useState(true);
  const [groupedActive, setGroupedActive] = useState([]);
  const [groupedHistory, setGroupedHistory] = useState([]);
  
  // State untuk Modal Aksi Manual (Force Majeure)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ================= FIREBASE LISTENER & LOGIKA KETERLAMBATAN =================
  useEffect(() => {
    const txRef = collection(db, "transactions");
    
    const unsubscribe = onSnapshot(txRef, (snapshot) => {
      const fetchedTx = snapshot.docs.map(doc => ({
        id_transaksi: doc.id,
        ...doc.data()
      }));

      // Pisahkan transaksi berdasarkan tab (abaikan yang masih 'menunggu_acc')
      const txAktif = fetchedTx.filter(tx => ["disetujui", "aktif_dipinjam"].includes(tx.status_pinjam));
      const txRiwayat = fetchedTx.filter(tx => ["selesai", "ditolak"].includes(tx.status_pinjam));

      // Fungsi Helper untuk mengelompokkan dan menghitung keterlambatan
      const processGroups = (txArray, isAktifTab) => {
        const groups = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        txArray.forEach(tx => {
          const groupKey = `${tx.user_id}_${tx.kegiatan}`;
          const tglKembali = tx.tgl_kembali?.toDate() || new Date();
          tglKembali.setHours(0, 0, 0, 0);
          
          // Hitung keterlambatan (Hanya berlaku untuk tab aktif)
          let lateDays = 0;
          let isLate = false;
          if (isAktifTab && today > tglKembali) {
            const diffTime = Math.abs(today - tglKembali);
            lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            isLate = true;
          }

          if (!groups[groupKey]) {
            groups[groupKey] = {
              groupId: groupKey,
              nama_peminjam: tx.nama_peminjam || "Siswa Tidak Diketahui",
              kegiatan: tx.kegiatan || "Praktikum Umum",
              tgl_ambil: tx.tgl_ambil?.toDate() || new Date(),
              tgl_kembali: tx.tgl_kembali?.toDate() || new Date(),
              status_grup: tx.status_pinjam,
              isLate: isLate,
              lateDays: lateDays,
              items: [],
            };
          }
          groups[groupKey].items.push(tx);
          
          // Jika satu alat terlambat, tandai seluruh grup terlambat
          if (isLate) {
            groups[groupKey].isLate = true;
            groups[groupKey].lateDays = Math.max(groups[groupKey].lateDays, lateDays);
          }
        });

        const groupArray = Object.values(groups);
        
        // SORTING: Yang terlambat dipaksa naik ke urutan paling atas!
        if (isAktifTab) {
          groupArray.sort((a, b) => {
            if (a.isLate && !b.isLate) return -1;
            if (!a.isLate && b.isLate) return 1;
            return b.tgl_kembali - a.tgl_kembali; // Sisanya urut berdasarkan tanggal
          });
        } else {
          groupArray.sort((a, b) => b.tgl_kembali - a.tgl_kembali); // Riwayat terbaru di atas
        }

        return groupArray;
      };

      setGroupedActive(processGroups(txAktif, true));
      setGroupedHistory(processGroups(txRiwayat, false));
      setLoading(false);
    }, (error) => {
      console.error("Gagal menarik data sirkulasi:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (dateObj) => {
    return dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // ================= LOGIKA AKSI MANUAL (FORCE MAJEURE) =================
  const handleOpenAksi = (grup) => {
    setSelectedGroup(grup);
    setIsModalOpen(true);
  };

  const handleForceUpdateStatus = async (newStatus) => {
    const statusText = newStatus === 'aktif_dipinjam' ? 'Sedang Dipinjam' : 
                       newStatus === 'selesai' ? 'Selesai Dikembalikan' : 'Dibatalkan';
    
    const confirm = window.confirm(`PERINGATAN AKSI PAKSA:\nAnda yakin ingin mengubah status seluruh alat pada grup ini menjadi "${statusText}" tanpa scan QR?`);
    if (!confirm) return;

    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      
      selectedGroup.items.forEach(item => {
        const txRef = doc(db, "transactions", item.id_transaksi);
        batch.update(txRef, {
          status_pinjam: newStatus,
          updated_at: serverTimestamp()
        });
      });

      await batch.commit();
      setIsModalOpen(false);
      setSelectedGroup(null);
    } catch (error) {
      console.error("Error Force Update:", error);
      alert("Gagal melakukan aksi manual.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <style>{`
        /* COMPONENT SPECIFIC STYLES - PIXEL GEAR TEMA */
        .pg-page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding-bottom: 24px;
        }
        
        .pg-page-title h2 {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }
        
        .pg-page-title p {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        /* TABS */
        .pg-tabs-wrap {
          display: flex;
          background: rgba(255,255,255,0.02);
          padding: 6px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
        }
        .pg-tab-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 24px;
          font-family: 'Syne', sans-serif;
          font-size: 13px; font-weight: 600;
          border-radius: 8px; border: none; background: transparent;
          color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.2s;
        }
        .pg-tab-btn:hover { color: #fff; }
        .pg-tab-btn.active {
          background: rgba(16,185,129,0.1);
          color: #10b981;
          box-shadow: 0 0 15px rgba(16,185,129,0.1);
        }

        /* CARDS */
        .pg-circ-list {
          display: flex; flex-direction: column; gap: 16px;
        }

        .pg-circ-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          overflow: hidden;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }
        .pg-circ-card:hover { border-color: rgba(255,255,255,0.1); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5); }
        
        .pg-circ-card.late {
          border-color: rgba(239,68,68,0.4);
          background: rgba(239,68,68,0.02);
          box-shadow: 0 0 20px rgba(239,68,68,0.1);
        }

        .pg-circ-header {
          padding: 20px 24px;
          display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .pg-circ-card.late .pg-circ-header { border-bottom-color: rgba(239,68,68,0.1); }

        .pg-header-left { display: flex; align-items: flex-start; gap: 16px; }
        
        .pg-user-avatar {
          width: 48px; height: 48px;
          border-radius: 12px;
          background: rgba(6,182,212,0.1);
          border: 1px solid rgba(6,182,212,0.2);
          color: #06b6d4;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; box-shadow: inset 0 0 10px rgba(6,182,212,0.1);
        }
        .pg-circ-card.late .pg-user-avatar {
          background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.2); color: #ef4444;
          box-shadow: inset 0 0 10px rgba(239,68,68,0.1);
        }

        .pg-user-info h3 {
          font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #fff; margin: 0 0 6px 0;
          display: flex; align-items: center; gap: 12px;
        }

        .pg-badge-late {
          background: #ef4444; color: #fff;
          font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 700;
          padding: 4px 8px; border-radius: 6px;
          display: inline-flex; align-items: center; gap: 4px;
          animation: pulseLate 1.5s infinite;
        }
        @keyframes pulseLate {
          0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          70% { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }

        .pg-meta-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
        .pg-meta-tag {
          display: flex; align-items: center; gap: 6px;
          font-family: 'Space Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase;
        }
        .pg-status-badge {
          font-family: 'Space Mono', monospace; font-size: 9px; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;
          background: rgba(6,182,212,0.1); color: #06b6d4; border: 1px solid rgba(6,182,212,0.2);
        }

        .pg-header-right { display: flex; align-items: center; gap: 24px; }
        .pg-duration-box { text-align: right; }
        .pg-duration-label { font-family: 'Space Mono', monospace; font-size: 9px; color: rgba(255,255,255,0.3); text-transform: uppercase; margin-bottom: 4px; }
        .pg-duration-value {
          font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 700; color: #e2e8f0;
          display: flex; align-items: center; justify-content: flex-end; gap: 8px;
        }
        .pg-circ-card.late .pg-duration-value { color: #ef4444; }

        .pg-actions { display: flex; align-items: center; gap: 8px; }
        .pg-btn-detail {
          display: flex; align-items: center; gap: 8px;
          background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); color: #10b981;
          padding: 8px 16px; border-radius: 8px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
        }
        .pg-btn-detail:hover { background: rgba(16,185,129,0.2); border-color: #10b981; color: #fff; }
        
        .pg-btn-icon {
          width: 36px; height: 36px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.5); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;
        }
        .pg-btn-icon:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .pg-circ-card.late .pg-btn-icon { border-color: rgba(239,68,68,0.2); color: #ef4444; }
        .pg-circ-card.late .pg-btn-icon:hover { background: rgba(239,68,68,0.1); border-color: #ef4444; }

        /* ITEMS GRID */
        .pg-circ-body { padding: 20px 24px; background: rgba(0,0,0,0.1); }
        .pg-req-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
        .pg-req-item {
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; gap: 16px;
        }
        .pg-circ-card.late .pg-req-item { background: #080c14; border-color: rgba(239,68,68,0.15); }
        .pg-req-item-icon {
          width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.3); flex-shrink: 0;
        }
        .pg-req-item-info h4 { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600; color: #fff; margin: 0 0 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pg-req-item-info p { font-family: 'Space Mono', monospace; font-size: 9px; color: rgba(255,255,255,0.4); margin: 0; }

        /* STATE PANELS */
        .pg-state-panel {
          background: rgba(255,255,255,0.01); border: 1px dashed rgba(255,255,255,0.1); border-radius: 16px; padding: 60px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .pg-state-icon {
          width: 64px; height: 64px; border-radius: 50%; background: rgba(16,185,129,0.05); color: #10b981; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 0 30px rgba(16,185,129,0.1);
        }
        .pg-state-icon.history { background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.2); box-shadow: none; }
        .pg-state-panel h3 { font-family: 'Syne', sans-serif; font-size: 16px; color: #fff; margin: 0 0 8px 0; }
        .pg-state-panel p { font-family: 'Space Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.4); margin: 0; text-transform: uppercase; letter-spacing: 0.1em; }

        /* MODAL STYLES (OVERRIDE DARI INVENTARIS) */
        .pg-modal-backdrop { position: fixed; inset: 0; z-index: 50; background: rgba(2, 4, 8, 0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; }
        .pg-modal-content { background: #080c14; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; width: 100%; max-width: 450px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5), 0 0 40px rgba(245,158,11,0.05); overflow: hidden; }
        .pg-modal-header { padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; background: rgba(245,158,11,0.05); }
        .pg-modal-header h3 { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #f59e0b; margin: 0; display: flex; align-items: center; gap: 8px; }
        .pg-modal-close { background: transparent; border: none; color: rgba(255,255,255,0.4); cursor: pointer; transition: color 0.2s; }
        .pg-modal-close:hover { color: #fff; }
        .pg-modal-body { padding: 24px; }
        
        .pg-notice {
          background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); border-radius: 8px; padding: 12px; margin-bottom: 20px;
          font-family: 'Space Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.7); line-height: 1.6;
        }
        .pg-notice strong { color: #f59e0b; }

        .pg-force-btn {
          width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-radius: 12px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; margin-bottom: 12px; border: 1px solid transparent; background: transparent;
        }
        .pg-force-btn-blue { border-color: rgba(59,130,246,0.3); color: #3b82f6; }
        .pg-force-btn-blue:hover:not(:disabled) { background: rgba(59,130,246,0.1); border-color: #3b82f6; box-shadow: 0 0 15px rgba(59,130,246,0.1); }
        
        .pg-force-btn-emerald { border-color: rgba(16,185,129,0.3); color: #10b981; }
        .pg-force-btn-emerald:hover:not(:disabled) { background: rgba(16,185,129,0.1); border-color: #10b981; box-shadow: 0 0 15px rgba(16,185,129,0.1); }
        
        .pg-force-btn-red { border-color: rgba(239,68,68,0.2); color: rgba(255,255,255,0.5); margin-top: 24px; }
        .pg-force-btn-red:hover:not(:disabled) { background: rgba(239,68,68,0.1); border-color: #ef4444; color: #ef4444; }

        .pg-force-btn:disabled { opacity: 0.5; cursor: not-allowed; filter: grayscale(100%); }
        .pg-btn-inner { display: flex; align-items: center; gap: 10px; }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .pg-page-header { flex-direction: column; gap: 20px; }
          .pg-tabs-wrap { width: 100%; justify-content: space-between; }
          .pg-tab-btn { flex: 1; justify-content: center; }
          .pg-circ-header { flex-direction: column; align-items: flex-start; gap: 16px; }
          .pg-header-right { width: 100%; justify-content: space-between; }
          .pg-duration-box { text-align: left; }
          .pg-duration-value { justify-content: flex-start; }
          .pg-req-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div>
        {/* HEADER & TABS */}
        <div className="pg-page-header">
          <div className="pg-page-title">
            <h2>Sirkulasi Logistik</h2>
            <p>Pantau barang keluar, status perizinan, dan riwayat pengembalian.</p>
          </div>
          
          <div className="pg-tabs-wrap">
            <button 
              onClick={() => setActiveTab("aktif")}
              className={`pg-tab-btn ${activeTab === "aktif" ? "active" : ""}`}
            >
              <RefreshCcw size={16} /> Sirkulasi Aktif
            </button>
            <button 
              onClick={() => setActiveTab("riwayat")}
              className={`pg-tab-btn ${activeTab === "riwayat" ? "active" : ""}`}
            >
              <History size={16} /> Riwayat Selesai
            </button>
          </div>
        </div>

        {/* KONTEN TAB */}
        <div className="pg-circ-list">
          {loading ? (
            <div className="pg-state-panel">
              <Loader2 className="animate-spin" size={32} color="#10b981" style={{ marginBottom: 16 }} />
              <p>Membaca Protokol Sirkulasi...</p>
            </div>
          ) : activeTab === "aktif" && groupedActive.length === 0 ? (
            <div className="pg-state-panel">
              <div className="pg-state-icon">
                <CheckCircle2 size={32} />
              </div>
              <h3>Sistem Clear</h3>
              <p>Semua aset logistik berada di dalam pangkalan (Laboratorium).</p>
            </div>
          ) : activeTab === "riwayat" && groupedHistory.length === 0 ? (
            <div className="pg-state-panel">
              <div className="pg-state-icon history">
                <History size={32} />
              </div>
              <p>Database riwayat transaksi kosong.</p>
            </div>
          ) : (
            /* MAPPING KARTU TRANSAKSI */
            (activeTab === "aktif" ? groupedActive : groupedHistory).map((grup) => (
              <div key={grup.groupId} className={`pg-circ-card ${grup.isLate ? 'late' : ''}`}>
                
                {/* Header Kartu */}
                <div className="pg-circ-header">
                  <div className="pg-header-left">
                    <div className="pg-user-avatar">
                      <User size={24} strokeWidth={2} />
                    </div>
                    <div className="pg-user-info">
                      <h3>
                        {grup.nama_peminjam}
                        {grup.isLate && (
                          <span className="pg-badge-late">
                            <AlertTriangle size={10} /> TERLAMBAT {grup.lateDays} HARI
                          </span>
                        )}
                      </h3>
                      <div className="pg-meta-tags">
                        <span className="pg-meta-tag"><Clock size={12} /> {grup.kegiatan}</span>
                        <span className="pg-status-badge">
                          {grup.status_grup === 'disetujui' ? 'Menunggu Diambil' : grup.status_grup === 'aktif_dipinjam' ? 'Sedang Dipinjam' : grup.status_grup}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pg-header-right">
                    <div className="pg-duration-box">
                      <div className="pg-duration-label">Jadwal Kembali</div>
                      <div className="pg-duration-value">
                        <CalendarDays size={14} /> {formatDate(grup.tgl_kembali)}
                      </div>
                    </div>
                    
                    <div className="pg-actions">
                      <Link href={`/detail/${grup.items[0]?.id_transaksi}`} style={{ textDecoration: 'none' }}>
                        <button className="pg-btn-detail" title="Lihat Detail & Foto Verifikasi">
                          Detail <ExternalLink size={14} />
                        </button>
                      </Link>
                      
                      {activeTab === "aktif" && (
                        <button 
                          onClick={() => handleOpenAksi(grup)}
                          className="pg-btn-icon"
                          title="Aksi Manual (Force Update)"
                        >
                          <Settings size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rincian Alat */}
                <div className="pg-circ-body">
                  <div className="pg-req-grid">
                    {grup.items.map((item, idx) => (
                      <div key={idx} className="pg-req-item">
                        <div className="pg-req-item-icon">
                          <Package size={16} />
                        </div>
                        <div className="pg-req-item-info">
                          <h4>{item.nama_alat}</h4>
                          <p>Kuantitas: 1 UNIT</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ================= MODAL AKSI MANUAL (FORCE MAJEURE) ================= */}
        {isModalOpen && selectedGroup && (
          <div className="pg-modal-backdrop">
            <div className="pg-modal-content">
              
              <div className="pg-modal-header">
                <h3><AlertTriangle size={18} /> Sistem Override (Manual)</h3>
                <button onClick={() => setIsModalOpen(false)} className="pg-modal-close"><X size={20}/></button>
              </div>

              <div className="pg-modal-body">
                <div className="pg-notice">
                  Peringatan: Gunakan fitur ini <strong>hanya</strong> jika terjadi kegagalan sistem teknis (kamera rusak, QR tidak terbaca). Aksi ini menimpa protokol keamanan dan mengubah status tanpa verifikasi lapangan.
                </div>

                <button 
                  onClick={() => handleForceUpdateStatus('aktif_dipinjam')}
                  disabled={isProcessing}
                  className="pg-force-btn pg-force-btn-blue"
                >
                  <span className="pg-btn-inner"><RefreshCcw size={16} /> Paksa Status: Sedang Dipinjam</span>
                </button>
                
                <button 
                  onClick={() => handleForceUpdateStatus('selesai')}
                  disabled={isProcessing}
                  className="pg-force-btn pg-force-btn-emerald"
                >
                  <span className="pg-btn-inner"><CheckCircle2 size={16} /> Paksa Status: Selesai Dikembalikan</span>
                </button>

                <button 
                  onClick={() => handleForceUpdateStatus('ditolak')}
                  disabled={isProcessing}
                  className="pg-force-btn pg-force-btn-red"
                >
                  <span className="pg-btn-inner">Batalkan Seluruh Transaksi</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </>
  );
}