// src/app/(dashboard)/detail/[id]/page.js
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  ArrowLeft, 
  Camera, 
  ShieldCheck, 
  Clock, 
  User, 
  Package, 
  FileText, 
  CalendarDays,
  Loader2,
  AlertTriangle,
  History
} from "lucide-react";

export default function DetailTransaksiPage() {
  const router = useRouter();
  const params = useParams();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================= FIREBASE LISTENER =================
  useEffect(() => {
    const fetchDetail = async () => {
      if (!params?.id) return;
      
      try {
        const docRef = doc(db, "transactions", params.id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setData({ id_transaksi: docSnap.id, ...docSnap.data() });
        } else {
          setData(null);
        }
      } catch (error) {
        console.error("Error fetching detail:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [params.id]);

  const formatDate = (dateObj) => {
    if (!dateObj) return "-";
    return dateObj.toLocaleDateString('id-ID', { 
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).toUpperCase();
  };

  // Status Badge Helper
  const getStatusClass = (status) => {
    if (status === 'selesai') return 'pg-badge-selesai';
    if (status === 'ditolak') return 'pg-badge-ditolak';
    if (status === 'aktif_dipinjam') return 'pg-badge-aktif';
    return 'pg-badge-default';
  };

  return (
    <>
      <style>{`
        /* COMPONENT SPECIFIC STYLES - PIXEL GEAR TEMA */
        .pg-page-header {
          margin-bottom: 24px;
        }

        .pg-back-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; border: none; padding: 0;
          color: rgba(255,255,255,0.5);
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .pg-back-btn:hover {
          color: #06b6d4; transform: translateX(-4px);
        }

        /* CARD MAIN */
        .pg-detail-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          backdrop-filter: blur(10px);
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }

        .pg-detail-header {
          padding: 24px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex; justify-content: space-between; align-items: center;
          background: rgba(0,0,0,0.2);
        }
        .pg-detail-title h2 {
          font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: #fff; margin: 0 0 4px 0;
        }
        .pg-detail-title p {
          font-family: 'Space Mono', monospace; font-size: 10px; color: #06b6d4; margin: 0; letter-spacing: 0.1em;
        }

        /* BADGES */
        .pg-status-badge {
          font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700;
          padding: 6px 12px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.1em;
          display: inline-block;
        }
        .pg-badge-selesai { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); box-shadow: 0 0 15px rgba(16,185,129,0.1); }
        .pg-badge-aktif { background: rgba(6,182,212,0.1); color: #06b6d4; border: 1px solid rgba(6,182,212,0.2); box-shadow: 0 0 15px rgba(6,182,212,0.1); }
        .pg-badge-ditolak { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); box-shadow: 0 0 15px rgba(239,68,68,0.1); }
        .pg-badge-default { background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); box-shadow: 0 0 15px rgba(245,158,11,0.1); }

        /* INFO GRID */
        .pg-info-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
          padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .pg-info-col {
          display: flex; flex-direction: column; gap: 20px;
        }
        .pg-info-box {
          background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.03); border-radius: 12px; padding: 16px;
        }
        .pg-info-box.highlight {
          background: rgba(6,182,212,0.03); border-color: rgba(6,182,212,0.1);
        }

        .pg-info-row {
          display: flex; gap: 16px; align-items: flex-start;
        }
        .pg-info-icon {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .pg-info-icon.user { background: rgba(168,85,247,0.1); color: #a855f7; border: 1px solid rgba(168,85,247,0.2); }
        .pg-info-icon.file { background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }
        .pg-info-icon.tool { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }

        .pg-label {
          font-family: 'Space Mono', monospace; font-size: 9px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 4px;
        }
        .pg-value {
          font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #fff; margin: 0 0 2px 0;
        }
        .pg-sub-value {
          font-family: 'Syne', sans-serif; font-size: 12px; color: rgba(255,255,255,0.5); margin: 0;
        }

        .pg-time-list {
          margin-top: 16px; padding-top: 16px; border-top: 1px dashed rgba(255,255,255,0.1); display: flex; flex-direction: column; gap: 12px;
        }
        .pg-time-item {
          display: flex; justify-content: space-between; align-items: center;
        }
        .pg-time-label {
          display: flex; align-items: center; gap: 8px; font-family: 'Space Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase;
        }
        .pg-time-val {
          font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; color: #e2e8f0; letter-spacing: 0.05em;
        }

        /* PHOTOS SECTION */
        .pg-section-title {
          font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
        }
        .pg-photo-wrap {
          padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .pg-photo-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
        }
        .pg-photo-card {
          background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 16px;
        }
        .pg-photo-header {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
        }
        
        .pg-photo-frame {
          width: 100%; height: 220px; background: #080c14; border: 1px dashed rgba(255,255,255,0.15); border-radius: 8px;
          display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; position: relative;
        }
        .pg-photo-frame img {
          width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease;
        }
        .pg-photo-frame:hover img { transform: scale(1.05); }
        
        .pg-photo-empty {
          display: flex; flex-direction: column; align-items: center; color: rgba(255,255,255,0.2);
        }
        .pg-photo-empty p {
          font-family: 'Syne', sans-serif; font-size: 12px; margin-top: 8px; text-align: center;
        }

        /* TIMELINE (AUDIT TRAIL) */
        .pg-timeline-wrap {
          padding: 24px; background: rgba(0,0,0,0.1);
        }
        .pg-timeline {
          position: relative; padding-left: 24px; display: flex; flex-direction: column; gap: 24px; margin-top: 20px;
        }
        .pg-timeline::before {
          content: ''; position: absolute; left: 7px; top: 8px; bottom: 8px; width: 2px; background: rgba(255,255,255,0.05);
        }
        
        .pg-timeline-item { position: relative; }
        .pg-timeline-icon {
          position: absolute; left: -24px; top: 0; width: 16px; height: 16px; border-radius: 50%;
          background: #080c14; border: 2px solid #3b82f6; box-shadow: 0 0 10px rgba(59,130,246,0.4); z-index: 2;
        }
        .pg-timeline-icon.create { border-color: #a855f7; box-shadow: 0 0 10px rgba(168,85,247,0.4); }
        .pg-timeline-icon.update { border-color: #10b981; box-shadow: 0 0 10px rgba(16,185,129,0.4); }
        
        .pg-timeline-content {
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin-left: 16px; transition: all 0.2s;
        }
        .pg-timeline-content:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); }
        
        .pg-timeline-header {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
        }
        .pg-timeline-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #fff; }
        .pg-timeline-date { font-family: 'Space Mono', monospace; font-size: 9px; color: rgba(255,255,255,0.4); }
        .pg-timeline-desc { font-family: 'Syne', sans-serif; font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.5; margin: 0; }

        /* STATES */
        .pg-state-panel {
          background: rgba(255,255,255,0.01); border: 1px dashed rgba(255,255,255,0.1); border-radius: 16px; padding: 60px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px;
        }
        .pg-state-icon {
          width: 64px; height: 64px; border-radius: 50%; background: rgba(239,68,68,0.05); color: #ef4444; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 0 30px rgba(239,68,68,0.1);
        }
        .pg-state-panel h3 { font-family: 'Syne', sans-serif; font-size: 18px; color: #fff; margin: 0 0 8px 0; }
        .pg-state-panel p { font-family: 'Space Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.4); margin: 0 0 24px 0; text-transform: uppercase; letter-spacing: 0.1em; }
        .pg-btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); padding: 10px 20px; border-radius: 10px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .pg-btn-outline:hover { background: rgba(255,255,255,0.05); color: #fff; }

        @media (max-width: 768px) {
          .pg-info-grid, .pg-photo-grid { grid-template-columns: 1fr; }
          .pg-detail-header { flex-direction: column; align-items: flex-start; gap: 16px; }
        }
      `}</style>

      <div className="pg-page-header">
        <button onClick={() => router.back()} className="pg-back-btn">
          <ArrowLeft size={16} /> Kembali ke Pangkalan Sirkulasi
        </button>
      </div>

      {loading ? (
        <div className="pg-state-panel" style={{ border: 'none', background: 'transparent' }}>
          <Loader2 className="animate-spin" size={32} color="#10b981" style={{ margin: '0 auto 16px' }} />
          <p style={{ margin: 0 }}>Dekripsi Data Transaksi...</p>
        </div>
      ) : !data ? (
        <div className="pg-state-panel">
          <div className="pg-state-icon">
            <AlertTriangle size={32} />
          </div>
          <h3>Data Transaksi Hilang</h3>
          <p>ID Transaksi yang diminta tidak ditemukan dalam database.</p>
          <button onClick={() => router.back()} className="pg-btn-outline">Kembali ke Sirkulasi</button>
        </div>
      ) : (
        <div className="pg-detail-card">
          
          {/* HEADER CARD */}
          <div className="pg-detail-header">
            <div className="pg-detail-title">
              <h2>Manifes Logistik</h2>
              <p>TX-ID: {data.id_transaksi}</p>
            </div>
            <div>
              <span className={`pg-status-badge ${getStatusClass(data.status_pinjam)}`}>
                {data.status_pinjam === 'aktif_dipinjam' ? 'Sedang Dipinjam' : data.status_pinjam.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* INFO GRID */}
          <div className="pg-info-grid">
            {/* Kolom Kiri */}
            <div className="pg-info-col">
              <div className="pg-info-box">
                <div className="pg-info-row">
                  <div className="pg-info-icon user"><User size={20} /></div>
                  <div>
                    <div className="pg-label">Identitas Peminjam</div>
                    <h3 className="pg-value">{data.nama_peminjam || "Unknown Entity"}</h3>
                    <p className="pg-sub-value">Kelas: {data.kelas || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="pg-info-box">
                <div className="pg-info-row">
                  <div className="pg-info-icon file"><FileText size={20} /></div>
                  <div>
                    <div className="pg-label">Tujuan Protokol</div>
                    <h3 className="pg-value">{data.kegiatan || "-"}</h3>
                    <p className="pg-sub-value">Lokasi: {data.lokasi || "Pusat Riset/Lab"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom Kanan */}
            <div className="pg-info-col">
              <div className="pg-info-box highlight">
                <div className="pg-info-row">
                  <div className="pg-info-icon tool"><Package size={20} /></div>
                  <div>
                    <div className="pg-label">Spesifikasi Alat</div>
                    <h3 className="pg-value">{data.nama_alat || "Hardware Modul"}</h3>
                    <p className="pg-sub-value">Kuantitas: {data.kuantitas_pinjam || 1} Unit</p>
                  </div>
                </div>

                <div className="pg-time-list">
                  <div className="pg-time-item">
                    <span className="pg-time-label"><CalendarDays size={14} /> Waktu Akuisisi</span>
                    <span className="pg-time-val">{formatDate(data.tgl_ambil?.toDate())}</span>
                  </div>
                  <div className="pg-time-item">
                    <span className="pg-time-label"><Clock size={14} /> Batas Restorasi</span>
                    <span className="pg-time-val">{formatDate(data.tgl_kembali?.toDate())}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* VERIFIKASI FOTO */}
          <div className="pg-photo-wrap">
            <h3 className="pg-section-title"><Camera size={18} color="#06b6d4" /> Verifikasi Fisik Aset</h3>
            
            <div className="pg-photo-grid">
              {/* Foto Sebelum */}
              <div className="pg-photo-card">
                <div className="pg-photo-header">
                  <div className="pg-label" style={{ margin: 0 }}>Kondisi Pra-Sirkulasi (Awal)</div>
                </div>
                <div className="pg-photo-frame">
                  {data.foto_sebelum ? (
                    <img src={data.foto_sebelum} alt="Foto Kondisi Awal" />
                  ) : (
                    <div className="pg-photo-empty">
                      <Camera size={32} strokeWidth={1} />
                      <p>Visual Data Tidak Ditemukan</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Foto Sesudah */}
              <div className="pg-photo-card">
                <div className="pg-photo-header">
                  <div className="pg-label" style={{ margin: 0 }}>Kondisi Pasca-Sirkulasi (Akhir)</div>
                </div>
                <div className="pg-photo-frame">
                  {data.foto_sesudah ? (
                    <img src={data.foto_sesudah} alt="Foto Kondisi Akhir" />
                  ) : (
                    <div className="pg-photo-empty">
                      <History size={32} strokeWidth={1} />
                      <p>
                        {data.status_pinjam === 'selesai' ? 'Restorasi Tanpa Visual' : 'Menunggu Aset Kembali'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* AUDIT TRAIL / TIMELINE */}
          <div className="pg-timeline-wrap">
            <h3 className="pg-section-title"><ShieldCheck size={18} color="#a855f7" /> Audit Trail Log</h3>
            
            <div className="pg-timeline">
              {/* Node Pembuatan */}
              <div className="pg-timeline-item">
                <div className="pg-timeline-icon create"></div>
                <div className="pg-timeline-content">
                  <div className="pg-timeline-header">
                    <div className="pg-timeline-title">Inisialisasi Pengajuan</div>
                    <div className="pg-timeline-date">{formatDate(data.created_at?.toDate())}</div>
                  </div>
                  <p className="pg-timeline-desc">Permintaan peminjaman dimasukkan ke dalam antrean sistem sirkulasi.</p>
                </div>
              </div>

              {/* Node Update Terakhir */}
              {data.updated_at && (
                <div className="pg-timeline-item">
                  <div className="pg-timeline-icon update"></div>
                  <div className="pg-timeline-content">
                    <div className="pg-timeline-header">
                      <div className="pg-timeline-title">Status Protokol Diperbarui</div>
                      <div className="pg-timeline-date">{formatDate(data.updated_at?.toDate())}</div>
                    </div>
                    <p className="pg-timeline-desc">
                      Verifikasi sistem mengubah status manifes menjadi <span style={{ color: '#10b981', fontWeight: 600, textTransform: 'uppercase' }}>[{data.status_pinjam.replace('_', ' ')}]</span>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </>
  );
}