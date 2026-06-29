import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Presensi({
    auth,
    pelatihan,
    isOpen,
    alreadyRecorded,
    presensiStatus,
    errors = {}
}) {
    const [submitting, setSubmitting] = useState(false);
    const { flash } = usePage().props;

    // Live clock states
    const [currentTime, setCurrentTime] = useState(new Date());
    const [timeLeftStr, setTimeLeftStr] = useState('');
    const [progressPercent, setProgressPercent] = useState(0);
    const [trainingStatus, setTrainingStatus] = useState(''); // 'upcoming', 'active', 'finished'

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedTime = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formattedDate = currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Dynamic timer & progress tracking
    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const start = new Date(pelatihan.mulai);
            const end = new Date(pelatihan.akhir);

            if (now < start) {
                setTrainingStatus('upcoming');
                const diff = start - now;
                const hours = Math.floor(diff / 3600000);
                const minutes = Math.floor((diff % 3600000) / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setTimeLeftStr(`Dimulai dalam ${hours}j ${minutes}m ${seconds}d`);
                setProgressPercent(0);
            } else if (now >= start && now <= end) {
                setTrainingStatus('active');
                const diff = end - now;
                const hours = Math.floor(diff / 3600000);
                const minutes = Math.floor((diff % 3600000) / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setTimeLeftStr(`Tutup dalam ${hours}j ${minutes}m ${seconds}d`);
                
                const total = end - start;
                const elapsed = now - start;
                setProgressPercent((elapsed / total) * 100);
            } else {
                setTrainingStatus('finished');
                setTimeLeftStr('Pelatihan Telah Selesai');
                setProgressPercent(100);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [pelatihan.mulai, pelatihan.akhir]);

    const handlePresensi = () => {
        setSubmitting(true);
        router.post(route('pelatihan.record-presensi', pelatihan.id), {}, {
            onFinish: () => setSubmitting(false)
        });
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0071e3] border border-blue-100 flex items-center justify-center shadow-sm shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-[#1d1d1f] tracking-tight">Presensi Kehadiran Pelatihan</h2>
                            <p className="text-xs text-neutral-400 font-medium font-sans">Konfirmasi partisipasi Anda dalam program pelatihan aktif.</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`Presensi - ${pelatihan.kegiatan}`} />

            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
                    
                    {/* Clock Card (Horizontal Banner) identical style as Daily Presensi */}
                    <div className="glass-panel rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
                        <div>
                            <span className="text-[10px] font-bold text-[#0071e3] uppercase tracking-wider block">WAKTU SERVER (WIB)</span>
                            <div className="text-4xl sm:text-5xl font-black text-neutral-800 tracking-tight leading-none mt-1 font-mono">
                                {formattedTime}
                            </div>
                        </div>
                        <div className="sm:text-right">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">TANGGAL HARI INI</span>
                            <div className="text-sm font-bold text-neutral-600 mt-1 font-sans">
                                {formattedDate}
                            </div>
                        </div>
                    </div>

                    {/* Main Presensi Card - Stacked Top and Bottom, Full Width */}
                    <div className="glass-panel rounded-2xl p-8 flex flex-col justify-between space-y-6">
                        
                        {/* Header Details */}
                        <div className="border-b border-neutral-100 pb-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h3 className="text-lg font-bold text-neutral-800">Pencatatan Kehadiran Pelatihan</h3>
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                                    trainingStatus === 'active' 
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                        : trainingStatus === 'upcoming' 
                                        ? 'bg-amber-50 border-amber-200 text-amber-700' 
                                        : 'bg-neutral-50 border-neutral-200 text-neutral-500'
                                }`}>
                                    {trainingStatus === 'active' ? 'Pelatihan Aktif' : trainingStatus === 'upcoming' ? 'Akan Datang' : 'Telah Selesai'}
                                </span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">Harap konfirmasikan kehadiran Anda selama program pelatihan berlangsung.</p>
                        </div>

                        {/* Top Section: Training info card (Wide banner) */}
                        <div className="p-5 rounded-xl bg-neutral-50/50 border border-neutral-200/50 space-y-3">
                            <div>
                                <span className="block text-[10px] font-bold text-neutral-400 uppercase">JUDUL KEGIATAN</span>
                                <span className="text-base font-extrabold text-neutral-800 mt-0.5 block">{pelatihan.kegiatan}</span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-neutral-150/40">
                                <div>
                                    <span className="block text-[10px] font-bold text-neutral-400 uppercase">AKUMULASI SKP</span>
                                    <span className="text-sm font-extrabold text-[#0071e3] mt-0.5 block">{pelatihan.skp} SKP Points</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-neutral-400 uppercase">KODE KEGIATAN</span>
                                    <span className="text-sm font-extrabold text-neutral-700 mt-0.5 block font-mono">#{pelatihan.id}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-neutral-400 uppercase">WAKTU TERSISA</span>
                                    <span className={`text-sm font-extrabold mt-0.5 block ${
                                        trainingStatus === 'active' ? 'text-emerald-600' : 'text-neutral-500'
                                    }`}>
                                        {timeLeftStr}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Middle Section: Progress bar and description */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <span className="block text-[10px] font-bold text-neutral-400 uppercase">PROGRESS PELAKSANAAN</span>
                                <div className="w-full bg-neutral-150 h-2.5 rounded-full overflow-hidden border border-neutral-200/30">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${
                                            trainingStatus === 'active' 
                                                ? 'bg-emerald-500 shadow-sm' 
                                                : trainingStatus === 'upcoming' 
                                                ? 'bg-amber-500' 
                                                : 'bg-neutral-300'
                                        }`} 
                                        style={{ width: `${progressPercent}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/50">
                                    <span className="block text-[10px] font-bold text-neutral-400 uppercase">JAM MULAI</span>
                                    <span className="text-sm font-bold text-neutral-700 mt-1 block">{formatDate(pelatihan.mulai)}</span>
                                </div>
                                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/50">
                                    <span className="block text-[10px] font-bold text-neutral-400 uppercase">JAM SELESAI</span>
                                    <span className="text-sm font-bold text-neutral-700 mt-1 block">{formatDate(pelatihan.akhir)}</span>
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-2">
                                <span className="block text-[10px] font-bold text-neutral-400 uppercase">DESKRIPSI DETAIL</span>
                                <p className="text-xs text-neutral-600 leading-relaxed font-sans">{pelatihan.deskripsi || 'Tidak ada deskripsi detail kegiatan.'}</p>
                            </div>
                        </div>

                        {/* Bottom Section: Validation and Action Buttons */}
                        <div className="space-y-4 pt-6 border-t border-neutral-100">
                            
                            {/* Flash & Validation Alerts */}
                            {(flash?.success || flash?.error || errors.error) && (
                                <div className={`p-4 rounded-xl border text-center text-xs font-bold shadow-sm ${
                                    flash?.success
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                        : 'bg-rose-50 border-rose-200 text-rose-800'
                                }`}>
                                    {flash?.success || flash?.error || errors.error}
                                </div>
                            )}

                            {/* Attendance Buttons */}
                            <div className="flex justify-start">
                                {alreadyRecorded ? (
                                    <div className="w-full bg-emerald-50/60 border border-emerald-100 rounded-xl p-5 flex flex-col items-center justify-center gap-2.5 text-center shadow-inner">
                                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow shadow-emerald-500/20">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                            </svg>
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="text-sm font-extrabold text-emerald-800 block">Presensi Kehadiran Tercatat!</span>
                                            <p className="text-[10px] text-emerald-600 font-bold">Kehadiran Anda pada pelatihan ini telah terekam di database.</p>
                                        </div>
                                    </div>
                                ) : isOpen ? (
                                    <button
                                        onClick={handlePresensi}
                                        disabled={submitting}
                                        className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-extrabold py-3.5 px-8 rounded-xl shadow transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 text-xs uppercase tracking-wider"
                                    >
                                        {submitting ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Memproses...
                                            </span>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                </svg>
                                                <span>Catat Kehadiran Saya</span>
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <div className="w-full bg-rose-50 border border-rose-100 rounded-xl p-5 flex flex-col items-center justify-center gap-2.5 text-center shadow-inner">
                                        <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white shadow shadow-rose-500/20">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
                                            </svg>
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="text-sm font-extrabold text-rose-800 block">Presensi Diluar Waktu Pelatihan</span>
                                            <p className="text-[10px] text-rose-600 font-bold">Presensi hanya aktif saat rentang waktu kegiatan berlangsung.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Back Link */}
                    <div className="text-center pt-2">
                        <a
                            href={route('pelatihan.index')}
                            className="text-xs font-bold text-[#0071e3] hover:text-blue-600 transition"
                        >
                            ← Kembali ke Dashboard Pelatihan
                        </a>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
