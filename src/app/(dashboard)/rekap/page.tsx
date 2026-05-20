// src/app/(dashboard)/rekap/page.js
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { 
  BarChart3, 
  Download, 
  Calendar,
  PackageCheck,
  TrendingUp,
  AlertOctagon,
  Loader2,
  FileText,
  ExternalLink
} from "lucide-react";

export default function RekapPage() {
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterWaktu, setFilterWaktu] = useState("Bulan Ini");

  // ================= FIREBASE LISTENER =================
  useEffect(() => {
    // Menarik semua transaksi yang sudah selesai atau ditolak untuk dianalisis
    const q = query(
      collection(db, "transactions"), 
      where("status_pinjam", "in", ["selesai", "ditolak"])
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedData = snapshot.docs.map(doc => ({
        id_transaksi: doc.id,
        ...doc.data()
      }));
      
      setRiwayat(fetchedData);
      setLoading(false);
    }, (error) => {
      console.error("Gagal menarik data rekap:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ================= LOGIKA FILTER & KALKULASI STATISTIK =================
  const filteredData = riwayat.filter(item => {
    if (filterWaktu === "Semua") return true;
    
    const itemDate = item.tgl_kembali?.toDate() || new Date();
    const today = new Date();
    
    if (filterWaktu === "Hari Ini") {
      return itemDate.toDateString() === today.toDateString();
    }
    if (filterWaktu === "Bulan Ini") {
      return itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
    }
    return true;
  });

  let sukses = 0;
  let ditolak = 0;
  let totalKuantitas = 0;
  const alatCount = {};

  filteredData.forEach(tx => {
    if (tx.status_pinjam === "selesai") {
      sukses++;
      totalKuantitas += (tx.kuantitas_pinjam || 1);
      
      const nama = tx.nama_alat || "Alat Umum";
      alatCount[nama] = (alatCount[nama] || 0) + 1;
    } else if (tx.status_pinjam === "ditolak") {
      ditolak++;
    }
  });

  let favorit = "-";
  let maxPinjam = 0;
  for (const [nama, count] of Object.entries(alatCount)) {
    if (count > maxPinjam) {
      favorit = nama;
      maxPinjam = count;
    }
  }

  const persentaseDitolak = filteredData.length > 0 ? Math.round((ditolak / filteredData.length) * 100) : 0;

  const stats = {
    totalTransaksi: sukses,
    totalAlatKeluar: totalKuantitas,
    alatTerfavorit: favorit,
    tingkatDitolak: `${persentaseDitolak}%`
  };

  // ================= LOGIKA EXPORT PDF =================
  const handleExportPDF = () => {
    window.print(); 
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return "-";
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
          margin-bottom: 24px;
        }
        
        .pg-page-title h2 {
          font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 700; color: #fff; margin: 0 0 4px 0; letter-spacing: -0.02em;
        }
        
        .pg-page-title p {
          font-family: 'Space Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.4); margin: 0; text-transform: uppercase; letter-spacing: 0.1em;
        }

        .pg-btn-primary {
          display: flex; align-items: center; gap: 8px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); color: #10b981; padding: 10px 20px; border-radius: 10px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 0 15px rgba(16,185,129,0.05);
        }
        .pg-btn-primary:hover {
          background: rgba(16,185,129,0.2); border-color: #10b981; color: #fff; box-shadow: 0 0 20px rgba(16,185,129,0.2); transform: translateY(-1px);
        }

        /* FILTER BAR */
        .pg-filter-bar {
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; backdrop-filter: blur(10px);
        }
        .pg-filter-label {
          display: flex; align-items: center; gap: 10px; font-family: 'Space Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.1em;
        }
        .pg-filter-label svg { color: #10b981; }
        
        .pg-filter-tabs { display: flex; gap: 8px; }
        .pg-tab-btn {
          padding: 8px 16px; font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 600; border-radius: 8px; border: 1px solid transparent; background: rgba(0,0,0,0.2); color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.2s;
        }
        .pg-tab-btn:hover { color: #fff; background: rgba(255,255,255,0.05); }
        .pg-tab-btn.active {
          background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.3); color: #10b981; box-shadow: 0 0 15px rgba(16,185,129,0.1);
        }

        /* STAT CARDS */
        .pg-stat-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 32px;
        }
        .pg-stat-card {
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 24px; backdrop-filter: blur(10px); display: flex; flex-direction: column; position: relative; overflow: hidden;
        }
        .pg-stat-card::after {
          content: ''; position: absolute; top: 0; right: 0; width: 100px; height: 100px; background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%); opacity: 0.1; pointer-events: none;
        }
        
        .pg-stat-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .pg-stat-icon {
          width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
          background: var(--accent-bg); color: var(--accent-color); border: 1px solid var(--accent-border); box-shadow: 0 0 20px var(--accent-glow);
        }
        
        .pg-stat-val { font-family: 'Space Mono', monospace; font-size: 28px; font-weight: 700; color: #fff; line-height: 1.2; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pg-stat-label { font-family: 'Syne', sans-serif; font-size: 13px; color: rgba(255,255,255,0.5); font-weight: 500; }

        /* DATA TABLE */
        .pg-table-card {
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; overflow: hidden; backdrop-filter: blur(10px);
        }
        .pg-table-header {
          padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.2);
        }
        .pg-table-header h3 { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #fff; margin: 0; }
        
        .pg-table-wrap { overflow-x: auto; }
        .pg-table { width: 100%; border-collapse: collapse; text-align: left; }
        .pg-table th {
          font-family: 'Space Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; padding: 16px 24px; background: rgba(255,255,255,0.01); border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .pg-table td { padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.02); font-family: 'Syne', sans-serif; }
        .pg-table tr:hover td { background: rgba(255,255,255,0.015); }

        .pg-td-primary { font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 4px; }
        .pg-td-secondary { font-family: 'Space Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.4); }
        .pg-td-accent { color: #06b6d4; }

        .pg-status-badge {
          font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block;
        }
        .pg-badge-selesai { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
        .pg-badge-ditolak { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }

        .pg-action-cell { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
        .pg-btn-icon {
          width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;
        }
        .pg-btn-icon:hover { background: rgba(255,255,255,0.08); color: #fff; }

        /* PRINT STYLES */
        @media print {
          body * { visibility: hidden; }
          .pg-main { margin: 0 !important; }
          .pg-page-header button, .pg-filter-bar, .pg-action-cell { display: none !important; }
          .pg-stat-grid, .pg-table-card, .pg-table-card * { visibility: visible; }
          .pg-stat-grid { position: absolute; top: 0; left: 0; width: 100%; }
          .pg-table-card { position: absolute; top: 150px; left: 0; width: 100%; border: 1px solid #000; }
          .pg-stat-card { border: 1px solid #000; }
          .pg-table th, .pg-table td { border: 1px solid #ddd; color: #000 !important; }
          .pg-td-primary { color: #000; }
        }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .pg-page-header { flex-direction: column; gap: 16px; }
          .pg-filter-bar { flex-direction: column; align-items: flex-start; gap: 16px; }
          .pg-filter-tabs { width: 100%; overflow-x: auto; padding-bottom: 8px; }
          .pg-tab-btn { flex-shrink: 0; }
        }
      `}</style>

      <div>
        {/* HEADER */}
        <div className="pg-page-header">
          <div className="pg-page-title">
            <h2>Rekapitulasi & Laporan</h2>
            <p>Analisis produktivitas peminjaman alat laboratorium</p>
          </div>
          <button onClick={handleExportPDF} className="pg-btn-primary">
            <Download size={16} /> Cetak Laporan
          </button>
        </div>

        {/* FILTER BAR */}
        <div className="pg-filter-bar">
          <div className="pg-filter-label">
            <Calendar size={16} /> Periode Data Aktual:
          </div>
          <div className="pg-filter-tabs">
            {["Hari Ini", "Bulan Ini", "Semua"].map((periode) => (
              <button
                key={periode}
                onClick={() => setFilterWaktu(periode)}
                className={`pg-tab-btn ${filterWaktu === periode ? "active" : ""}`}
              >
                {periode}
              </button>
            ))}
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="pg-stat-grid">
          {/* Card 1: Transaksi */}
          <div className="pg-stat-card" style={{
            '--accent-bg': 'rgba(59,130,246,0.1)', '--accent-color': '#3b82f6', 
            '--accent-border': 'rgba(59,130,246,0.2)', '--accent-glow': 'rgba(59,130,246,0.3)'
          }}>
            <div className="pg-stat-header">
              <div className="pg-stat-icon"><FileText size={20} /></div>
            </div>
            <div className="pg-stat-val">{stats.totalTransaksi}</div>
            <div className="pg-stat-label">Transaksi Selesai</div>
          </div>

          {/* Card 2: Kuantitas */}
          <div className="pg-stat-card" style={{
            '--accent-bg': 'rgba(16,185,129,0.1)', '--accent-color': '#10b981', 
            '--accent-border': 'rgba(16,185,129,0.2)', '--accent-glow': 'rgba(16,185,129,0.3)'
          }}>
            <div className="pg-stat-header">
              <div className="pg-stat-icon"><PackageCheck size={20} /></div>
            </div>
            <div className="pg-stat-val">{stats.totalAlatKeluar} <span style={{fontSize: 14, opacity: 0.5}}>UNIT</span></div>
            <div className="pg-stat-label">Total Alat Dipinjam</div>
          </div>

          {/* Card 3: Favorit */}
          <div className="pg-stat-card" style={{
            '--accent-bg': 'rgba(245,158,11,0.1)', '--accent-color': '#f59e0b', 
            '--accent-border': 'rgba(245,158,11,0.2)', '--accent-glow': 'rgba(245,158,11,0.3)'
          }}>
            <div className="pg-stat-header">
              <div className="pg-stat-icon"><TrendingUp size={20} /></div>
            </div>
            <div className="pg-stat-val" style={{ fontSize: 20, whiteSpace: 'normal', wordBreak: 'break-word' }}>
              {stats.alatTerfavorit}
            </div>
            <div className="pg-stat-label">Hardware Terfavorit</div>
          </div>

          {/* Card 4: Ditolak */}
          <div className="pg-stat-card" style={{
            '--accent-bg': 'rgba(239,68,68,0.1)', '--accent-color': '#ef4444', 
            '--accent-border': 'rgba(239,68,68,0.2)', '--accent-glow': 'rgba(239,68,68,0.3)'
          }}>
            <div className="pg-stat-header">
              <div className="pg-stat-icon"><AlertOctagon size={20} /></div>
            </div>
            <div className="pg-stat-val">{stats.tingkatDitolak}</div>
            <div className="pg-stat-label">Tingkat Penolakan Sistem</div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="pg-table-card">
          <div className="pg-table-header">
            <BarChart3 size={18} color="rgba(255,255,255,0.4)" />
            <h3>Rincian Data Peminjaman [{filterWaktu}]</h3>
          </div>
          
          <div className="pg-table-wrap">
            <table className="pg-table">
              <thead>
                <tr>
                  <th>ID & Entitas Peminjam</th>
                  <th>Spesifikasi & Kegiatan</th>
                  <th>Siklus Pinjam</th>
                  <th style={{ textAlign: 'right' }}>Status Akhir</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '60px 20px' }}>
                      <Loader2 className="animate-spin" style={{ margin: '0 auto 12px', color: '#10b981' }} size={24} />
                      <span style={{ fontFamily: 'Space Mono', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Menghitung Kalkulasi Data...
                      </span>
                    </td>
                  </tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((tx) => (
                    <tr key={tx.id_transaksi}>
                      <td>
                        <div className="pg-td-primary">{tx.nama_peminjam || "Siswa"}</div>
                        <div className="pg-td-secondary">TX-ID: {tx.id_transaksi.slice(0, 8).toUpperCase()}</div>
                      </td>
                      <td>
                        <div className="pg-td-primary">{tx.nama_alat || "Alat Umum"}</div>
                        <div className="pg-td-secondary pg-td-accent">{tx.kegiatan || "-"}</div>
                      </td>
                      <td>
                        <div className="pg-td-primary" style={{ fontSize: 13 }}>
                          {formatDate(tx.tgl_ambil?.toDate())}
                        </div>
                        <div className="pg-td-secondary">
                          S.D. {formatDate(tx.tgl_kembali?.toDate())}
                        </div>
                      </td>
                      <td>
                        <div className="pg-action-cell">
                          <span className={`pg-status-badge ${tx.status_pinjam === 'selesai' ? 'pg-badge-selesai' : 'pg-badge-ditolak'}`}>
                            {tx.status_pinjam}
                          </span>
                          <Link href={`/detail/${tx.id_transaksi}`} style={{ textDecoration: 'none' }}>
                            <button className="pg-btn-icon" title="Lihat Detail Histori">
                              <ExternalLink size={14} />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.4)', fontFamily: 'Space Mono', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Tidak ada riwayat transaksi pada periode waktu ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}