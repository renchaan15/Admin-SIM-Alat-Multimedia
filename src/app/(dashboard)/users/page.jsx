// src/app/(dashboard)/users/page.js
"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Loader2,
  X,
  Save,
  UserPlus,
  User,
  Shield,
  GraduationCap
} from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("Semua");

  // State Modal (Tambah & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); 
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const initialFormState = {
    nama_lengkap: "",
    nim_nip: "",
    role: "siswa",
  };
  const [formData, setFormData] = useState(initialFormState);

  const roles = ["siswa", "laboran", "guru"];
  const filterRoles = ["Semua", ...roles];

  // ================= FIREBASE LISTENER =================
  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const fetchedUsers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(fetchedUsers);
      setLoading(false);
    }, (error) => {
      console.error("Gagal mengambil data user:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ================= LOGIKA BUKA MODAL =================
  const handleOpenAdd = () => {
    setModalMode("add");
    setEditingId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setModalMode("edit");
    setEditingId(user.id);
    setFormData({
      nama_lengkap: user.nama_lengkap || user.namaLengkap || "",
      nim_nip: user.nim_nip || user.nimNip || "",
      role: user.role || "siswa",
    });
    setIsModalOpen(true);
  };

  // ================= LOGIKA SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (modalMode === "add") {
        await addDoc(collection(db, "users"), {
          nama_lengkap: formData.nama_lengkap,
          nim_nip: formData.nim_nip,
          role: formData.role,
          created_at: serverTimestamp()
        });
      } else if (modalMode === "edit") {
        const userRef = doc(db, "users", editingId);
        await updateDoc(userRef, {
          nama_lengkap: formData.nama_lengkap,
          nim_nip: formData.nim_nip,
          role: formData.role,
          updated_at: serverTimestamp()
        });
      }
      setFormData(initialFormState);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error menyimpan user:", error);
      alert("Gagal menyimpan data ke Firebase.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= LOGIKA HAPUS =================
  const handleDelete = async (id, nama) => {
    const confirmDelete = window.confirm(`Peringatan: Yakin ingin menghapus akun "${nama}"? Akun ini tidak akan bisa login lagi.`);
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "users", id));
    } catch (error) {
      console.error("Error menghapus user:", error);
      alert("Gagal menghapus data.");
    }
  };

  // ================= LOGIKA FILTER =================
  const filteredUsers = users.filter(user => {
    const nama = user.nama_lengkap?.toLowerCase() || user.namaLengkap?.toLowerCase() || "";
    const nim = user.nim_nip?.toLowerCase() || user.nimNip?.toLowerCase() || "";
    const searchLow = searchQuery.toLowerCase();
    
    const matchesSearch = nama.includes(searchLow) || nim.includes(searchLow);
    const matchesRole = selectedRole === "Semua" || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

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

        .pg-btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.3);
          color: #10b981;
          padding: 10px 20px;
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 0 15px rgba(16,185,129,0.05);
        }
        
        .pg-btn-primary:hover:not(:disabled) {
          background: rgba(16,185,129,0.2);
          border-color: #10b981;
          color: #fff;
          box-shadow: 0 0 20px rgba(16,185,129,0.2);
          transform: translateY(-1px);
        }

        .pg-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* FILTER & SEARCH BAR */
        .pg-filter-bar {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          backdrop-filter: blur(10px);
        }

        .pg-input-group {
          position: relative;
          flex: 1;
        }
        
        .pg-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.3);
          pointer-events: none;
        }

        .pg-input-control {
          width: 100%;
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 10px 14px 10px 40px;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          outline: none;
          transition: all 0.2s ease;
        }
        
        .pg-input-control:focus {
          border-color: rgba(16,185,129,0.5);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
        }
        .pg-input-control::placeholder { color: rgba(255,255,255,0.2); }

        select.pg-input-control {
          appearance: none;
          cursor: pointer;
          text-transform: capitalize;
        }
        select.pg-input-control option {
          background: #080c14;
          color: #fff;
        }

        /* TABLE */
        .pg-table-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .pg-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        
        .pg-table th {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 16px 20px;
          background: rgba(0,0,0,0.3);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .pg-table td {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.02);
          font-family: 'Syne', sans-serif;
        }
        
        .pg-table tr:hover td {
          background: rgba(255,255,255,0.015);
        }

        /* USER PROFILE CELL */
        .pg-user-info-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .pg-avatar-box {
          width: 40px; height: 40px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .pg-avatar-guru {
          background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); color: #3b82f6; box-shadow: inset 0 0 10px rgba(59,130,246,0.1);
        }
        .pg-avatar-laboran {
          background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); color: #10b981; box-shadow: inset 0 0 10px rgba(16,185,129,0.1);
        }
        .pg-avatar-siswa {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5);
        }

        .pg-user-name {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 2px;
        }
        .pg-user-id {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          color: rgba(255,255,255,0.4);
        }

        .pg-user-nim {
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          color: #e2e8f0;
          font-weight: 700;
        }

        /* ROLE BADGES */
        .pg-role-badge {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          display: inline-block;
        }
        .pg-badge-guru { background: rgba(59,130,246,0.1); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); }
        .pg-badge-laboran { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
        .pg-badge-siswa { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.15); }

        /* ACTIONS */
        .pg-actions {
          display: flex; align-items: center; justify-content: flex-end; gap: 8px;
        }
        .pg-action-btn {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          transition: all 0.2s;
        }
        .pg-action-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .pg-action-btn.edit:hover { color: #10b981; border-color: rgba(16,185,129,0.3); }
        .pg-action-btn.delete:hover { color: #ef4444; border-color: rgba(239,68,68,0.3); }

        /* MODAL STYLES */
        .pg-modal-backdrop {
          position: fixed; inset: 0; z-index: 50;
          background: rgba(2, 4, 8, 0.85); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        
        .pg-modal-content {
          background: #080c14; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
          width: 100%; max-width: 450px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5), 0 0 40px rgba(16,185,129,0.05);
          overflow: hidden;
        }

        .pg-modal-header {
          padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02);
        }
        
        .pg-modal-header h3 {
          font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #fff; margin: 0;
        }
        
        .pg-modal-close {
          background: transparent; border: none; color: rgba(255,255,255,0.4); cursor: pointer; transition: color 0.2s;
        }
        .pg-modal-close:hover { color: #fff; }

        .pg-modal-body { padding: 24px; }

        .pg-form-group { margin-bottom: 16px; }
        .pg-form-group label {
          display: block; font-family: 'Space Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;
        }

        .pg-notice {
          font-family: 'Space Mono', monospace; font-size: 9px; color: rgba(255,255,255,0.4); margin-top: 8px; line-height: 1.5;
        }
        .pg-notice span { color: #10b981; }

        .pg-modal-footer {
          padding: 20px 24px; border-top: 1px solid rgba(255,255,255,0.05);
          display: flex; justify-content: flex-end; gap: 12px; background: rgba(0,0,0,0.2);
        }

        .pg-btn-outline {
          background: transparent; border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); padding: 10px 20px; border-radius: 10px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
        }
        .pg-btn-outline:hover { background: rgba(255,255,255,0.05); color: #fff; }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .pg-page-header { flex-direction: column; gap: 16px; }
          .pg-filter-bar { flex-direction: column; align-items: flex-start; gap: 16px; }
        }
      `}</style>

      <div>
        {/* HEADER */}
        <div className="pg-page-header">
          <div className="pg-page-title">
            <h2>Manajemen Pengguna</h2>
            <p>Kelola hak akses, tambah akun guru, atau atur laboran</p>
          </div>
          <button onClick={handleOpenAdd} className="pg-btn-primary">
            <UserPlus size={16} /> Register Akun
          </button>
        </div>

        {/* FILTER & SEARCH BAR */}
        <div className="pg-filter-bar">
          <div className="pg-input-group">
            <Search className="pg-input-icon" size={16} />
            <input 
              type="text" 
              placeholder="Cari nama atau NIM/NIP..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pg-input-control"
            />
          </div>
          
          <div className="pg-input-group" style={{ maxWidth: '200px' }}>
            <Filter className="pg-input-icon" size={16} />
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="pg-input-control"
            >
              {filterRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="pg-table-card">
          <div style={{ overflowX: 'auto' }}>
            <table className="pg-table">
              <thead>
                <tr>
                  <th>Profil Pengguna</th>
                  <th>Identitas (NIM/NIP)</th>
                  <th>Hak Akses (Role)</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '60px 20px' }}>
                      <Loader2 className="animate-spin" style={{ margin: '0 auto 12px', color: '#10b981' }} size={24} />
                      <span style={{ fontFamily: 'Space Mono', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Menarik Data Pengguna...
                      </span>
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const nama = user.nama_lengkap || user.namaLengkap || "Tanpa Nama";
                    const identitas = user.nim_nip || user.nimNip || "-";
                    const role = user.role || "siswa";

                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="pg-user-info-cell">
                            <div className={`pg-avatar-box ${role === 'guru' ? 'pg-avatar-guru' : role === 'laboran' ? 'pg-avatar-laboran' : 'pg-avatar-siswa'}`}>
                              {role === 'guru' ? <GraduationCap size={18} /> : role === 'laboran' ? <Shield size={18} /> : <User size={18} />}
                            </div>
                            <div>
                              <div className="pg-user-name">{nama}</div>
                              <div className="pg-user-id">ID: {user.id.slice(0,8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="pg-user-nim">{identitas}</span>
                        </td>
                        <td>
                          <span className={`pg-role-badge ${role === 'guru' ? 'pg-badge-guru' : role === 'laboran' ? 'pg-badge-laboran' : 'pg-badge-siswa'}`}>
                            {role}
                          </span>
                        </td>
                        <td>
                          <div className="pg-actions">
                            <button 
                              onClick={() => handleOpenEdit(user)}
                              className="pg-action-btn edit" 
                              title="Edit Hak Akses"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(user.id, nama)}
                              className="pg-action-btn delete" 
                              title="Hapus Akun"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.4)', fontFamily: 'Space Mono', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Pengguna tidak ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL TAMBAH & EDIT USER */}
      {isModalOpen && (
        <div className="pg-modal-backdrop">
          <div className="pg-modal-content">
            <div className="pg-modal-header">
              <h3>{modalMode === "add" ? "Registrasi Akun Baru" : "Edit Hak Akses Akun"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="pg-modal-close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="pg-modal-body">
                <div className="pg-form-group">
                  <label>Nama Lengkap</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Contoh: Azfa Jovaren"
                    value={formData.nama_lengkap}
                    onChange={(e) => setFormData({...formData, nama_lengkap: e.target.value})}
                    className="pg-input-control"
                    style={{ paddingLeft: '14px' }}
                  />
                </div>

                <div className="pg-form-group">
                  <label>Identitas (NIM / NIP)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nomor Induk Mahasiswa / Pegawai"
                    value={formData.nim_nip}
                    onChange={(e) => setFormData({...formData, nim_nip: e.target.value})}
                    className="pg-input-control"
                    style={{ paddingLeft: '14px' }}
                  />
                </div>

                <div className="pg-form-group">
                  <label>Hak Akses (Role)</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="pg-input-control"
                    style={{ paddingLeft: '14px' }}
                  >
                    {roles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <div className="pg-notice">
                    <span>SYS_INFO:</span> Siswa = Peminjam Umum, Laboran = Administrator, Guru = Pengawas.
                  </div>
                </div>
              </div>

              <div className="pg-modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="pg-btn-outline">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="pg-btn-primary">
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {modalMode === "add" ? "Simpan Akun" : "Perbarui Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}