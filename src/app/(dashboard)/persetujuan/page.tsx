// src/app/(dashboard)/persetujuan/page.js
"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where, writeBatch, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  User, 
  CalendarDays,
  Loader2,
  Package,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

export default function PersetujuanPage() {
  const [groupedRequests, setGroupedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ================= FIREBASE LISTENER =================
  useEffect(() => {
    const q = query(collection(db, "transactions"), where("status_pinjam", "==", "menunggu_acc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTx = snapshot.docs.map(doc => ({
        id_transaksi: doc.id,
        ...doc.data()
      }));

      const groups = {};
      fetchedTx.forEach(tx => {
        const groupKey = `${tx.user_id}_${tx.kegiatan}`; 
        
        if (!groups[groupKey]) {
          groups[groupKey] = {
            groupId: groupKey,
            nama_peminjam: tx.nama_peminjam || "Siswa Tidak Diketahui",
            kegiatan: tx.kegiatan || "Praktikum Umum",
            kelas: tx.kelas || "-",
            tgl_ambil: tx.tgl_ambil?.toDate() || new Date(),
            tgl_kembali: tx.tgl_kembali?.toDate() || new Date(),
            items: [],
          };
        }
        groups[groupKey].items.push(tx);
      });

      setGroupedRequests(Object.values(groups));
      setLoading(false);
    }, (error) => {
      console.error("Gagal menarik data antrean:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ================= LOGIKA ACC MASSAL =================
  const handleAccSemua = async (grup) => {
    const confirm = window.confirm(`Setujui semua peminjaman untuk ${grup.nama_peminjam}?`);
    if (!confirm) return;

    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      
      grup.items.forEach(item => {
        const txRef = doc(db, "transactions", item.id_transaksi);
        batch.update(txRef, {
          status_pinjam: "disetujui",
          updated_at: serverTimestamp()
        });
      });

      await batch.commit();
      setExpandedId(null);
    } catch (error) {
      console.error("Error ACC Massal:", error);
      alert("Gagal menyetujui pengajuan.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ================= LOGIKA TOLAK MASSAL =================
  const handleTolakSemua = async (grup) => {
    const confirm = window.confirm(`Tolak dan batalkan peminjaman untuk ${grup.nama_peminjam}?`);
    if (!confirm) return;

    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      
      grup.items.forEach(item => {
        const txRef = doc(db, "transactions", item.id_transaksi);
        batch.update(txRef, {
          status_pinjam: "ditolak",
          updated_at: serverTimestamp()
        });
      });

      await batch.commit();
      setExpandedId(null);
    } catch (error) {
      console.error("Error Tolak Massal:", error);
      alert("Gagal menolak pengajuan.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleAccordion = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateObj) => {
    return dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
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

        /* ACCORDION CARDS */
        .pg-approval-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .pg-approval-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          overflow: hidden;
        }
        
        .pg-approval-card:hover {
          border-color: rgba(255,255,255,0.1);
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
        }
        .pg-approval-card.pg-expanded {
          border-color: rgba(16,185,129,0.3);
          box-shadow: 0 0 30px rgba(16,185,129,0.05);
        }

        .pg-card-header {
          padding: 20px 24px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          transition: background 0.2s;
        }
        .pg-card-header:hover {
          background: rgba(255,255,255,0.015);
        }

        .pg-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .pg-user-avatar {
          width: 48px; height: 48px;
          border-radius: 12px;
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.2);
          color: #10b981;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: inset 0 0 10px rgba(16,185,129,0.1);
        }

        .pg-user-info h3 {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 6px 0;
        }

        .pg-meta-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .pg-meta-tag {
          display: flex; align-items: center; gap: 6px;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .pg-meta-tag i { color: #06b6d4; }

        .pg-header-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        
        .pg-duration-box {
          text-align: right;
        }
        .pg-duration-label {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          color: rgba(255,255,255,0.3);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 4px;
        }
        .pg-duration-value {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          color: #e2e8f0;
          display: flex; align-items: center; justify-content: flex-end; gap: 8px;
        }
        .pg-duration-value svg { color: #10b981; }

        .pg-expand-icon {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: rgba(255,255,255,0.03);
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.4);
          transition: all 0.2s;
        }
        .pg-card-header:hover .pg-expand-icon {
          background: rgba(255,255,255,0.08); color: #fff;
        }

        /* CARD BODY (EXPANDED) */
        .pg-card-body {
          border-top: 1px solid rgba(255,255,255,0.05);
          background: rgba(0,0,0,0.2);
          padding: 24px;
          animation: slideDown 0.3s ease-out forwards;
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .pg-body-title {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 16px;
        }

        .pg-req-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .pg-req-item {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .pg-req-item-icon {
          width: 36px; height: 36px;
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.4);
          flex-shrink: 0;
        }
        .pg-req-item-info h4 {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 4px 0;
        }
        .pg-req-item-info p {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: #06b6d4;
          margin: 0;
        }

        /* ACTIONS */
        .pg-action-bar {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 20px;
          border-top: 1px dashed rgba(255,255,255,0.1);
        }

        .pg-btn-acc {
          display: flex; align-items: center; gap: 8px;
          background: rgba(16,185,129,0.15);
          border: 1px solid rgba(16,185,129,0.4);
          color: #10b981;
          padding: 10px 24px;
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all 0.2s ease;
        }
        .pg-btn-acc:hover:not(:disabled) {
          background: #10b981; color: #020408;
          box-shadow: 0 0 20px rgba(16,185,129,0.3);
        }
        
        .pg-btn-reject {
          display: flex; align-items: center; gap: 8px;
          background: rgba(239,68,68,0.05);
          border: 1px solid rgba(239,68,68,0.2);
          color: #ef4444;
          padding: 10px 24px;
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s ease;
        }
        .pg-btn-reject:hover:not(:disabled) {
          background: rgba(239,68,68,0.15);
          border-color: rgba(239,68,68,0.4);
          box-shadow: 0 0 15px rgba(239,68,68,0.15);
        }

        .pg-btn-acc:disabled, .pg-btn-reject:disabled {
          opacity: 0.5; cursor: not-allowed; filter: grayscale(100%);
        }

        /* EMPTY & LOADING STATE */
        .pg-state-panel {
          background: rgba(255,255,255,0.01);
          border: 1px dashed rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 60px 20px;
          text-align: center;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .pg-state-icon {
          width: 64px; height: 64px;
          border-radius: 50%;
          background: rgba(16,185,129,0.05);
          color: #10b981;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
          box-shadow: 0 0 30px rgba(16,185,129,0.1);
        }
        .pg-state-panel h3 {
          font-family: 'Syne', sans-serif; font-size: 16px; color: #fff; margin: 0 0 8px 0;
        }
        .pg-state-panel p {
          font-family: 'Space Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.4); margin: 0; text-transform: uppercase; letter-spacing: 0.1em;
        }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .pg-card-header { flex-direction: column; align-items: flex-start; gap: 16px; }
          .pg-header-right { width: 100%; justify-content: space-between; }
          .pg-duration-box { text-align: left; }
          .pg-duration-value { justify-content: flex-start; }
          .pg-action-bar { flex-direction: column; }
          .pg-action-bar button { width: 100%; justify-content: center; }
        }
      `}</style>

      <div>
        {/* HEADER SECTION */}
        <div className="pg-page-header">
          <div className="pg-page-title">
            <h2>Antrean Persetujuan</h2>
            <p>Tinjau dan verifikasi keranjang pengajuan alat dari siswa</p>
          </div>
        </div>

        {/* LIST KARTU PENGAJUAN (ACCORDION) */}
        <div className="pg-approval-list">
          {loading ? (
            <div className="pg-state-panel">
              <Loader2 className="animate-spin" size={32} color="#10b981" style={{ marginBottom: 16 }} />
              <p>Membaca Protokol Antrean...</p>
            </div>
          ) : groupedRequests.length > 0 ? (
            groupedRequests.map((grup) => {
              const isExpanded = expandedId === grup.groupId;

              return (
                <div key={grup.groupId} className={`pg-approval-card ${isExpanded ? 'pg-expanded' : ''}`}>
                  
                  {/* HEADER KARTU */}
                  <div className="pg-card-header" onClick={() => toggleAccordion(grup.groupId)}>
                    <div className="pg-header-left">
                      <div className="pg-user-avatar">
                        <User size={24} strokeWidth={2} />
                      </div>
                      <div className="pg-user-info">
                        <h3>{grup.nama_peminjam}</h3>
                        <div className="pg-meta-tags">
                          <span className="pg-meta-tag">
                            <i><Clock size={12} /></i> {grup.kegiatan}
                          </span>
                          <span className="pg-meta-tag">
                            <i><Package size={12} /></i> {grup.items.length} Item
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pg-header-right">
                      <div className="pg-duration-box">
                        <div className="pg-duration-label">Siklus Pinjam</div>
                        <div className="pg-duration-value">
                          <CalendarDays size={14} />
                          {formatDate(grup.tgl_ambil)} - {formatDate(grup.tgl_kembali)}
                        </div>
                      </div>
                      <div className="pg-expand-icon">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </div>

                  {/* BODY KARTU (Rincian Alat & Tombol Aksi) */}
                  {isExpanded && (
                    <div className="pg-card-body">
                      <div className="pg-body-title">Manifes Alat (Daftar Pengajuan)</div>
                      
                      <div className="pg-req-grid">
                        {grup.items.map((item, idx) => (
                          <div key={idx} className="pg-req-item">
                            <div className="pg-req-item-icon">
                              <Package size={16} />
                            </div>
                            <div className="pg-req-item-info">
                              <h4>{item.nama_alat || "Alat Multimedia"}</h4>
                              <p>QTY: {item.kuantitas_pinjam || 1} UNIT</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pg-action-bar">
                        <button 
                          onClick={() => handleTolakSemua(grup)}
                          disabled={isProcessing}
                          className="pg-btn-reject"
                        >
                          <AlertCircle size={16} />
                          Tolak Permintaan
                        </button>
                        <button 
                          onClick={() => handleAccSemua(grup)}
                          disabled={isProcessing}
                          className="pg-btn-acc"
                        >
                          {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                          Otorisasi (ACC Semua)
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          ) : (
            <div className="pg-state-panel">
              <div className="pg-state-icon" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.2)', boxShadow: 'none' }}>
                <CheckCircle size={32} />
              </div>
              <h3>Antrean Bersih</h3>
              <p>Tidak ada pengajuan alat baru yang menunggu verifikasi.</p>
            </div>
          )}
        </div>

      </div>
    </>
  );
}