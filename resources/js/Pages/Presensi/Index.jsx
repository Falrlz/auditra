import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Index({
    auth,
    todayPresensi,
    approvedIzinSakitToday,
    personalHistory = [],
    myPermits = [],
    monitoringData = [],
    pendingApprovals = [],
    allPermits = [],
    pegawaiList = [],
    stats = {},
    selectedDate,
    currentRole,
    error,
    flash = {}
}) {
    // 1. Live Clock State
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedTime = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formattedDate = currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // 2. Tab Navigation State
    const isAdminOrPartner = ['admin', 'partner'].includes(currentRole);
    const [activeTab, setActiveTab] = useState('absensi'); // absensi, riwayat, izin, monitoring, persetujuan
    const [monitoringFilterDate, setMonitoringFilterDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);

    // 3. Sorting State for Riwayat Kehadiran Table
    const [sortField, setSortField] = useState('tanggal');
    const [sortDirection, setSortDirection] = useState('desc');

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Sort personalHistory dynamically
    const sortedHistory = [...personalHistory].sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        // Handle empty/null values
        if (valA === null || valA === undefined || valA === '-') valA = '';
        if (valB === null || valB === undefined || valB === '-') valB = '';

        if (sortField === 'tanggal') {
            const timeA = new Date(valA).getTime();
            const timeB = new Date(valB).getTime();
            return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    // 4. Forms
    const checkinForm = useForm({});
    const checkoutForm = useForm({});
    const assignDinasLuarForm = useForm({
        pegawai_id: '',
        tanggal: todayPresensi ? todayPresensi.tanggal : new Date().toISOString().split('T')[0],
    });

    const izinSakitForm = useForm({
        tanggal_mulai: '',
        tanggal_selesai: '',
        tipe: 'sakit',
        keterangan: '',
        dokumen: null,
    });

    // 5. Alert Handlers
    const [successMessage, setSuccessMessage] = useState(flash?.success || null);
    const [errMessage, setErrMessage] = useState(error || flash?.error || null);

    useEffect(() => {
        if (flash?.success) setSuccessMessage(flash.success);
        if (error || flash?.error) setErrMessage(error || flash?.error);
    }, [flash, error]);

    const handleCheckIn = () => {
        checkinForm.post(route('presensi.checkin'), {
            onSuccess: () => {
                setSuccessMessage('Check-In berhasil dicatat!');
                setErrMessage(null);
            },
            onError: (err) => {
                setErrMessage(err.error || 'Terjadi kesalahan saat Check-In.');
            }
        });
    };

    const handleCheckOut = () => {
        checkoutForm.post(route('presensi.checkout'), {
            onSuccess: () => {
                setSuccessMessage('Check-Out berhasil dicatat!');
                setErrMessage(null);
            },
            onError: (err) => {
                setErrMessage(err.error || 'Terjadi kesalahan saat Check-Out.');
            }
        });
    };

    const handleIzinSakitSubmit = (e) => {
        e.preventDefault();
        izinSakitForm.post(route('presensi.izin-sakit'), {
            forceFormData: true,
            onSuccess: () => {
                izinSakitForm.reset();
                setSuccessMessage('Pengajuan Sakit/Izin berhasil dikirim!');
                setErrMessage(null);
            },
            onError: (err) => {
                setErrMessage(err.error || 'Gagal mengirim pengajuan. Harap periksa input Anda.');
            }
        });
    };

    const handleDateChange = (e) => {
        const newDate = e.target.value;
        setMonitoringFilterDate(newDate);
        router.visit(route('presensi.index', { date: newDate }), {
            preserveState: true,
            only: ['monitoringData', 'stats', 'selectedDate'],
        });
    };

    const handleAssignDinasLuarSubmit = (e) => {
        e.preventDefault();
        if (!assignDinasLuarForm.pegawai_id) return;
        assignDinasLuarForm.post(route('presensi.assign-dinas-luar'), {
            onSuccess: () => {
                assignDinasLuarForm.reset('pegawai_id');
                setSuccessMessage('Berhasil menetapkan Dinas Luar.');
                setErrMessage(null);
            },
            onError: (err) => {
                setErrMessage(err.error || 'Gagal menetapkan Dinas Luar.');
            }
        });
    };

    const handleApproveIzin = (id) => {
        router.post(route('presensi.izin-sakit.approve', id), {}, {
            onSuccess: () => {
                setSuccessMessage('Pengajuan izin/sakit disetujui.');
                setErrMessage(null);
            },
            onError: (err) => {
                setErrMessage(err.error || 'Gagal menyetujui pengajuan.');
            }
        });
    };

    const handleRejectIzin = (id) => {
        if (!confirm('Apakah Anda yakin ingin menolak pengajuan ini?')) return;
        router.post(route('presensi.izin-sakit.reject', id), {}, {
            onSuccess: () => {
                setSuccessMessage('Pengajuan izin/sakit telah ditolak.');
                setErrMessage(null);
            },
            onError: (err) => {
                setErrMessage(err.error || 'Gagal menolak pengajuan.');
            }
        });
    };

    // Helper to format checkin/checkout statuses
    const getStatusBadge = (status) => {
        switch (status) {
            case 'hadir':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Hadir (Kantor)</span>;
            case 'dinas_luar':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">Dinas Luar</span>;
            case 'sakit':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Sakit</span>;
            case 'izin':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">Izin</span>;
            case 'alpha':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 font-extrabold uppercase">Alpha</span>;
            case 'pending_izin':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">Izin (Pending)</span>;
            case 'belum_absen':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">Belum Absen</span>;
            case 'libur':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-50 text-neutral-400">Libur</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-150 text-neutral-500">{status}</span>;
        }
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
                            <h2 className="text-xl font-extrabold text-[#1d1d1f] tracking-tight">Presensi Pegawai</h2>
                            <p className="text-xs text-neutral-400 font-medium">Pencatatan jam kerja harian, izin sakit, dan monitoring kehadiran</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Presensi Harian" />

            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
                    {/* Custom Banner Messages */}
                    {successMessage && (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">✓</span>
                                <span className="text-xs font-bold">{successMessage}</span>
                            </div>
                            <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-800 font-bold">&times;</button>
                        </div>
                    )}

                    {errMessage && (
                        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">!</span>
                                <span className="text-xs font-bold">{errMessage}</span>
                            </div>
                            <button onClick={() => setErrMessage(null)} className="text-rose-500 hover:text-rose-800 font-bold">&times;</button>
                        </div>
                    )}

                    {/* Apple Segmented-Control (Pill Style) Tab Header */}
                    <div className="flex flex-wrap bg-neutral-200/60 p-1 rounded-xl max-w-4xl border border-neutral-300/20 gap-1 sm:gap-0 shadow-sm">
                        <button
                            onClick={() => setActiveTab('absensi')}
                            className={`flex-1 py-2 px-3 text-xs font-extrabold rounded-lg transition-all duration-200 whitespace-nowrap ${
                                activeTab === 'absensi'
                                    ? 'bg-neutral-900 text-white shadow-md'
                                    : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/40'
                            }`}
                        >
                            Absensi Hari Ini
                        </button>
                        <button
                            onClick={() => setActiveTab('riwayat')}
                            className={`flex-1 py-2 px-3 text-xs font-extrabold rounded-lg transition-all duration-200 whitespace-nowrap ${
                                activeTab === 'riwayat'
                                    ? 'bg-neutral-900 text-white shadow-md'
                                    : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/40'
                            }`}
                        >
                            Riwayat Presensi Saya
                        </button>
                        <button
                            onClick={() => setActiveTab('izin')}
                            className={`flex-1 py-2 px-3 text-xs font-extrabold rounded-lg transition-all duration-200 whitespace-nowrap ${
                                activeTab === 'izin'
                                    ? 'bg-neutral-900 text-white shadow-md'
                                    : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/40'
                            }`}
                        >
                            Pengajuan Izin / Sakit
                        </button>

                        {isAdminOrPartner && (
                            <>
                                <button
                                    onClick={() => setActiveTab('monitoring')}
                                    className={`flex-1 py-2 px-3 text-xs font-extrabold rounded-lg transition-all duration-200 whitespace-nowrap ${
                                        activeTab === 'monitoring'
                                            ? 'bg-neutral-900 text-white shadow-md'
                                            : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/40'
                                    }`}
                                >
                                    Monitoring Kehadiran
                                </button>
                                <button
                                    onClick={() => setActiveTab('persetujuan')}
                                    className={`flex-1 py-2 px-3 text-xs font-extrabold rounded-lg transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-1.5 ${
                                        activeTab === 'persetujuan'
                                            ? 'bg-neutral-900 text-white shadow-md'
                                            : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/40'
                                    }`}
                                >
                                    Persetujuan
                                    {pendingApprovals.length > 0 && (
                                        <span className="bg-rose-500 text-white rounded-full px-1.5 py-0.5 text-[9px] font-bold">
                                            {pendingApprovals.length}
                                        </span>
                                    )}
                                </button>
                            </>
                        )}
                    </div>

                    {/* Tab Contents */}
                    {/* 1. Absensi Hari Ini */}
                    {activeTab === 'absensi' && (
                        <div className="flex flex-col gap-6">
                            {/* Clock Card (Horizontal Banner) */}
                            <div className="glass-panel rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
                                <div>
                                    <span className="text-[10px] font-bold text-[#0071e3] uppercase tracking-wider block">WAKTU SERVER (WIB)</span>
                                    <div className="text-4xl sm:text-5xl font-black text-neutral-800 tracking-tight leading-none mt-1 font-mono">
                                        {formattedTime}
                                    </div>
                                </div>
                                <div className="sm:text-right">
                                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">TANGGAL HARI INI</span>
                                    <div className="text-sm font-bold text-neutral-600 mt-1">
                                        {formattedDate}
                                    </div>
                                </div>
                            </div>

                            {/* Check-In Action Card */}
                            <div className="glass-panel rounded-2xl p-8 flex flex-col justify-between">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-neutral-800">Pencatatan Kehadiran Kerja</h3>
                                        <p className="text-xs text-neutral-500 mt-1">Harap catat waktu kehadiran Anda saat memulai dan mengakhiri jam kerja harian.</p>
                                    </div>
                                    
                                    <div className="p-4 rounded-xl bg-neutral-50/50 border border-neutral-200/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <span className="block text-[10px] font-bold text-neutral-400 uppercase">TIPE PENUGASAN HARI INI</span>
                                            <span className="text-sm font-extrabold text-neutral-800 capitalize mt-0.5 block">
                                                {todayPresensi?.status === 'dinas_luar' ? 'Dinas Luar (Jam Kerja Fleksibel)' : 'Kantor (Jam Kerja: 08:30 - 16:30)'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] font-bold text-neutral-400 uppercase">STATUS HARI INI</span>
                                            <div className="mt-1">
                                                {approvedIzinSakitToday ? (
                                                    getStatusBadge(approvedIzinSakitToday.tipe)
                                                ) : todayPresensi ? (
                                                    getStatusBadge(todayPresensi.status)
                                                ) : (
                                                    getStatusBadge('belum_absen')
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Attendance Details */}
                                    {todayPresensi && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="p-4 bg-emerald-50/30 rounded-xl border border-emerald-100">
                                                <span className="block text-[10px] font-bold text-emerald-600 uppercase">Absen Masuk (Check-In)</span>
                                                <span className="text-2xl font-black text-emerald-800 mt-1 block font-mono">
                                                    {todayPresensi.checkin_at || '--:--'}
                                                </span>
                                                {todayPresensi.checkin_at && todayPresensi.status === 'hadir' && (
                                                    <span className={`inline-block text-[10px] font-bold mt-1 px-2 py-0.5 rounded ${
                                                        todayPresensi.checkin_at > '08:35' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    }`}>
                                                        {todayPresensi.checkin_at > '08:35' ? 'Terlambat (Batas 08:35)' : 'Tepat Waktu'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="p-4 bg-sky-50/30 rounded-xl border border-sky-100">
                                                <span className="block text-[10px] font-bold text-sky-600 uppercase">Absen Pulang (Check-Out)</span>
                                                <span className="text-2xl font-black text-sky-800 mt-1 block font-mono">
                                                    {todayPresensi.checkout_at || '--:--'}
                                                </span>
                                                {todayPresensi.checkout_at && todayPresensi.status === 'hadir' && (
                                                    <span className={`inline-block text-[10px] font-bold mt-1 px-2 py-0.5 rounded ${
                                                        todayPresensi.checkout_at < '16:30' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-sky-50 text-sky-600 border border-sky-100'
                                                    }`}>
                                                        {todayPresensi.checkout_at < '16:30' ? 'Pulang Lebih Awal (Batas 16:30)' : 'Jam Kerja Selesai'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {approvedIzinSakitToday && (
                                        <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl text-xs text-amber-800 font-bold">
                                            Status harian Anda terhitung: <span className="underline uppercase">{approvedIzinSakitToday.tipe}</span> ({approvedIzinSakitToday.keterangan}). Anda dikecualikan dari presensi hari ini.
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-8 pt-6 border-t border-neutral-100 flex flex-wrap gap-4">
                                    {!approvedIzinSakitToday && (!todayPresensi || todayPresensi.checkin_at === null) && (
                                        <button
                                            onClick={handleCheckIn}
                                            disabled={checkinForm.processing}
                                            className="w-full sm:w-auto btn-glow-indigo text-sm font-extrabold py-3 px-8 rounded-xl shadow-md transition duration-200"
                                        >
                                            {checkinForm.processing ? 'Memproses...' : 'Catat Check-In Masuk'}
                                        </button>
                                    )}

                                    {todayPresensi && todayPresensi.checkin_at !== null && todayPresensi.checkout_at === null && (
                                        <div className="w-full flex flex-col gap-3">
                                            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) < '16:30:00' && todayPresensi.status === 'hadir' && (
                                                <div className="p-3 bg-amber-50 text-amber-800 border border-amber-150 text-xs font-semibold rounded-lg flex items-center gap-2">
                                                    <span>⚠</span>
                                                    <span>Peringatan: Check-out sebelum pukul 16:30 akan terhitung sebagai kepulangan cepat.</span>
                                                </div>
                                            )}
                                            <button
                                                onClick={handleCheckOut}
                                                disabled={checkoutForm.processing}
                                                className="w-full sm:w-auto bg-neutral-900 hover:bg-neutral-850 text-white font-extrabold py-3 px-8 rounded-xl transition duration-200 shadow-md"
                                            >
                                                {checkoutForm.processing ? 'Memproses...' : 'Catat Check-Out Pulang'}
                                            </button>
                                        </div>
                                    )}

                                    {todayPresensi && todayPresensi.checkin_at !== null && todayPresensi.checkout_at !== null && (
                                        <div className="w-full text-center py-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-extrabold">
                                            Kehadiran kerja Anda hari ini telah tercatat dengan lengkap.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. Riwayat Presensi Saya */}
                    {activeTab === 'riwayat' && (
                        <div className="glass-panel rounded-2xl overflow-hidden bg-white shadow-sm">
                            <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
                                <h3 className="text-lg font-bold text-[#1d1d1f]">Riwayat Kehadiran Bulan Ini</h3>
                                <p className="text-neutral-500 text-xs mt-1">Daftar kehadiran harian Anda. Klik nama kolom untuk mengurutkan (sort) tabel.</p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-200 text-neutral-500 bg-neutral-50/30 text-xs font-bold uppercase tracking-wider text-[10px] select-none">
                                            <th 
                                                onClick={() => handleSort('tanggal')} 
                                                className="py-4 px-6 cursor-pointer hover:bg-neutral-100 hover:text-neutral-800 transition"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Hari & Tanggal
                                                    <span className="text-[10px] font-mono text-neutral-400">
                                                        {sortField === 'tanggal' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                                                    </span>
                                                </div>
                                            </th>
                                            <th 
                                                onClick={() => handleSort('checkin_at')} 
                                                className="py-4 px-6 cursor-pointer hover:bg-neutral-100 hover:text-neutral-800 transition"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Jam Masuk
                                                    <span className="text-[10px] font-mono text-neutral-400">
                                                        {sortField === 'checkin_at' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                                                    </span>
                                                </div>
                                            </th>
                                            <th 
                                                onClick={() => handleSort('checkout_at')} 
                                                className="py-4 px-6 cursor-pointer hover:bg-neutral-100 hover:text-neutral-800 transition"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Jam Keluar
                                                    <span className="text-[10px] font-mono text-neutral-400">
                                                        {sortField === 'checkout_at' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                                                    </span>
                                                </div>
                                            </th>
                                            <th 
                                                onClick={() => handleSort('durasi_kerja')} 
                                                className="py-4 px-6 cursor-pointer hover:bg-neutral-100 hover:text-neutral-800 transition"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Durasi Kerja
                                                    <span className="text-[10px] font-mono text-neutral-400">
                                                        {sortField === 'durasi_kerja' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                                                    </span>
                                                </div>
                                            </th>
                                            <th 
                                                onClick={() => handleSort('status')} 
                                                className="py-4 px-6 cursor-pointer hover:bg-neutral-100 hover:text-neutral-800 transition"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Status Kehadiran
                                                    <span className="text-[10px] font-mono text-neutral-400">
                                                        {sortField === 'status' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                                                    </span>
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 text-sm text-neutral-700">
                                        {sortedHistory.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="py-12 text-center text-sm font-semibold text-neutral-400">Belum ada catatan presensi di bulan ini.</td>
                                            </tr>
                                        ) : (
                                            sortedHistory.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-neutral-50/30 transition">
                                                    <td className="py-4 px-6 font-bold text-neutral-900">
                                                        <span className="capitalize">{row.hari}</span>, {new Date(row.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </td>
                                                    <td className="py-4 px-6 text-neutral-600 font-semibold font-mono">
                                                        {row.checkin_at || '-'}
                                                        {row.is_late && <span className="ml-2 text-[9px] bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded font-bold uppercase">Terlambat</span>}
                                                    </td>
                                                    <td className="py-4 px-6 text-neutral-600 font-semibold font-mono">
                                                        {row.checkout_at || '-'}
                                                        {row.is_early && <span className="ml-2 text-[9px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded font-bold uppercase">Pulang Cepat</span>}
                                                    </td>
                                                    <td className="py-4 px-6 text-neutral-600 font-bold font-mono">
                                                        {row.durasi_kerja}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        {getStatusBadge(row.status)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 3. Pengajuan Izin / Sakit */}
                    {activeTab === 'izin' && (
                        <div className="flex flex-col gap-6">
                            {/* Application Form */}
                            <div className="glass-panel rounded-2xl p-6 bg-white shadow-sm">
                                <h3 className="text-base font-extrabold text-[#1d1d1f] uppercase tracking-wider">Form Pengajuan</h3>
                                <p className="text-[11px] text-neutral-400 mt-1 mb-6">Ajukan izin/sakit mandiri dengan berkas resmi.</p>

                                <form onSubmit={handleIzinSakitSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-neutral-500 uppercase">Tipe Pengajuan</label>
                                            <select
                                                value={izinSakitForm.tipe}
                                                onChange={(e) => izinSakitForm.setData('tipe', e.target.value)}
                                                className="mt-1 block w-full rounded-xl border-neutral-200/80 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs font-semibold"
                                            >
                                                <option value="sakit">Sakit</option>
                                                <option value="izin">Izin Lainnya</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-neutral-500 uppercase">Tanggal Mulai</label>
                                            <input
                                                type="date"
                                                value={izinSakitForm.tanggal_mulai}
                                                onChange={(e) => izinSakitForm.setData('tanggal_mulai', e.target.value)}
                                                className="mt-1 block w-full rounded-xl border-neutral-200/80 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs font-semibold"
                                                required
                                            />
                                            {izinSakitForm.errors.tanggal_mulai && (
                                                <span className="text-[10px] text-rose-500 block mt-1">{izinSakitForm.errors.tanggal_mulai}</span>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-neutral-500 uppercase">Tanggal Selesai</label>
                                            <input
                                                type="date"
                                                value={izinSakitForm.tanggal_selesai}
                                                onChange={(e) => izinSakitForm.setData('tanggal_selesai', e.target.value)}
                                                className="mt-1 block w-full rounded-xl border-neutral-200/80 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs font-semibold"
                                                required
                                            />
                                            {izinSakitForm.errors.tanggal_selesai && (
                                                <span className="text-[10px] text-rose-500 block mt-1">{izinSakitForm.errors.tanggal_selesai}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-neutral-500 uppercase">Alasan Detail</label>
                                            <textarea
                                                rows="3"
                                                value={izinSakitForm.keterangan}
                                                onChange={(e) => izinSakitForm.setData('keterangan', e.target.value)}
                                                className="mt-1 block w-full rounded-xl border-neutral-200/80 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs font-semibold"
                                                placeholder="Jelaskan alasan..."
                                                required
                                            />
                                            {izinSakitForm.errors.keterangan && (
                                                <span className="text-[10px] text-rose-500 block mt-1">{izinSakitForm.errors.keterangan}</span>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-neutral-500 uppercase">Unggah Surat Bukti (PDF/Gambar)</label>
                                            <input
                                                type="file"
                                                onChange={(e) => izinSakitForm.setData('dokumen', e.target.files[0])}
                                                className="mt-1.5 block w-full text-xs text-neutral-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                                required
                                            />
                                            {izinSakitForm.errors.dokumen && (
                                                <span className="text-[10px] text-rose-500 block mt-1">{izinSakitForm.errors.dokumen}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-start">
                                        <button
                                            type="submit"
                                            disabled={izinSakitForm.processing}
                                            className="w-full sm:w-auto btn-glow-indigo text-xs font-extrabold py-3 px-8 rounded-xl shadow-md transition duration-200"
                                        >
                                            {izinSakitForm.processing ? 'Mengirim...' : 'Kirim Form Pengajuan'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Personal Requests Log */}
                            <div className="glass-panel rounded-2xl overflow-hidden bg-white shadow-sm">
                                <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
                                    <h3 className="text-sm font-extrabold text-[#1d1d1f] uppercase tracking-wider">Status Pengajuan Izin Saya</h3>
                                    <p className="text-neutral-500 text-xs mt-1">Daftar berkas surat dokter atau izin yang telah diunggah.</p>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-neutral-200 text-neutral-500 bg-neutral-50/30 text-xs font-bold uppercase tracking-wider text-[10px]">
                                                <th className="py-4 px-6">TANGGAL CUTI</th>
                                                <th className="py-4 px-6">TIPE</th>
                                                <th className="py-4 px-6">KETERANGAN</th>
                                                <th className="py-4 px-6">LAMPIRAN</th>
                                                <th className="py-4 px-6 text-right">STATUS</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100 text-sm text-neutral-750">
                                            {myPermits.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="py-12 text-center text-sm font-semibold text-neutral-400">Belum ada berkas pengajuan izin.</td>
                                                </tr>
                                            ) : (
                                                myPermits.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-neutral-50/30">
                                                        <td className="py-4 px-6 font-bold text-neutral-900 font-mono">
                                                            {item.tanggal_mulai} s/d {item.tanggal_selesai}
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            {item.tipe === 'sakit' ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Sakit</span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Izin</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-6 max-w-xs truncate" title={item.keterangan}>
                                                            {item.keterangan}
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            {item.dokumen ? (
                                                                <a href={item.dokumen} target="_blank" rel="noopener noreferrer" className="text-[#0071e3] font-bold hover:underline">
                                                                    Lihat File ↗
                                                                </a>
                                                            ) : (
                                                                <span className="text-neutral-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            {item.status_approval === 'pending' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-50 text-yellow-800 border border-yellow-200">Menunggu ACC</span>}
                                                            {item.status_approval === 'approved' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Disetujui</span>}
                                                            {item.status_approval === 'rejected' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">Ditolak</span>}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. Monitoring Kehadiran (Admin & Partner Only) */}
                    {activeTab === 'monitoring' && isAdminOrPartner && (
                        <div className="space-y-6">
                            {/* KPI Stats Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                <div className="glass-panel rounded-2xl p-5 bg-white shadow-sm">
                                    <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">TOTAL PEGAWAI</span>
                                    <span className="text-2xl font-black text-neutral-800 mt-1 block font-mono">{stats.total_pegawai}</span>
                                </div>
                                <div className="glass-panel rounded-2xl p-5 bg-white shadow-sm border-l-4 border-l-emerald-500">
                                    <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider">HADIR KANTOR</span>
                                    <span className="text-2xl font-black text-neutral-800 mt-1 block font-mono">{stats.total_hadir}</span>
                                </div>
                                <div className="glass-panel rounded-2xl p-5 bg-white shadow-sm border-l-4 border-l-sky-500">
                                    <span className="block text-[10px] font-bold text-sky-600 uppercase tracking-wider">DINAS LUAR</span>
                                    <span className="text-2xl font-black text-neutral-800 mt-1 block font-mono">{stats.total_dinas_luar}</span>
                                </div>
                                <div className="glass-panel rounded-2xl p-5 bg-white shadow-sm border-l-4 border-l-amber-500">
                                    <span className="block text-[10px] font-bold text-amber-600 uppercase tracking-wider">TERLAMBAT</span>
                                    <span className="text-2xl font-black text-rose-600 mt-1 block font-mono">{stats.total_terlambat}</span>
                                </div>
                                <div className="glass-panel rounded-2xl p-5 bg-white shadow-sm border-l-4 border-l-rose-500 col-span-2 sm:col-span-1">
                                    <span className="block text-[10px] font-bold text-rose-600 uppercase tracking-wider">ALPHA / BELUM ABSEN</span>
                                    <span className="text-2xl font-black text-rose-700 mt-1 block font-mono">{stats.total_alpha}</span>
                                </div>
                            </div>

                            {/* Date Picker & Assign Dinas Luar Panel */}
                            <div className="flex flex-col gap-6">
                                {/* Date Picker Card */}
                                <div className="glass-panel rounded-2xl p-6 bg-white shadow-sm border border-neutral-100/70">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-black text-[#1d1d1f] uppercase tracking-wider flex items-center gap-1.5">
                                                Filter Tanggal Laporan
                                            </h4>
                                            <p className="text-[11px] text-neutral-400">Pilih hari untuk meninjau rekapitulasi kehadiran pegawai.</p>
                                        </div>
                                        <div className="w-full md:w-1/3">
                                            <input
                                                type="date"
                                                value={monitoringFilterDate}
                                                onChange={handleDateChange}
                                                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Assign Dinas Luar Card (Admin Only) */}
                                {currentRole === 'admin' && (
                                    <div className="glass-panel rounded-2xl p-6 bg-white shadow-sm border border-neutral-100/70">
                                        <div className="space-y-6">
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-black text-[#1d1d1f] uppercase tracking-wider flex items-center gap-1.5">
                                                    Tetapkan Dinas Luar
                                                </h4>
                                                <p className="text-[11px] text-neutral-400">Tugaskan pegawai untuk bekerja di luar kantor pada tanggal tertentu dengan jam kerja fleksibel.</p>
                                            </div>
                                            <form onSubmit={handleAssignDinasLuarSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Nama Pegawai</label>
                                                    <select
                                                        value={assignDinasLuarForm.pegawai_id}
                                                        onChange={(e) => assignDinasLuarForm.setData('pegawai_id', e.target.value)}
                                                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 cursor-pointer"
                                                        required
                                                    >
                                                        <option value="">Pilih Pegawai...</option>
                                                        {pegawaiList.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name} ({p.inisial})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Tanggal Dinas</label>
                                                    <input
                                                        type="date"
                                                        value={assignDinasLuarForm.tanggal}
                                                        onChange={(e) => assignDinasLuarForm.setData('tanggal', e.target.value)}
                                                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 cursor-pointer"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-[10px] font-bold text-transparent select-none uppercase tracking-wider">Aksi</label>
                                                    <button
                                                        type="submit"
                                                        disabled={assignDinasLuarForm.processing}
                                                        className="w-full btn-glow-indigo text-sm font-extrabold py-2.5 px-6 rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 hover:translate-y-[-1px] active:translate-y-[1px]"
                                                    >
                                                        <span>{assignDinasLuarForm.processing ? 'Menugaskan...' : 'Tugaskan Dinas Luar'}</span>
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}

                                {/* Employee Attendance Table */}
                                <div className="glass-panel rounded-2xl overflow-hidden bg-white shadow-sm">
                                    <div className="p-5 border-b border-neutral-100 bg-neutral-50/50">
                                        <h4 className="text-sm font-extrabold text-[#1d1d1f] uppercase tracking-wider">Laporan Kehadiran Pegawai</h4>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-neutral-200 text-neutral-500 bg-neutral-50/30 text-xs font-bold uppercase tracking-wider text-[10px]">
                                                    <th className="py-4 px-6">NAMA PEGAWAI</th>
                                                    <th className="py-4 px-6">LOG ABSEN</th>
                                                    <th className="py-4 px-6">DURASI</th>
                                                    <th className="py-4 px-6 text-right">STATUS</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100 text-sm text-neutral-750">
                                                {monitoringData.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-neutral-50/30">
                                                        <td className="py-3 px-6">
                                                            <span className="text-sm font-bold text-neutral-800 block leading-tight">{item.name}</span>
                                                            <span className="text-[10px] text-neutral-400 capitalize font-medium">{item.jabatan} ({item.inisial})</span>
                                                        </td>
                                                        <td className="py-3 px-6 whitespace-nowrap">
                                                            <div className="text-xs font-bold font-mono text-neutral-600">
                                                                {item.checkin_at || '--:--'} s/d {item.checkout_at || '--:--'}
                                                            </div>
                                                            {item.is_late && <span className="text-[9px] text-rose-500 font-bold block mt-0.5">TERLAMBAT</span>}
                                                            {item.is_early && <span className="text-[9px] text-amber-500 font-bold block mt-0.5">PULANG CEPAT</span>}
                                                        </td>
                                                        <td className="py-3 px-6 whitespace-nowrap text-xs font-bold font-mono text-neutral-600">
                                                            {item.durasi_kerja}
                                                        </td>
                                                        <td className="py-3 px-6 text-right">
                                                            {getStatusBadge(item.status)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 5. Persetujuan Izin (Partner & Admin Only) */}
                    {activeTab === 'persetujuan' && isAdminOrPartner && (
                        <div className="space-y-6">
                            {/* Pending Approvals Table */}
                            <div className="glass-panel rounded-2xl overflow-hidden bg-white shadow-sm">
                                <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
                                    <h3 className="text-lg font-bold text-[#1d1d1f]">Persetujuan Pengajuan Cuti / Izin</h3>
                                    <p className="text-neutral-500 text-xs mt-1">Review berkas resmi surat sakit/izin pegawai dan tentukan keputusan approval.</p>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-neutral-200 text-neutral-500 bg-neutral-50/30 text-xs font-bold uppercase tracking-wider text-[10px]">
                                                <th className="py-4 px-6">NAMA PEGAWAI</th>
                                                <th className="py-4 px-6">DURASI HARI</th>
                                                <th className="py-4 px-6">JENIS</th>
                                                <th className="py-4 px-6">ALASAN KETERANGAN</th>
                                                <th className="py-4 px-6">BERKAS BUKTI</th>
                                                <th className="py-4 px-6 text-right">TINDAKAN</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100 text-sm text-neutral-750">
                                            {pendingApprovals.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="py-12 text-center text-sm font-semibold text-neutral-400">Tidak ada pengajuan pending saat ini.</td>
                                                </tr>
                                            ) : (
                                                pendingApprovals.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-neutral-50/30">
                                                        <td className="py-4 px-6 font-bold text-neutral-900">
                                                            {item.name}
                                                        </td>
                                                        <td className="py-4 px-6 font-bold text-neutral-800 font-mono">
                                                            {item.tanggal_mulai} s/d {item.tanggal_selesai}
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            {item.tipe === 'sakit' ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Sakit</span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Izin</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-6 max-w-xs truncate" title={item.keterangan}>
                                                            {item.keterangan}
                                                        </td>
                                                        <td className="py-4 px-6 font-bold">
                                                            {item.dokumen ? (
                                                                <a href={item.dokumen} target="_blank" rel="noopener noreferrer" className="text-[#0071e3] hover:underline">
                                                                    Lihat File Bukti ↗
                                                                </a>
                                                            ) : (
                                                                <span className="text-neutral-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <div className="flex justify-end gap-2 whitespace-nowrap">
                                                                <button
                                                                    onClick={() => handleApproveIzin(item.id)}
                                                                    className="btn-glow-emerald text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm hover:shadow transition"
                                                                >
                                                                    Setujui
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRejectIzin(item.id)}
                                                                    className="btn-glow-rose text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm hover:shadow transition"
                                                                >
                                                                    Tolak
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* All Permits Log (Audit trail) */}
                            <div className="glass-panel rounded-2xl overflow-hidden bg-white shadow-sm">
                                <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
                                    <h3 className="text-sm font-extrabold text-[#1d1d1f] uppercase tracking-wider">Log Semua Pengajuan</h3>
                                    <p className="text-neutral-500 text-xs mt-1">Riwayat keputusan untuk seluruh pengajuan izin/sakit.</p>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-neutral-200 text-neutral-500 bg-neutral-50/30 text-xs font-bold uppercase tracking-wider text-[10px]">
                                                <th className="py-4 px-6">NAMA PEGAWAI</th>
                                                <th className="py-4 px-6">TANGGAL CUTI</th>
                                                <th className="py-4 px-6">TIPE</th>
                                                <th className="py-4 px-6">ALASAN KETERANGAN</th>
                                                <th className="py-4 px-6">STATUS KEPUTUSAN</th>
                                                <th className="py-4 px-6 text-right">DIVERIFIKASI OLEH</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100 text-sm text-neutral-750">
                                            {allPermits.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="py-8 text-center text-sm font-medium text-neutral-400">Belum ada log pengajuan tersimpan.</td>
                                                </tr>
                                            ) : (
                                                allPermits.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-neutral-50/30">
                                                        <td className="py-4 px-6 font-bold text-neutral-900">
                                                            {item.pegawai_name}
                                                        </td>
                                                        <td className="py-4 px-6 font-bold text-neutral-800 font-mono">
                                                            {item.tanggal_mulai} s/d {item.tanggal_selesai}
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            {item.tipe === 'sakit' ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Sakit</span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">Izin</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-6 max-w-xs truncate" title={item.keterangan}>
                                                            {item.keterangan}
                                                        </td>
                                                        <td className="py-4 px-6 font-bold">
                                                            {item.status_approval === 'pending' && <span className="text-yellow-600">Pending</span>}
                                                            {item.status_approval === 'approved' && <span className="text-emerald-600">Disetujui</span>}
                                                            {item.status_approval === 'rejected' && <span className="text-rose-600">Ditolak</span>}
                                                        </td>
                                                        <td className="py-4 px-6 text-right font-semibold capitalize text-neutral-500 text-xs">
                                                            {item.approved_by_name || '-'}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
