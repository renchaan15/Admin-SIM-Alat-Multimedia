// src/app/(dashboard)/layout.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, ListChecks, RefreshCcw, PackageSearch,
  LogOut, Bell, Search, MonitorPlay, Users, BarChart3, Loader2,
  Calendar, AlertTriangle, Clock, X
} from "lucide-react";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef(null);

  // State Keamanan & Profil Dinamis
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [profile, setProfile] = useState({ nama: "Pengelola", role: "Laboran" });

  // State Notifikasi Real-Time
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // ================= AUTH GUARD ROLE & PROFILE DINAMIS =================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        setCheckingAuth(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userSnapshot = await getDoc(userDocRef);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();

          if (userData.role === "siswa") {
            await signOut(auth);
            alert("Akses Ditolak! Akun Siswa tidak diizinkan masuk ke Dashboard Admin.");
            router.push("/login");
            return;
          }

          setProfile({
            nama: userData.nama_lengkap || userData.namaLengkap || "Admin Logistik",
            role: userData.role || "laboran"
          });
        } else {
          await signOut(auth);
          alert("Profil pengguna tidak ditemukan di database. Akses ditolak.");
          router.push("/login");
        }
      } catch (error) {
        console.error("Auth Guard Error:", error);
        router.push("/login");
      } finally {
        setCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // ================= REAL-TIME NOTIFICATION SYSTEM =================
  useEffect(() => {
    const txRef = collection(db, "transactions");
    
    const unsubscribe = onSnapshot(txRef, (snapshot) => {
      const activeNotifications = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      snapshot.forEach(doc => {
        const data = doc.data();
        
        // 1. Notifikasi jika ada antrean baru yang butuh ACC
        if (data.status_pinjam === "menunggu_acc") {
          activeNotifications.push({
            id: doc.id,
            tipe: "persetujuan",
            judul: "Pengajuan Alat Baru",
            deskripsi: `${data.nama_peminjam} meminta ACC untuk ${data.nama_alat}`,
            link: "/persetujuan",
            icon: Clock,
            accent: "#f59e0b",
            bg: "rgba(245, 158, 11, 0.1)"
          });
        }

        // 2. Notifikasi jika ada pengembalian yang terlambat
        if (data.status_pinjam === "aktif_dipinjam" && data.tgl_kembali) {
          const tglKembali = data.tgl_kembali.toDate();
          tglKembali.setHours(0, 0, 0, 0);
          
          if (today > tglKembali) {
            activeNotifications.push({
              id: doc.id,
              tipe: "terlambat",
              judul: "Peringatan Terlambat!",
              deskripsi: `${data.nama_peminjam} melewati batas kembali ${data.nama_alat}`,
              link: "/sirkulasi",
              icon: AlertTriangle,
              accent: "#ef4444",
              bg: "rgba(239, 68, 68, 0.1)"
            });
          }
        }
      });

      setNotifications(activeNotifications);
    });

    return () => unsubscribe();
  }, []);

  // Menutup dropdown jika klik di luar area komponen
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (window.confirm("Apakah Anda yakin ingin keluar dari panel admin?")) {
      await signOut(auth);
      router.push("/login");
    }
  };

  const menuItems = [
    { name: "Overview", icon: LayoutDashboard, path: "/", accent: "#10b981", glow: "rgba(16,185,129,0.35)", label: "01" },
    { name: "Jadwal Kalender", icon: Calendar, path: "/kalender", accent: "#f97316", glow: "rgba(249,115,22,0.35)", label: "02" },
    { name: "ACC Massal", icon: ListChecks, path: "/persetujuan", accent: "#f59e0b", glow: "rgba(245,158,11,0.35)", label: "03" },
    { name: "Sirkulasi & Riwayat", icon: RefreshCcw, path: "/sirkulasi", accent: "#a855f7", glow: "rgba(168,85,247,0.35)", label: "04" },
    { name: "Manajemen Alat", icon: PackageSearch, path: "/inventaris", accent: "#06b6d4", glow: "rgba(6,182,212,0.35)", label: "05" },
    { name: "Manajemen User", icon: Users, path: "/users", accent: "#ec4899", glow: "rgba(236,72,153,0.35)", label: "06" },
    { name: "Rekap Laporan", icon: BarChart3, path: "/rekap", accent: "#6366f1", glow: "rgba(99,102,241,0.35)", label: "07" },
  ];

  const getInitials = (name) => {
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  if (checkingAuth) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
          .loader-bg {
            min-height: 100vh;
            background: #020408;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: 'Space Mono', monospace;
            position: relative;
            overflow: hidden;
          }
          .loader-bg::before {
            content: '';
            position: absolute;
            width: 400px; height: 400px;
            background: radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%);
            border-radius: 50%;
            animation: pulse-glow 2s ease-in-out infinite;
          }
          @keyframes pulse-glow {
            0%, 100% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.1); opacity: 1; }
          }
          .loader-ring {
            width: 48px; height: 48px;
            border: 2px solid rgba(16,185,129,0.15);
            border-top-color: #10b981;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-bottom: 20px;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          .loader-text {
            color: #10b981;
            font-size: 11px;
            letter-spacing: 0.25em;
            text-transform: uppercase;
            opacity: 0.8;
          }
        `}</style>
        <div className="loader-bg">
          <div className="loader-ring"></div>
          <p className="loader-text">Memvalidasi Otoritas Akun...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .pg-root {
          min-height: 100vh;
          background: #020408;
          display: flex;
          font-family: 'Syne', sans-serif;
          color: #e2e8f0;
          -webkit-font-smoothing: antialiased;
          position: relative;
          overflow: hidden;
        }

        /* Ambient background orbs */
        .pg-root::before {
          content: '';
          position: fixed;
          top: -200px; left: -200px;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 65%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .pg-root::after {
          content: '';
          position: fixed;
          bottom: -200px; right: -100px;
          width: 700px; height: 700px;
          background: radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 65%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }

        /* ===== SIDEBAR ===== */
        .pg-sidebar {
          width: 260px;
          height: 100vh;
          position: fixed;
          left: 0; top: 0;
          z-index: 40;
          display: flex;
          flex-direction: column;
          background: rgba(8, 12, 20, 0.95);
          border-right: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(20px);
        }

        /* Subtle scanline texture on sidebar */
        .pg-sidebar::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255,255,255,0.008) 2px,
            rgba(255,255,255,0.008) 4px
          );
          pointer-events: none;
          z-index: 0;
        }

        .pg-logo-area {
          height: 72px;
          display: flex;
          align-items: center;
          padding: 0 20px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          position: relative;
          z-index: 1;
          flex-shrink: 0;
        }

        .pg-logo-icon {
          width: 38px; height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #10b981, #06b6d4);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 0 20px rgba(16,185,129,0.4), 0 0 40px rgba(16,185,129,0.15);
        }

        .pg-logo-text h1 {
          font-size: 16px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
          margin: 0;
          line-height: 1.2;
        }
        .pg-logo-text span {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          color: #10b981;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          display: block;
          margin-top: 2px;
        }

        .pg-nav {
          flex: 1;
          padding: 16px 12px;
          overflow-y: auto;
          position: relative;
          z-index: 1;
        }
        .pg-nav::-webkit-scrollbar { width: 2px; }
        .pg-nav::-webkit-scrollbar-track { background: transparent; }
        .pg-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        .pg-nav-label {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          color: rgba(255,255,255,0.2);
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 0 12px;
          margin-bottom: 10px;
        }

        .pg-menu-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-radius: 10px;
          text-decoration: none;
          margin-bottom: 4px;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
          border: 1px solid transparent;
          cursor: pointer;
        }
        .pg-menu-item-inner {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .pg-menu-item--inactive {
          color: rgba(255,255,255,0.4);
        }
        .pg-menu-item--inactive:hover {
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.75);
          border-color: rgba(255,255,255,0.06);
        }
        .pg-menu-item--active {
          color: #fff;
          border-color: rgba(255,255,255,0.1);
        }
        .pg-menu-item--active::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0.12;
          border-radius: 10px;
        }

        .pg-menu-icon-wrap {
          width: 32px; height: 32px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .pg-menu-name {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .pg-menu-num {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          opacity: 0.35;
          flex-shrink: 0;
        }
        .pg-menu-item--active .pg-menu-num {
          opacity: 0.7;
        }

        .pg-active-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .pg-logout-area {
          padding: 12px;
          border-top: 1px solid rgba(255,255,255,0.05);
          position: relative;
          z-index: 1;
          flex-shrink: 0;
        }
        .pg-logout-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 14px;
          background: transparent;
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px;
          color: rgba(239,68,68,0.7);
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.01em;
        }
        .pg-logout-btn:hover {
          background: rgba(239,68,68,0.08);
          border-color: rgba(239,68,68,0.4);
          color: #ef4444;
          box-shadow: 0 0 16px rgba(239,68,68,0.12);
        }

        /* ===== MAIN ===== */
        .pg-main {
          flex: 1;
          margin-left: 260px;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          position: relative;
          z-index: 1;
        }

        /* ===== NAVBAR ===== */
        .pg-header {
          height: 72px;
          background: rgba(8,12,20,0.8);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 20;
          backdrop-filter: blur(20px);
        }

        .pg-search-wrap {
          position: relative;
          width: 320px;
        }
        .pg-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.25);
          width: 14px; height: 14px;
          pointer-events: none;
          transition: color 0.2s;
        }
        .pg-search-input {
          width: 100%;
          height: 40px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          padding: 0 14px 0 40px;
          color: #e2e8f0;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          outline: none;
          transition: all 0.2s ease;
        }
        .pg-search-input::placeholder { color: rgba(255,255,255,0.2); }
        .pg-search-input:focus {
          background: rgba(255,255,255,0.07);
          border-color: rgba(16,185,129,0.4);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.08);
        }
        .pg-search-input:focus ~ .pg-search-icon { color: #10b981; }

        .pg-header-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .pg-notif-btn {
          width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        .pg-notif-btn:hover {
          background: rgba(255,255,255,0.08);
          color: #fff;
          border-color: rgba(255,255,255,0.12);
        }
        .pg-notif-dot {
          position: absolute;
          top: 9px; right: 9px;
          width: 6px; height: 6px;
          background: #ef4444;
          border-radius: 50%;
          border: 1.5px solid #020408;
        }

        .pg-divider-v {
          width: 1px;
          height: 32px;
          background: rgba(255,255,255,0.07);
        }

        .pg-profile-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .pg-profile-info {
          text-align: right;
        }
        .pg-profile-name {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
          letter-spacing: -0.01em;
        }
        .pg-role-badge {
          display: inline-block;
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 2px 8px;
          border-radius: 4px;
          margin-top: 3px;
        }
        .pg-role-guru {
          background: rgba(99,102,241,0.15);
          color: #818cf8;
          border: 1px solid rgba(99,102,241,0.25);
        }
        .pg-role-laboran {
          background: rgba(16,185,129,0.1);
          color: #34d399;
          border: 1px solid rgba(16,185,129,0.2);
        }

        .pg-avatar {
          width: 40px; height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #10b981, #06b6d4);
          display: flex; align-items: center; justify-content: center;
          font-weight: 800;
          font-size: 13px;
          color: #020408;
          letter-spacing: 0.05em;
          box-shadow: 0 0 16px rgba(16,185,129,0.3);
          flex-shrink: 0;
        }

        /* ===== CONTENT ===== */
        .pg-content {
          padding: 32px;
          flex: 1;
        }

        /* Noise grain overlay for depth */
        .pg-grain {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 100;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px 200px;
        }

        /* ===== NOTIFICATION DROPDOWN ===== */
        .pg-notif-container {
          position: relative;
        }
        .pg-notif-dropdown {
          position: absolute;
          right: 0;
          margin-top: 12px;
          width: 320px;
          background: rgba(8, 12, 20, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 30px rgba(16, 185, 129, 0.05);
          backdrop-filter: blur(20px);
          overflow: hidden;
          z-index: 50;
          animation: pg-fade-in 0.2s ease;
        }
        @keyframes pg-fade-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pg-notif-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.02);
        }
        .pg-notif-header-title {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pg-notif-badge {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          background: #ef4444;
          color: #fff;
          padding: 1px 6px;
          border-radius: 20px;
          font-weight: 700;
        }
        .pg-notif-close {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.15s;
        }
        .pg-notif-close:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }
        .pg-notif-list {
          max-height: 280px;
          overflow-y: auto;
        }
        .pg-notif-list::-webkit-scrollbar { width: 4px; }
        .pg-notif-list::-webkit-scrollbar-track { background: transparent; }
        .pg-notif-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        .pg-notif-item {
          display: flex;
          gap: 12px;
          padding: 14px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          text-decoration: none;
          transition: background 0.15s;
          cursor: pointer;
        }
        .pg-notif-item:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        .pg-notif-item:last-child {
          border-bottom: none;
        }
        .pg-notif-item-icon {
          width: 32px; height: 32px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .pg-notif-item-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .pg-notif-item-title {
          font-size: 12px;
          font-weight: 700;
          color: #fff;
        }
        .pg-notif-item-desc {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.45);
          line-height: 1.4;
        }
        .pg-notif-empty {
          padding: 32px 20px;
          text-align: center;
          color: rgba(255, 255, 255, 0.3);
          font-size: 11px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
      `}</style>

      <div className="pg-root">
        <div className="pg-grain" aria-hidden="true"></div>

        {/* SIDEBAR */}
        <aside className="pg-sidebar">
          <div className="pg-logo-area" style={{ gap: 12 }}>
            <div className="pg-logo-icon">
              <MonitorPlay size={18} color="#020408" strokeWidth={2.5} />
            </div>
            <div className="pg-logo-text">
              <h1>Pixel Gear</h1>
              <span>Admin Hub</span>
            </div>
          </div>

          <nav className="pg-nav">
            <p className="pg-nav-label" style={{ marginTop: 8, marginBottom: 16 }}>Navigation</p>
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.path} style={{ textDecoration: 'none' }}>
                  <div
                    className={`pg-menu-item ${isActive ? "pg-menu-item--active" : "pg-menu-item--inactive"}`}
                    style={isActive ? {
                      background: `linear-gradient(135deg, ${item.accent}18, ${item.accent}08)`,
                      borderColor: `${item.accent}30`,
                      boxShadow: `0 0 20px ${item.glow}`,
                    } : {}}
                  >
                    {isActive && (
                      <span
                        className="pg-menu-item--active::before"
                        style={{
                          position: 'absolute', inset: 0,
                          background: `linear-gradient(135deg, ${item.accent}18, transparent)`,
                          borderRadius: 10, pointerEvents: 'none'
                        }}
                      />
                    )}
                    <div className="pg-menu-item-inner">
                      <div
                        className="pg-menu-icon-wrap"
                        style={isActive
                          ? { background: `${item.accent}20`, color: item.accent, boxShadow: `0 0 12px ${item.glow}` }
                          : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }
                        }
                      >
                        <Icon size={15} strokeWidth={2.5} />
                      </div>
                      <span className="pg-menu-name">{item.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {isActive && (
                        <span className="pg-active-dot" style={{ background: item.accent, boxShadow: `0 0 6px ${item.accent}` }} />
                      )}
                      <span className="pg-menu-num">{item.label}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="pg-logout-area">
            <button className="pg-logout-btn" onClick={handleLogout}>
              <LogOut size={14} strokeWidth={2.5} />
              Keluar Panel
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="pg-main">
          <header className="pg-header">
            <div className="pg-search-wrap">
              <Search className="pg-search-icon" size={14} />
              <input
                type="text"
                placeholder="Cari transaksi atau data alat..."
                className="pg-search-input"
              />
            </div>

            <div className="pg-header-right">
              {/* NOTIFICATION HUB */}
              <div className="pg-notif-container" ref={dropdownRef}>
                <button
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="pg-notif-btn"
                  style={showNotifDropdown ? { background: "rgba(255,255,255,0.08)", color: "#fff", borderColor: "rgba(255,255,255,0.15)" } : {}}
                >
                  <Bell size={16} />
                  {notifications.length > 0 && (
                    <span className="pg-notif-dot animate-pulse"></span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="pg-notif-dropdown">
                    <div className="pg-notif-header">
                      <span className="pg-notif-header-title">
                        Pusat Notifikasi
                        {notifications.length > 0 && (
                          <span className="pg-notif-badge">
                            {notifications.length}
                          </span>
                        )}
                      </span>
                      <button onClick={() => setShowNotifDropdown(false)} className="pg-notif-close">
                        <X size={14} />
                      </button>
                    </div>

                    <div className="pg-notif-list">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => {
                          const NotifIcon = notif.icon;
                          return (
                            <Link
                              key={notif.id}
                              href={notif.link}
                              className="pg-notif-item"
                              onClick={() => setShowNotifDropdown(false)}
                            >
                              <div className="pg-notif-item-icon" style={{ background: notif.bg, color: notif.accent }}>
                                <NotifIcon size={14} />
                              </div>
                              <div className="pg-notif-item-content">
                                <span className="pg-notif-item-title">{notif.judul}</span>
                                <span className="pg-notif-item-desc">{notif.deskripsi}</span>
                              </div>
                            </Link>
                          );
                        })
                      ) : (
                        <div className="pg-notif-empty">
                          <Bell size={24} style={{ opacity: 0.3, marginBottom: 4 }} />
                          <span>Semua aman! Tidak ada notifikasi baru.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="pg-divider-v"></div>

              <div className="pg-profile-wrap">
                <div className="pg-profile-info">
                  <p className="pg-profile-name">{profile.nama}</p>
                  <span className={`pg-role-badge ${profile.role === 'guru' ? 'pg-role-guru' : 'pg-role-laboran'}`}>
                    {profile.role}
                  </span>
                </div>
                <div className="pg-avatar">
                  {getInitials(profile.nama)}
                </div>
              </div>
            </div>
          </header>

          <div className="pg-content">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}