// src/app/(dashboard)/inventaris/page.js
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
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Camera,
  Loader2,
  X,
  Save,
  Image as ImageIcon,
  QrCode
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function InventarisPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [activeQrCode, setActiveQrCode] = useState(null);

  // State Dinamis untuk Modal (Tambah & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const initialFormState = {
    namaAlat: "",
    kategori: "Kamera",
    kuantitas: 1,
    stokMaintenance: 0,
    fotoAlatUrl: ""
  };
  const [formData, setFormData] = useState(initialFormState);

  const categories = ["Kamera", "Lensa", "Lighting", "Audio", "Aksesoris", "Lainnya"];
  const filterCategories = ["Semua", ...categories];

  // ================= FIREBASE LISTENER =================
  useEffect(() => {
    const itemsRef = collection(db, "items");
    const unsubscribe = onSnapshot(itemsRef, (snapshot) => {
      const fetchedItems = snapshot.docs.map((doc) => ({
        id_dokumen: doc.id,
        ...doc.data()
      }));
      setItems(fetchedItems);
      setLoading(false);
    }, (error) => {
      console.error("Gagal mengambil data Firebase:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ================= LOGIKA AUTO-GENERATE KODE =================
  const generateKodeInventaris = (kategori) => {
    const prefix = kategori.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `INV-${prefix}-${randomNum}`;
  };

  const handleOpenAdd = () => {
    setModalMode("add");
    setEditingId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setModalMode("edit");
    setEditingId(item.id_dokumen);
    setFormData({
      namaAlat: item.nama_alat || item.namaAlat || "",
      kategori: item.kategori || "Kamera",
      kuantitas: item.kuantitas || 1,
      stokMaintenance: item.stok_maintenance || item.stokMaintenance || 0,
      fotoAlatUrl: item.foto_alat_url || item.fotoAlatUrl || ""
    });
    setIsModalOpen(true);
  };

  // ================= LOGIKA UPLOAD FOTO (CLOUDINARY) =================
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingImage(true);

    // Mengambil nilai dari Environment Variables
    const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formDataUpload,
      });
      const data = await res.json();

      if (data.secure_url) {
        setFormData(prev => ({ ...prev, fotoAlatUrl: data.secure_url }));
      } else {
        alert("Gagal mengupload gambar. Pastikan Cloud Name dan Upload Preset sudah benar.");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Terjadi kesalahan saat mengupload gambar.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // ================= LOGIKA SUBMIT (TAMBAH & EDIT) =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (modalMode === "add") {
        const kodeBaru = generateKodeInventaris(formData.kategori);
        await addDoc(collection(db, "items"), {
          kode_inventaris: kodeBaru,
          nama_alat: formData.namaAlat,
          kategori: formData.kategori,
          kuantitas: Number(formData.kuantitas),
          stok_maintenance: Number(formData.stokMaintenance),
          foto_alat_url: formData.fotoAlatUrl,
          created_at: serverTimestamp()
        });
      } else if (modalMode === "edit") {
        const itemRef = doc(db, "items", editingId);
        await updateDoc(itemRef, {
          nama_alat: formData.namaAlat,
          kategori: formData.kategori,
          kuantitas: Number(formData.kuantitas),
          stok_maintenance: Number(formData.stokMaintenance),
          foto_alat_url: formData.fotoAlatUrl,
          updated_at: serverTimestamp()
        });
      }

      setFormData(initialFormState);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error menyimpan alat:", error);
      alert("Gagal menyimpan data ke Firebase.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= LOGIKA HAPUS =================
  const handleDelete = async (id, nama) => {
    const confirmDelete = window.confirm(`Peringatan: Anda yakin ingin menghapus "${nama}" dari database secara permanen?`);
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "items", id));
    } catch (error) {
      console.error("Error menghapus alat:", error);
      alert("Gagal menghapus data.");
    }
  };

  const filteredItems = items.filter(item => {
    const nama = item.nama_alat?.toLowerCase() || item.namaAlat?.toLowerCase() || "";
    const kode = item.kode_inventaris?.toLowerCase() || item.kodeInventaris?.toLowerCase() || "";
    const searchLow = searchQuery.toLowerCase();

    const matchesSearch = nama.includes(searchLow) || kode.includes(searchLow);
    const matchesCategory = selectedCategory === "Semua" || item.kategori === selectedCategory;

    return matchesSearch && matchesCategory;
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

        .pg-btn-danger {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          color: #ef4444;
        }
        .pg-btn-danger:hover {
          background: rgba(239,68,68,0.2);
          border-color: #ef4444;
          color: #fff;
          box-shadow: 0 0 20px rgba(239,68,68,0.2);
        }

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
        }
        select.pg-input-control option {
          background: #080c14;
          color: #fff;
        }

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

        .pg-item-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .pg-item-img {
          width: 44px; height: 44px;
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }
        
        .pg-item-img img {
          width: 100%; height: 100%; object-fit: cover;
        }

        .pg-item-name {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 4px;
        }
        
        .pg-item-code {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: #06b6d4;
          letter-spacing: 0.05em;
        }

        .pg-badge {
          display: inline-block;
          padding: 4px 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          font-size: 11px;
          font-family: 'Space Mono', monospace;
          color: rgba(255,255,255,0.7);
        }

        .pg-status-wrap {
          display: flex; flex-direction: column; gap: 6px;
        }
        .pg-status-line {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 500;
        }
        .pg-dot {
          width: 8px; height: 8px; border-radius: 50%;
          box-shadow: 0 0 8px currentColor;
        }
        .pg-dot-ready { background: #10b981; color: #10b981; }
        .pg-dot-repair { background: #f59e0b; color: #f59e0b; }
        .pg-dot-empty { background: #ef4444; color: #ef4444; }
        
        .pg-text-ready { color: rgba(255,255,255,0.9); }
        .pg-text-repair { color: rgba(255,255,255,0.5); font-size: 11px; }

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
        .pg-action-btn:hover {
          background: rgba(255,255,255,0.08);
          color: #fff;
        }
        .pg-action-btn.edit:hover { color: #10b981; border-color: rgba(16,185,129,0.3); }
        .pg-action-btn.delete:hover { color: #ef4444; border-color: rgba(239,68,68,0.3); }
        .pg-action-btn.qr:hover { color: #06b6d4; border-color: rgba(6,182,212,0.3); }

        /* MODAL STYLES */
        .pg-modal-backdrop {
          position: fixed; inset: 0; z-index: 50;
          background: rgba(2, 4, 8, 0.85);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        
        .pg-modal-content {
          background: #080c14;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          width: 100%; max-width: 500px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5), 0 0 40px rgba(16,185,129,0.05);
          overflow: hidden;
        }

        .pg-modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex; justify-content: space-between; align-items: center;
          background: rgba(255,255,255,0.02);
        }
        
        .pg-modal-header h3 {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }
        
        .pg-modal-close {
          background: transparent; border: none;
          color: rgba(255,255,255,0.4);
          cursor: pointer; transition: color 0.2s;
        }
        .pg-modal-close:hover { color: #fff; }

        .pg-modal-body {
          padding: 24px;
        }

        .pg-form-group {
          margin-bottom: 16px;
        }
        .pg-form-group label {
          display: block;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }
        
        .pg-form-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
        }

        .pg-notice {
          background: rgba(6,182,212,0.1);
          border: 1px solid rgba(6,182,212,0.2);
          border-radius: 8px;
          padding: 12px;
          margin-top: 20px;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(255,255,255,0.6);
          line-height: 1.5;
        }
        .pg-notice span { color: #06b6d4; }

        .pg-modal-footer {
          padding: 20px 24px;
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex; justify-content: flex-end; gap: 12px;
          background: rgba(0,0,0,0.2);
        }

        .pg-btn-outline {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.7);
          padding: 10px 20px;
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pg-btn-outline:hover {
          background: rgba(255,255,255,0.05);
          color: #fff;
        }

        /* QR CODE PRINT STYLES */
        .pg-qr-card {
          background: #fff; /* Paksa putih untuk scan */
          padding: 24px;
          border-radius: 16px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 16px;
        }
        .pg-qr-text-top {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-weight: 700;
        }
        .pg-qr-text-bottom {
          font-family: 'Space Mono', monospace;
          font-size: 14px;
          color: #0f172a;
          font-weight: 700;
        }
        
        @media print {
          body * { visibility: hidden; }
          .pg-qr-print-area, .pg-qr-print-area * { visibility: visible; }
          .pg-qr-print-area { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 100%; max-width: 300px; }
          .pg-modal-backdrop { background: white; }
          .pg-modal-content { box-shadow: none; border: none; }
          .print-hidden { display: none !important; }
        }
      `}</style>

      <div>
        {/* HEADER */}
        <div className="pg-page-header">
          <div className="pg-page-title">
            <h2>Manajemen Inventaris</h2>
            <p>Kelola data logistik, stok, dan kondisi fisik</p>
          </div>
          <button onClick={handleOpenAdd} className="pg-btn-primary">
            <Plus size={16} />
            Register Alat Baru
          </button>
        </div>

        {/* FILTER & SEARCH BAR */}
        <div className="pg-filter-bar">
          <div className="pg-input-group">
            <Search className="pg-input-icon" size={16} />
            <input
              type="text"
              placeholder="Cari alat atau kode inventaris..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pg-input-control"
            />
          </div>

          <div className="pg-input-group" style={{ maxWidth: '250px' }}>
            <Filter className="pg-input-icon" size={16} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pg-input-control"
            >
              {filterCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
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
                  <th>Info Alat</th>
                  <th>Kategori</th>
                  <th>Status Stok</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '60px 20px' }}>
                      <Loader2 className="animate-spin" style={{ margin: '0 auto 12px', color: '#10b981' }} size={24} />
                      <span style={{ fontFamily: 'Space Mono', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sinkronisasi Data...</span>
                    </td>
                  </tr>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const namaAlat = item.nama_alat || item.namaAlat || "Tanpa Nama";
                    const kodeInventaris = item.kode_inventaris || item.kodeInventaris || "-";
                    const fotoUrl = item.foto_alat_url || item.fotoAlatUrl || "";
                    const kategori = item.kategori || "Uncategorized";
                    const kuantitas = item.kuantitas || 0;
                    const stokMaintenance = item.stok_maintenance || item.stokMaintenance || 0;
                    const stokTersedia = kuantitas - stokMaintenance;

                    return (
                      <tr key={item.id_dokumen}>
                        <td>
                          <div className="pg-item-info">
                            <div className="pg-item-img">
                              {fotoUrl ? (
                                <img src={fotoUrl} alt={namaAlat} />
                              ) : (
                                <Camera size={16} color="rgba(255,255,255,0.2)" />
                              )}
                            </div>
                            <div>
                              <div className="pg-item-name">{namaAlat}</div>
                              <div className="pg-item-code">{kodeInventaris}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="pg-badge">{kategori}</span>
                        </td>
                        <td>
                          <div className="pg-status-wrap">
                            <div className="pg-status-line pg-text-ready">
                              <span className={`pg-dot ${stokTersedia > 0 ? 'pg-dot-ready' : 'pg-dot-empty'}`}></span>
                              Siap Pakai: {stokTersedia}
                            </div>
                            {stokMaintenance > 0 && (
                              <div className="pg-status-line pg-text-repair">
                                <span className="pg-dot pg-dot-repair"></span>
                                Perbaikan: {stokMaintenance}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="pg-actions">
                            <button
                              onClick={() => setActiveQrCode(kodeInventaris)}
                              className="pg-action-btn qr"
                              title="Cetak Label QR Code"
                            >
                              <QrCode size={16} />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="pg-action-btn edit"
                              title="Edit Alat"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id_dokumen, namaAlat)}
                              className="pg-action-btn delete"
                              title="Hapus Alat"
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
                      Data tidak ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DINAMIS (TAMBAH & EDIT) */}
      {isModalOpen && (
        <div className="pg-modal-backdrop">
          <div className="pg-modal-content">
            <div className="pg-modal-header">
              <h3>{modalMode === "add" ? "Register Alat Baru" : "Edit Data Alat"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="pg-modal-close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="pg-modal-body">
                <div className="pg-form-group">
                  <label>Nama Alat Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kamera Sony a6400"
                    value={formData.namaAlat}
                    onChange={(e) => setFormData({ ...formData, namaAlat: e.target.value })}
                    className="pg-input-control"
                    style={{ paddingLeft: '14px' }}
                  />
                </div>

                <div className="pg-form-grid">
                  <div className="pg-form-group">
                    <label>Kategori</label>
                    <select
                      value={formData.kategori}
                      onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                      className="pg-input-control"
                      style={{ paddingLeft: '14px' }}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pg-form-group">
                    <label>Total Kuantitas</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.kuantitas}
                      onChange={(e) => setFormData({ ...formData, kuantitas: e.target.value })}
                      className="pg-input-control"
                      style={{ paddingLeft: '14px' }}
                    />
                  </div>
                </div>

                <div className="pg-form-grid">
                  <div className="pg-form-group">
                    <label>Jml Rusak (Perbaikan)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.stokMaintenance}
                      onChange={(e) => setFormData({ ...formData, stokMaintenance: e.target.value })}
                      className="pg-input-control"
                      style={{ paddingLeft: '14px', borderColor: formData.stokMaintenance > 0 ? 'rgba(239,68,68,0.3)' : '' }}
                    />
                  </div>
                </div>

                <div className="pg-form-group">
                  <label>Foto Alat (Opsional) - Upload ke Cloudinary</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <label className="pg-btn-outline" style={{ cursor: 'pointer', flexShrink: 0, padding: '0 14px', display: 'flex', alignItems: 'center', gap: '8px', height: '40px', borderStyle: 'dashed' }}>
                      {isUploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                      {isUploadingImage ? "Mengunggah..." : "Pilih File"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                        disabled={isUploadingImage}
                      />
                    </label>
                    <div className="pg-input-group" style={{ flex: 1 }}>
                      <ImageIcon className="pg-input-icon" size={16} />
                      <input
                        type="url"
                        placeholder="Atau paste URL gambar..."
                        value={formData.fotoAlatUrl}
                        onChange={(e) => setFormData({ ...formData, fotoAlatUrl: e.target.value })}
                        className="pg-input-control"
                      />
                    </div>
                    {formData.fotoAlatUrl && (
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                        <img src={formData.fotoAlatUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                </div>

                {modalMode === "add" && (
                  <div className="pg-notice">
                    <span>SYS_NOTE:</span> Kode Inventaris akan di-generate otomatis oleh sistem setelah formulir disimpan ke database.
                  </div>
                )}
              </div>

              <div className="pg-modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="pg-btn-outline">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="pg-btn-primary">
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {modalMode === "add" ? "Simpan Data" : "Perbarui Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CETAK LABEL QR CODE */}
      {activeQrCode && (
        <div className="pg-modal-backdrop">
          <div className="pg-modal-content pg-qr-print-area" style={{ maxWidth: '320px', background: 'transparent', border: 'none', boxShadow: 'none' }}>

            <div className="pg-modal-header print-hidden" style={{ background: '#080c14', borderRadius: '16px 16px 0 0', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3>Label QR Inventaris</h3>
              <button onClick={() => setActiveQrCode(null)} className="pg-modal-close"><X size={20} /></button>
            </div>

            <div className="pg-qr-card" style={{ borderRadius: '0 0 16px 16px' }}>
              <div className="pg-qr-text-top">Pixel Gear Asset</div>
              <QRCodeSVG value={activeQrCode} size={180} level="H" includeMargin={false} />
              <div className="pg-qr-text-bottom">{activeQrCode}</div>
            </div>

            <div className="pg-modal-footer print-hidden" style={{ background: '#080c14', marginTop: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <button onClick={() => setActiveQrCode(null)} className="pg-btn-outline" style={{ flex: 1, textAlign: 'center' }}>Tutup</button>
              <button onClick={() => window.print()} className="pg-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Cetak Label</button>
            </div>

          </div>
        </div>
      )}

    </>
  );
}