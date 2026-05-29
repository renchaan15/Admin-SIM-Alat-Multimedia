// src/app/(dashboard)/page.js
"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Package,
  Users,
  AlertCircle,
  Clock,
  TrendingUp,
  Loader2,
  CheckCircle2,
  History
} from "lucide-react";
import Link from "next/link";

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAlat: 0,
    menungguAcc: 0,
    sedangDipinjam: 0,
    terlambat: 0
  });
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    const itemsRef = collection(db, "items");
    const unsubItems = onSnapshot(itemsRef, (snapshot) => {
      let total = 0;
      snapshot.forEach(doc => {
        total += Number(doc.data().kuantitas || 0);
      });
      setStats(prev => ({ ...prev, totalAlat: total }));
    });

    const txRef = collection(db, "transactions");
    const unsubTx = onSnapshot(txRef, (snapshot) => {
      let antrean = 0;
      let aktif = 0;
      let lewatBatas = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const allTx = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        allTx.push({ id: doc.id, ...data });

        if (data.status_pinjam === "menunggu_acc") {
          antrean++;
        } else if (data.status_pinjam === "disetujui" || data.status_pinjam === "aktif_dipinjam") {
          aktif++;
          if (data.tgl_kembali) {
            const tglKembali = data.tgl_kembali.toDate();
            tglKembali.setHours(0, 0, 0, 0);
            if (today > tglKembali && data.status_pinjam === "aktif_dipinjam") {
              lewatBatas++;
            }
          }
        }
      });

      setStats(prev => ({
        ...prev,
        menungguAcc: antrean,
        sedangDipinjam: aktif,
        terlambat: lewatBatas
      }));

      const sortedTx = allTx.sort((a, b) => {
        const timeA = a.updated_at?.toMillis() || a.created_at?.toMillis() || 0;
        const timeB = b.updated_at?.toMillis() || b.created_at?.toMillis() || 0;
        return timeB - timeA;
      });

      setRecentLogs(sortedTx.slice(0, 5));
      setLoading(false);
    });

    return () => {
      unsubItems();
      unsubTx();
    };
  }, []);

  const formatTimeInfo = (timestamp) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate();
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'menunggu_acc': return { text: 'Menunggu Persetujuan', color: 'status-amber' };
      case 'disetujui': return { text: 'Disetujui', color: 'status-blue' };
      case 'aktif_dipinjam': return { text: 'Sedang Dipinjam', color: 'status-emerald' };
      case 'selesai': return { text: 'Selesai', color: 'status-slate' };
      case 'ditolak': return { text: 'Ditolak', color: 'status-red' };
      default: return { text: status, color: 'status-slate' };
    }
  };

  const statCards = [
    {
      key: 'totalAlat',
      label: 'Total Unit Fisik',
      value: stats.totalAlat,
      icon: Package,
      accent: '#10b981',
      glow: 'rgba(16,185,129,0.3)',
      sub: 'Kapasitas gudang terdata',
      subIcon: TrendingUp,
      href: null,
      index: '01',
    },
    {
      key: 'menungguAcc',
      label: 'Menunggu ACC',
      value: stats.menungguAcc,
      icon: Clock,
      accent: '#f59e0b',
      glow: 'rgba(245,158,11,0.3)',
      sub: 'Klik untuk memproses',
      subIcon: null,
      href: '/persetujuan',
      index: '02',
    },
    {
      key: 'sedangDipinjam',
      label: 'Sirkulasi Aktif',
      value: stats.sedangDipinjam,
      icon: Users,
      accent: '#06b6d4',
      glow: 'rgba(6,182,212,0.3)',
      sub: 'Alat sedang digunakan',
      subIcon: null,
      href: '/sirkulasi',
      index: '03',
    },
    {
      key: 'terlambat',
      label: 'Terlambat Kembali',
      value: stats.terlambat,
      icon: AlertCircle,
      accent: stats.terlambat > 0 ? '#ef4444' : '#64748b',
      glow: stats.terlambat > 0 ? 'rgba(239,68,68,0.3)' : 'transparent',
      sub: stats.terlambat > 0 ? 'Perlu penanganan segera!' : 'Tidak ada pelanggaran',
      subIcon: null,
      href: '/sirkulasi',
      isAlert: stats.terlambat > 0,
      index: '04',
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;500;600;700;800&display=swap');

        .pg-page { padding-bottom: 40px; }

        /* PAGE HEADER */
        .pg-page-header {
          margin-bottom: 32px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .pg-page-eyebrow {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: #10b981;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pg-page-eyebrow::before {
          content: '';
          display: inline-block;
          width: 20px; height: 1px;
          background: #10b981;
        }
        .pg-page-title {
          font-size: 28px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.03em;
          line-height: 1;
          margin: 0 0 6px;
        }
        .pg-page-desc {
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          font-weight: 500;
          margin: 0;
        }
        .pg-live-badge {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: #10b981;
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(16,185,129,0.2);
          padding: 6px 12px;
          border-radius: 20px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .pg-live-dot {
          width: 6px; height: 6px;
          background: #10b981;
          border-radius: 50%;
          animation: live-pulse 1.5s ease-in-out infinite;
          box-shadow: 0 0 6px #10b981;
        }
        @keyframes live-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        /* LOADING */
        .pg-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
        }
        .pg-loading-spinner {
          width: 40px; height: 40px;
          border: 2px solid rgba(16,185,129,0.15);
          border-top-color: #10b981;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .pg-loading-text {
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          font-weight: 500;
        }

        /* STAT CARDS GRID */
        .pg-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        @media (max-width: 1200px) { .pg-stats-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 700px) { .pg-stats-grid { grid-template-columns: 1fr; } }

        .pg-stat-card {
          position: relative;
          padding: 24px;
          border-radius: 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          overflow: hidden;
          transition: all 0.25s ease;
          text-decoration: none;
          display: block;
        }
        .pg-stat-card:hover {
          background: rgba(255,255,255,0.05);
          transform: translateY(-2px);
        }
        .pg-stat-card::before {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 100px; height: 100px;
          border-radius: 50%;
          opacity: 0.15;
          transition: opacity 0.25s;
        }
        .pg-stat-card:hover::before { opacity: 0.25; }

        .pg-stat-index {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.15em;
          opacity: 0.3;
          text-transform: uppercase;
          margin-bottom: 20px;
        }
        .pg-stat-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
        }
        .pg-stat-label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.02em;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .pg-stat-value {
          font-size: 40px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.04em;
          line-height: 1;
        }
        .pg-stat-icon-wrap {
          width: 44px; height: 44px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: transform 0.25s;
        }
        .pg-stat-card:hover .pg-stat-icon-wrap { transform: scale(1.05); }

        .pg-stat-footer {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.01em;
        }

        /* Pulsing alert for late card */
        .pg-alert-ring {
          position: absolute;
          inset: -1px;
          border-radius: 16px;
          border: 1px solid rgba(239,68,68,0.3);
          animation: ring-pulse 2s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes ring-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* ACTIVITY TABLE */
        .pg-table-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          overflow: hidden;
        }
        .pg-table-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255,255,255,0.015);
        }
        .pg-table-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.01em;
        }
        .pg-table-title-icon {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: rgba(16,185,129,0.12);
          display: flex; align-items: center; justify-content: center;
          color: #10b981;
        }
        .pg-table-link {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: #10b981;
          text-decoration: none;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          opacity: 0.7;
          transition: opacity 0.15s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pg-table-link:hover { opacity: 1; }

        .pg-table-wrap { overflow-x: auto; }
        .pg-table {
          width: 100%;
          border-collapse: collapse;
        }
        .pg-table th {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.2);
          padding: 14px 24px;
          font-weight: 400;
          background: rgba(255,255,255,0.01);
          border-bottom: 1px solid rgba(255,255,255,0.04);
          white-space: nowrap;
        }
        .pg-table th:last-child { text-align: right; }

        .pg-table td {
          padding: 16px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          vertical-align: middle;
        }
        .pg-table tr:last-child td { border-bottom: none; }
        .pg-table tr:hover td { background: rgba(255,255,255,0.015); }
        .pg-table tr { transition: background 0.15s; }

        .pg-td-time {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          white-space: nowrap;
        }
        .pg-td-name {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          line-height: 1.3;
          letter-spacing: -0.01em;
        }
        .pg-td-sub {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          margin-top: 2px;
          font-weight: 500;
        }
        .pg-table td:last-child { text-align: right; }

        /* Status Badges */
        .status-badge {
          display: inline-block;
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 4px 10px;
          border-radius: 5px;
          border: 1px solid;
          white-space: nowrap;
        }
        .status-amber { color: #fbbf24; background: rgba(251,191,36,0.08); border-color: rgba(251,191,36,0.2); }
        .status-blue { color: #60a5fa; background: rgba(96,165,250,0.08); border-color: rgba(96,165,250,0.2); }
        .status-emerald { color: #34d399; background: rgba(52,211,153,0.08); border-color: rgba(52,211,153,0.2); }
        .status-slate { color: rgba(255,255,255,0.35); background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.08); }
        .status-red { color: #f87171; background: rgba(248,113,113,0.08); border-color: rgba(248,113,113,0.2); }

        /* Empty State */
        .pg-empty {
          padding: 60px 20px;
          text-align: center;
        }
        .pg-empty-icon {
          width: 48px; height: 48px;
          border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 12px;
          color: rgba(255,255,255,0.15);
        }
        .pg-empty-text {
          font-size: 13px;
          color: rgba(255,255,255,0.25);
          font-weight: 500;
        }

        /* Alert blink text */
        .blink-text {
          animation: blink 1.5s ease-in-out infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <div className="pg-page">
        {/* PAGE HEADER */}
        <div className="pg-page-header">
          <div>
            <p className="pg-page-eyebrow">Dashboard</p>
            <h2 className="pg-page-title">Ikhtisar Logistik</h2>
            <p className="pg-page-desc">Pantau pergerakan alat multimedia secara real-time dari Firebase.</p>
          </div>
          <div className="pg-live-badge">
            <span className="pg-live-dot"></span>
            Live Sync
          </div>
        </div>

        {loading ? (
          <div className="pg-loading">
            <div className="pg-loading-spinner"></div>
            <p className="pg-loading-text">Sinkronisasi data real-time...</p>
          </div>
        ) : (
          <>
            {/* STAT CARDS */}
            <div className="pg-stats-grid">
              {statCards.map((card) => {
                const Icon = card.icon;
                const SubIcon = card.subIcon;
                const CardWrapper = card.href ? Link : 'div';
                return (
                  <CardWrapper
                    key={card.key}
                    href={card.href || undefined}
                    className="pg-stat-card"
                    style={{
                      borderColor: card.isAlert ? 'rgba(239,68,68,0.25)' : undefined,
                    }}
                  >
                    {/* Glow blob */}
                    <span style={{
                      position: 'absolute',
                      top: -40, right: -40,
                      width: 100, height: 100,
                      borderRadius: '50%',
                      background: card.accent,
                      opacity: 0.12,
                      pointerEvents: 'none',
                      filter: 'blur(10px)',
                    }} />

                    {card.isAlert && <span className="pg-alert-ring"></span>}

                    <p className="pg-stat-index" style={{ color: card.accent }}>{card.index}</p>

                    <div className="pg-stat-top">
                      <div>
                        <p className="pg-stat-label">{card.label}</p>
                        <p className="pg-stat-value" style={{ color: card.isAlert ? '#ef4444' : '#fff' }}>
                          {card.value}
                        </p>
                      </div>
                      <div
                        className="pg-stat-icon-wrap"
                        style={{
                          background: `${card.accent}15`,
                          color: card.accent,
                          boxShadow: card.isAlert || card.value > 0 ? `0 0 16px ${card.glow}` : 'none'
                        }}
                      >
                        <Icon size={20} strokeWidth={1.8} />
                      </div>
                    </div>

                    <div className="pg-stat-footer" style={{ color: card.accent }}>
                      {SubIcon && <SubIcon size={12} strokeWidth={2.5} />}
                      {card.isAlert ? (
                        <span className="blink-text">⚠ {card.sub}</span>
                      ) : (
                        <span style={{ opacity: 0.7 }}>{card.sub}</span>
                      )}
                    </div>
                  </CardWrapper>
                );
              })}
            </div>

            {/* ACTIVITY TABLE */}
            <div className="pg-table-card">
              <div className="pg-table-header">
                <div className="pg-table-title">
                  <div className="pg-table-title-icon">
                    <History size={15} strokeWidth={2} />
                  </div>
                  Log Aktivitas Terbaru
                </div>
                <Link href="/sirkulasi" className="pg-table-link">
                  Lihat Semua →
                </Link>
              </div>

              <div className="pg-table-wrap">
                <table className="pg-table">
                  <thead>
                    <tr>
                      <th>Waktu Pembaruan</th>
                      <th>Peminjam</th>
                      <th>Alat Terkait</th>
                      <th>Status Sistem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.length > 0 ? (
                      recentLogs.map((log) => {
                        const statusStyle = getStatusStyle(log.status_pinjam);
                        return (
                          <tr key={log.id}>
                            <td>
                              <span className="pg-td-time">
                                {formatTimeInfo(log.updated_at || log.created_at)}
                              </span>
                            </td>
                            <td>
                              <p className="pg-td-name">{log.nama_peminjam || "Siswa"}</p>
                              <p className="pg-td-sub">{log.kelas || "—"}</p>
                            </td>
                            <td>
                              <p className="pg-td-name" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {log.nama_alat || "Alat Umum"}
                              </p>
                              <p className="pg-td-sub">{log.kuantitas_pinjam || 1} Unit</p>
                            </td>
                            <td>
                              <span className={`status-badge ${statusStyle.color}`}>
                                {statusStyle.text}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4}>
                          <div className="pg-empty">
                            <div className="pg-empty-icon">
                              <CheckCircle2 size={20} strokeWidth={1.5} />
                            </div>
                            <p className="pg-empty-text">Belum ada aktivitas transaksi di database.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}