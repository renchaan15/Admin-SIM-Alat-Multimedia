// src/app/login/page.js
"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { MonitorPlay, Lock, Mail, Loader2, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/"); // Pindah ke Dashboard Overview jika sukses
    } catch (err) {
      console.error(err);
      setError("Email atau password salah. Pastikan kredensial Anda valid.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .pg-login-root {
          min-height: 100vh;
          background: #020408;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          color: #e2e8f0;
          -webkit-font-smoothing: antialiased;
          position: relative;
          overflow: hidden;
          padding: 20px;
        }

        /* Ambient background orbs */
        .pg-login-root::before {
          content: ''; position: fixed; top: -20vh; left: -10vw; width: 60vw; height: 60vw;
          background: radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 60%);
          border-radius: 50%; pointer-events: none; z-index: 0;
        }
        .pg-login-root::after {
          content: ''; position: fixed; bottom: -20vh; right: -10vw; width: 50vw; height: 50vw;
          background: radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 60%);
          border-radius: 50%; pointer-events: none; z-index: 0;
        }

        /* Noise grain overlay */
        .pg-grain {
          position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px 200px;
        }

        /* Card Container */
        .pg-login-card {
          width: 100%;
          max-width: 420px;
          background: rgba(8, 12, 20, 0.6);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 24px;
          padding: 48px 40px;
          position: relative;
          z-index: 10;
          backdrop-filter: blur(20px);
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5), 0 0 40px rgba(16,185,129,0.05);
        }

        /* Scanline texture on card */
        .pg-login-card::before {
          content: ''; position: absolute; inset: 0; border-radius: 24px;
          background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 4px);
          pointer-events: none; z-index: 0;
        }

        .pg-login-content { position: relative; z-index: 1; }

        /* Logo & Header */
        .pg-login-logo {
          width: 56px; height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, #10b981, #06b6d4);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 0 20px rgba(16,185,129,0.4), 0 0 40px rgba(16,185,129,0.15);
        }

        .pg-login-title {
          font-size: 24px; font-weight: 800; color: #fff; text-align: center; margin: 0 0 8px 0; letter-spacing: -0.02em;
        }
        .pg-login-subtitle {
          font-family: 'Space Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.15em; text-align: center; margin: 0 0 32px 0;
        }

        /* Error Alert */
        .pg-login-error {
          background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.2); border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; gap: 12px; margin-bottom: 24px;
        }
        .pg-login-error p {
          font-family: 'Space Mono', monospace; font-size: 10px; color: #ef4444; margin: 0; line-height: 1.5;
        }

        /* Form Elements */
        .pg-input-wrapper { margin-bottom: 20px; }
        .pg-login-label {
          display: block; font-family: 'Space Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px;
        }
        
        .pg-input-box { position: relative; }
        .pg-input-icon {
          position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.3); pointer-events: none; transition: color 0.2s;
        }
        
        .pg-input {
          width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px 16px 14px 44px; color: #fff; font-family: 'Syne', sans-serif; font-size: 14px; outline: none; transition: all 0.2s;
        }
        .pg-input::placeholder { color: rgba(255,255,255,0.2); }
        .pg-input:focus {
          border-color: rgba(16,185,129,0.5); box-shadow: 0 0 0 4px rgba(16,185,129,0.1); background: rgba(0,0,0,0.5);
        }
        .pg-input:focus + .pg-input-icon { color: #10b981; }

        /* Submit Button */
        .pg-login-btn {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
          background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); color: #10b981;
          padding: 14px; border-radius: 12px; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; margin-top: 28px; letter-spacing: 0.02em;
        }
        .pg-login-btn:hover:not(:disabled) {
          background: #10b981; color: #020408; box-shadow: 0 0 20px rgba(16,185,129,0.4); transform: translateY(-2px);
        }
        .pg-login-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        @media (max-width: 480px) {
          .pg-login-card { padding: 32px 24px; border-radius: 16px; border-width: 0; border-top: 1px solid rgba(255,255,255,0.05); }
        }
      `}</style>

      <div className="pg-login-root">
        <div className="pg-grain" aria-hidden="true"></div>

        <div className="pg-login-card">
          <div className="pg-login-content">
            
            {/* LOGO & TITLE */}
            <div className="pg-login-logo">
              <MonitorPlay size={24} color="#020408" strokeWidth={2.5} />
            </div>
            <h2 className="pg-login-title">Pixel Gear Admin</h2>
            <p className="pg-login-subtitle">Secure Logistics Authorization</p>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="pg-login-error">
                <ShieldAlert size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                <p>{error}</p>
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleLogin}>
              <div className="pg-input-wrapper">
                <label className="pg-login-label">Terminal ID (Email)</label>
                <div className="pg-input-box">
                  <input 
                    type="email" 
                    required
                    placeholder="admin@pixelgear.sys"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pg-input"
                  />
                  <Mail className="pg-input-icon" size={16} />
                </div>
              </div>

              <div className="pg-input-wrapper">
                <label className="pg-login-label">Security Key (Sandi)</label>
                <div className="pg-input-box">
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pg-input"
                  />
                  <Lock className="pg-input-icon" size={16} />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="pg-login-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Mengautentikasi...
                  </>
                ) : (
                  "Inisialisasi Akses"
                )}
              </button>
            </form>

          </div>
        </div>
      </div>
    </>
  );
}