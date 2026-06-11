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
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Kalender Sirkulasi</h2>
          <p className="text-slate-500 text-sm mt-1">Pantau jadwal pengambilan dan pengembalian alat praktik.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* BAGIAN KIRI: KALENDER INTERAKTIF */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          
          {/* Navigasi Bulan */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-emerald-500" />
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 rounded-lg bg-emerald-50 text-emerald-600 font-semibold text-sm hover:bg-emerald-100 transition-colors">
                Hari Ini
              </button>
              <button onClick={nextMonth} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Grid Kalender */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
              <p className="text-slate-500 text-sm font-medium">Memuat data kalender...</p>
            </div>
          ) : (
            <div>
              {/* Nama Hari */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center font-bold text-xs text-slate-400 uppercase tracking-wider py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Tanggal */}
              <div className="grid grid-cols-7 gap-2">
                {/* Ruang kosong untuk hari sebelum tanggal 1 */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-24 rounded-xl bg-slate-50/50 border border-transparent"></div>
                ))}

                {/* Tanggal aktual */}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const dateNum = index + 1;
                  const loopDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dateNum);
                  
                  // Periksa apakah ini tanggal yang sedang diklik
                  const isSelected = selectedDate.getDate() === dateNum && 
                                     selectedDate.getMonth() === currentDate.getMonth() && 
                                     selectedDate.getFullYear() === currentDate.getFullYear();
                  
                  // Periksa apakah ini hari ini
                  const today = new Date();
                  const isToday = dateNum === today.getDate() && 
                                  currentDate.getMonth() === today.getMonth() && 
                                  currentDate.getFullYear() === today.getFullYear();

                  const dayTransactions = getTransactionsForDate(loopDate);

                  return (
                    <div 
                      key={dateNum} 
                      onClick={() => setSelectedDate(loopDate)}
                      className={`h-24 p-2 rounded-xl border cursor-pointer transition-all flex flex-col ${
                        isSelected 
                          ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-sm" 
                          : "border-slate-100 hover:border-emerald-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${
                          isToday ? "bg-emerald-500 text-white" : isSelected ? "text-emerald-700" : "text-slate-700"
                        }`}>
                          {dateNum}
                        </span>
                        
                        {/* Indikator Total Kegiatan */}
                        {dayTransactions.length > 0 && (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                            {dayTransactions.length} act
                          </span>
                        )}
                      </div>

                      {/* Baris Indikator Mini */}
                      <div className="flex-1 overflow-y-auto space-y-1 mt-1 no-scrollbar">
                        {dayTransactions.slice(0, 3).map((tx, i) => {
                          const type = getActionType(tx, loopDate);
                          return (
                            <div key={i} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded truncate ${
                              type === "ambil" ? "bg-blue-100 text-blue-700" :
                              type === "kembali" ? "bg-red-100 text-red-700" :
                              "bg-emerald-100 text-emerald-700"
                            }`}>
                              {tx.nama_peminjam?.split(" ")[0]}
                            </div>
                          );
                        })}
                        {dayTransactions.length > 3 && (
                          <div className="text-[9px] font-bold text-slate-400 pl-1">+{dayTransactions.length - 3} lainnya</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* BAGIAN KANAN: PANEL RINCIAN HARI INI */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full lg:max-h-[800px]">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Jadwal pada tanggal</p>
            <h3 className="text-xl font-bold text-slate-800">
              {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
            {selectedDayTransactions.length > 0 ? (
              selectedDayTransactions.map(tx => {
                const actType = getActionType(tx, selectedDate);
                
                return (
                  <div key={tx.id_transaksi} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-colors">
                    {/* Pita Garis Samping untuk visualisasi status */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      actType === "ambil" ? "bg-blue-500" :
                      actType === "kembali" ? "bg-red-500" : "bg-emerald-500"
                    }`}></div>
                    
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        {actType === "ambil" ? <ArrowRightCircle className="w-4 h-4 text-blue-500" /> :
                         actType === "kembali" ? <ArrowLeftCircle className="w-4 h-4 text-red-500" /> :
                         <Clock className="w-4 h-4 text-emerald-500" />}
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          actType === "ambil" ? "bg-blue-50 text-blue-700" :
                          actType === "kembali" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {actType === "ambil" ? "Jadwal Ambil" : actType === "kembali" ? "Batas Kembali" : "Sedang Dipinjam"}
                        </span>
                      </div>
                      <Link href={`/detail/${tx.id_transaksi}`}>
                        <button className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 px-2 py-1 rounded transition-colors">
                          Detail
                        </button>
                      </Link>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm leading-tight">{tx.nama_peminjam}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{tx.kegiatan}</p>
                        
                        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                          <p className="text-xs font-semibold text-slate-700 truncate">{tx.nama_alat}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <CalendarIcon className="w-8 h-8 text-slate-300" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">Tidak Ada Kegiatan</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                  Tidak ada jadwal pengambilan atau pengembalian alat pada tanggal ini.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}