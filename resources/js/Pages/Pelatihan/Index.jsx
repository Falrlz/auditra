import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Index({
    auth,
    pelatihans = [],
    pegawaiList = [],
    availablePelatihans = [],
    personalHistory = [],
    accumulatedSkp = 0,
    activeTab: initialTab = null,
    errors = {},
    flash = {}
}) {
    const role = auth.user.role;
    const isAdmin = role === 'admin';
    const isPartner = role === 'partner';
    const isPegawai = !isAdmin && !isPartner;



    // Active tab state
    const [activeTab, setActiveTab] = useState(() => {
        if (initialTab) return initialTab;
        if (isAdmin) return 'daftar';
        if (isPartner) return 'persetujuan';
        return 'tersedia';
    });

    // Sync tab state when initialTab prop changes
    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    // Form for creating/editing training (Admin)
    const { data, setData, post, put, processing, reset, clearErrors } = useForm({
        kegiatan: '',
        deskripsi: '',
        skp: 1,
        mulai: '',
        akhir: '',
    });

    // Edit state
    const [editingId, setEditingId] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);

    // QR Code Modal State
    const [showQrModal, setShowQrModal] = useState(false);
    const [selectedPelatihan, setSelectedPelatihan] = useState(null);

    // Rejection Modal State
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectingPelatihan, setRejectingPelatihan] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectError, setRejectError] = useState('');

    // Detail Modal State (Admin/Partner to see participants)
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailPelatihan, setDetailPelatihan] = useState(null);

    const handleCreate = () => {
        clearErrors();
        reset();
        setEditingId(null);
        setShowFormModal(true);
    };

    const handleEdit = (pelatihan) => {
        clearErrors();
        setData({
            kegiatan: pelatihan.kegiatan,
            deskripsi: pelatihan.deskripsi || '',
            skp: pelatihan.skp,
            mulai: new Date(pelatihan.mulai).toISOString().slice(0, 16),
            akhir: new Date(pelatihan.akhir).toISOString().slice(0, 16),
        });
        setEditingId(pelatihan.id);
        setShowFormModal(true);
    };

    const handleSubmitForm = (e) => {
        e.preventDefault();
        if (editingId) {
            put(route('pelatihan.update', editingId), {
                onSuccess: () => {
                    setShowFormModal(false);
                    reset();
                }
            });
        } else {
            post(route('pelatihan.store'), {
                onSuccess: () => {
                    setShowFormModal(false);
                    reset();
                }
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus pelatihan ini?')) {
            router.delete(route('pelatihan.destroy', id));
        }
    };

    const handleSubmitApproval = (id) => {
        if (confirm('Ajukan pelatihan ini untuk disetujui Partner?')) {
            router.post(route('pelatihan.submit', id));
        }
    };

    const handleApprove = (id) => {
        if (confirm('Setujui pengajuan pelatihan ini?')) {
            router.post(route('pelatihan.approve', id));
        }
    };

    const handleRejectClick = (pelatihan) => {
        setRejectingPelatihan(pelatihan);
        setRejectReason('');
        setRejectError('');
        setShowRejectModal(true);
    };

    const handleRejectSubmit = (e) => {
        e.preventDefault();
        if (rejectReason.length < 5) {
            setRejectError('Alasan penolakan minimal 5 karakter.');
            return;
        }
        router.post(route('pelatihan.reject', rejectingPelatihan.id), {
            reject_reason: rejectReason
        }, {
            onSuccess: () => {
                setShowRejectModal(false);
                setRejectingPelatihan(null);
                setRejectReason('');
            }
        });
    };

    const handleFinish = (id) => {
        if (confirm('Tandai pelatihan ini sebagai Selesai? Sistem akan otomatis mengompilasi kehadiran pegawai.')) {
            router.post(route('pelatihan.finish', id));
        }
    };

    const handleQrClick = (pelatihan) => {
        setSelectedPelatihan(pelatihan);
        setShowQrModal(true);
    };

    const handleViewDetails = (pelatihan) => {
        setDetailPelatihan(pelatihan);
        setShowDetailModal(true);
    };

    const getPresensiLink = (token) => {
        return window.location.origin + `/pelatihan/presensi/${token}`;
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Link presensi berhasil disalin ke clipboard!');
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

    const getHeaderInfo = () => {
        if (isAdmin) {
            return {
                title: "Manajemen Pelatihan",
                subtitle: "Kelola program pelatihan, monitor kehadiran peserta, dan kelola poin SKP."
            };
        }
        if (isPartner) {
            if (activeTab === 'riwayat') {
                return {
                    title: "Rekap SKP Pegawai",
                    subtitle: "Pantau rekapitulasi perolehan nilai SKP dan keikutsertaan pelatihan seluruh pegawai."
                };
            }
            return {
                title: "Persetujuan Pelatihan",
                subtitle: "Review pengajuan program pelatihan oleh Admin."
            };
        }
        if (activeTab === 'riwayat_saya') {
            return {
                title: "Rekap Pelatihan & SKP",
                subtitle: "Lihat akumulasi nilai SKP dan riwayat keikutsertaan pelatihan Anda."
            };
        }
        return {
            title: "Kegiatan Pelatihan Tersedia",
            subtitle: "Daftar program pelatihan aktif yang sedang dibuka untuk Anda."
        };
    };

    const headerInfo = getHeaderInfo();

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-neutral-800 tracking-tight">{headerInfo.title}</h2>
                        <p className="text-sm text-neutral-500 mt-1">{headerInfo.subtitle}</p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={handleCreate}
                            className="bg-[#0071e3] hover:bg-blue-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all duration-300 transform hover:-translate-y-0.5 text-sm"
                        >
                            Buat Pelatihan Baru
                        </button>
                    )}
                </div>
            }
        >
            <Head title="Pelatihan" />

            <div className="py-6 px-6 sm:px-8 max-w-7xl mx-auto space-y-6">
                {/* Flash Messages */}
                {(flash.success || flash.error || errors.error) && (
                    <div className={`p-4 rounded-xl border backdrop-blur-md transition-all duration-300 ${
                        flash.success
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                            : 'bg-rose-50/80 border-rose-200 text-rose-800'
                    }`}>
                        <div className="flex items-center gap-3">
                            <span className="font-semibold text-sm">
                                {flash.success || flash.error || errors.error}
                            </span>
                        </div>
                    </div>
                )}



                {/* MODERN GLASSMORPHIC PILL TABS */}
                {((isAdmin || isPartner) && (activeTab === 'tersedia' || activeTab === 'daftar' || activeTab === 'persetujuan')) && (
                    <div className="inline-flex p-1 bg-neutral-100/80 backdrop-blur-sm rounded-xl border border-neutral-200/40 self-start shadow-inner gap-1">
                        <button
                            onClick={() => setActiveTab('tersedia')}
                            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 ${
                                activeTab === 'tersedia'
                                    ? 'bg-white text-[#0071e3] shadow-sm scale-102 font-extrabold'
                                    : 'text-neutral-500 hover:text-neutral-800'
                            }`}
                        >
                            Pelatihan Aktif
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('daftar')}
                                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 ${
                                    activeTab === 'daftar'
                                        ? 'bg-white text-[#0071e3] shadow-sm scale-102 font-extrabold'
                                        : 'text-neutral-500 hover:text-neutral-800'
                                }`}
                            >
                                Kelola Pelatihan
                            </button>
                        )}
                        {isPartner && (
                            <button
                                onClick={() => setActiveTab('persetujuan')}
                                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 ${
                                    activeTab === 'persetujuan'
                                        ? 'bg-white text-[#0071e3] shadow-sm scale-102 font-extrabold'
                                        : 'text-neutral-500 hover:text-neutral-800'
                                }`}
                            >
                                Persetujuan Pelatihan
                            </button>
                        )}
                    </div>
                )}

                {((isAdmin || isPartner) && (activeTab === 'rekap_admin' || activeTab === 'riwayat' || activeTab === 'rekap_pegawai')) && (
                    <div className="inline-flex p-1 bg-neutral-100/80 backdrop-blur-sm rounded-xl border border-neutral-200/40 self-start shadow-inner gap-1">
                        <button
                            onClick={() => setActiveTab(isAdmin ? 'rekap_admin' : 'riwayat')}
                            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 ${
                                (activeTab === 'rekap_admin' || activeTab === 'riwayat')
                                    ? 'bg-white text-[#0071e3] shadow-sm scale-102 font-extrabold'
                                    : 'text-neutral-500 hover:text-neutral-800'
                            }`}
                        >
                            Rekap Saya
                        </button>
                        <button
                            onClick={() => setActiveTab('rekap_pegawai')}
                            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 ${
                                activeTab === 'rekap_pegawai'
                                    ? 'bg-white text-[#0071e3] shadow-sm scale-102 font-extrabold'
                                    : 'text-neutral-500 hover:text-neutral-800'
                            }`}
                        >
                            Rekap Seluruh Pegawai
                        </button>
                    </div>
                )}

                {/* CONTENT AREA */}
                <div className="mt-4">
                    {/* ADMIN: DAFTAR PELATIHAN */}
                    {isAdmin && activeTab === 'daftar' && (
                        <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-neutral-600">
                                    <thead className="text-xs text-neutral-500 bg-neutral-50 border-b border-neutral-100 font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">Kegiatan</th>
                                            <th className="px-6 py-4">Waktu Pelaksanaan</th>
                                            <th className="px-6 py-4 text-center">SKP</th>
                                            <th className="px-6 py-4 text-center">Status</th>
                                            <th className="px-6 py-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {pelatihans.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-neutral-400">
                                                    Belum ada data pelatihan yang dibuat.
                                                </td>
                                            </tr>
                                        ) : (
                                            pelatihans.map((p) => (
                                                <tr key={p.id} className="hover:bg-neutral-50/50 transition">
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold text-neutral-800">{p.kegiatan}</div>
                                                        <div className="text-xs text-neutral-400 mt-0.5 truncate max-w-[250px]">{p.deskripsi || '-'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs">
                                                        <div><span className="text-neutral-400">Mulai:</span> {formatDate(p.mulai)}</div>
                                                        <div className="mt-0.5"><span className="text-neutral-400">Selesai:</span> {formatDate(p.akhir)}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-[#0071e3]">
                                                        {p.skp}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                                                            p.status === 'draft' ? 'bg-neutral-100 text-neutral-800 border border-neutral-200' :
                                                            p.status === 'menunggu_persetujuan' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                                                            p.status === 'disetujui' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                                                            p.status === 'ditolak' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                                                            'bg-blue-50 text-blue-800 border border-blue-200'
                                                        }`}>
                                                            {p.status.replace('_', ' ')}
                                                        </span>
                                                        {p.status === 'ditolak' && p.reject_reason && (
                                                            <div className="text-[10px] text-rose-500 mt-1 max-w-[150px] mx-auto truncate" title={p.reject_reason}>
                                                                Sebab: {p.reject_reason}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                                                        {p.status === 'disetujui' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleQrClick(p)}
                                                                    className="text-xs font-bold text-neutral-600 hover:text-neutral-800 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1.5 rounded-lg transition"
                                                                >
                                                                    Tampilkan QR
                                                                </button>
                                                                <button
                                                                    onClick={() => handleFinish(p.id)}
                                                                    className="text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 px-2.5 py-1.5 rounded-lg transition"
                                                                >
                                                                    Selesai
                                                                </button>
                                                            </>
                                                        )}

                                                        {(p.status === 'draft' || p.status === 'ditolak') && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleEdit(p)}
                                                                    className="text-xs font-bold text-neutral-600 hover:text-neutral-800 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1.5 rounded-lg transition"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleSubmitApproval(p.id)}
                                                                    className="text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-2.5 py-1.5 rounded-lg transition"
                                                                >
                                                                    Ajukan
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(p.id)}
                                                                    className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition"
                                                                >
                                                                    Hapus
                                                                </button>
                                                            </>
                                                        )}

                                                        {p.status === 'selesai' && (
                                                            <button
                                                                onClick={() => handleViewDetails(p)}
                                                                className="text-xs font-bold text-neutral-600 hover:text-neutral-800 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1.5 rounded-lg transition"
                                                            >
                                                                Peserta ({p.presensi_pelatihans?.length || 0})
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ADMIN / PARTNER: REKAP SELURUH PEGAWAI */}
                    {(isAdmin || isPartner) && activeTab === 'rekap_pegawai' && (
                        <div className="space-y-6">
                            {/* Section 1: Akumulasi SKP & Keikutsertaan Pegawai */}
                            <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
                                <h3 className="text-base font-bold text-neutral-800 border-b border-neutral-100 pb-3">Daftar Akumulasi SKP & Keikutsertaan Pegawai</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-neutral-600">
                                        <thead className="text-xs text-neutral-500 bg-neutral-50 border-b border-neutral-100 font-bold uppercase tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4">Pegawai</th>
                                                <th className="px-6 py-4">Jabatan</th>
                                                <th className="px-6 py-4 text-center">SKP Diperoleh</th>
                                                <th className="px-6 py-4 text-center">Jumlah Pelatihan Diikuti</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100">
                                            {pegawaiList.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-8 text-center text-neutral-400">
                                                        Tidak ada pegawai aktif.
                                                    </td>
                                                </tr>
                                            ) : (
                                                pegawaiList.map((p) => {
                                                    // Calculate totals
                                                    const completedAttendances = p.presensi_pelatihans?.filter(
                                                        ap => ap.status === 'hadir' && ap.pelatihan?.status === 'selesai'
                                                    ) || [];
                                                    const totalSkp = completedAttendances.reduce((acc, curr) => acc + (curr.pelatihan?.skp || 0), 0);

                                                    return (
                                                        <tr key={p.id} className="hover:bg-neutral-50/50 transition">
                                                            <td className="px-6 py-4 font-semibold text-neutral-800">
                                                                {p.name}
                                                            </td>
                                                            <td className="px-6 py-4 text-neutral-500 capitalize">
                                                                {p.jabatan}
                                                            </td>
                                                            <td className="px-6 py-4 text-center font-bold text-[#0071e3]">
                                                                {totalSkp}
                                                            </td>
                                                            <td className="px-6 py-4 text-center font-semibold text-neutral-700">
                                                                {completedAttendances.length}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Section 2: Riwayat Kegiatan Pelatihan Selesai */}
                            <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
                                <h3 className="text-base font-bold text-neutral-800 border-b border-neutral-100 pb-3">Riwayat Kegiatan Pelatihan Selesai</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-neutral-600">
                                        <thead className="text-xs text-neutral-500 bg-neutral-50 border-b border-neutral-100 font-bold uppercase tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4">Kegiatan</th>
                                                <th className="px-6 py-4">Waktu Pelaksanaan</th>
                                                <th className="px-6 py-4 text-center">SKP</th>
                                                <th className="px-6 py-4 text-center">Status</th>
                                                <th className="px-6 py-4 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100">
                                            {pelatihans.filter(p => p.status === 'selesai').length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-12 text-center text-neutral-400">
                                                        Belum ada data pelatihan yang selesai.
                                                    </td>
                                                </tr>
                                            ) : (
                                                pelatihans.filter(p => p.status === 'selesai').map((p) => (
                                                    <tr key={p.id} className="hover:bg-neutral-50/50 transition">
                                                        <td className="px-6 py-4">
                                                            <div className="font-semibold text-neutral-800">{p.kegiatan}</div>
                                                            <div className="text-xs text-neutral-400 mt-0.5 truncate max-w-[250px]">{p.deskripsi || '-'}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-xs">
                                                            <div><span className="text-neutral-400">Mulai:</span> {formatDate(p.mulai)}</div>
                                                            <div className="mt-0.5"><span className="text-neutral-400">Selesai:</span> {formatDate(p.akhir)}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center font-bold text-[#0071e3]">
                                                            {p.skp}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize bg-blue-50 text-blue-800 border border-blue-200">
                                                                Selesai
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => handleViewDetails(p)}
                                                                className="text-xs font-bold text-neutral-600 hover:text-neutral-800 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1.5 rounded-lg transition"
                                                            >
                                                                Lihat Peserta ({p.presensi_pelatihans?.length || 0})
                                                            </button>
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

                    {/* PARTNER: PERSETUJUAN */}
                    {isPartner && activeTab === 'persetujuan' && (
                        <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-neutral-100">
                                <h3 className="text-base font-bold text-neutral-800">Pengajuan Pelatihan Menunggu Persetujuan</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-neutral-600">
                                    <thead className="text-xs text-neutral-500 bg-neutral-50 border-b border-neutral-100 font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">Kegiatan</th>
                                            <th className="px-6 py-4">Waktu Pelaksanaan</th>
                                            <th className="px-6 py-4 text-center">SKP</th>
                                            <th className="px-6 py-4 text-center">Pembuat</th>
                                            <th className="px-6 py-4 text-right">Tindakan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {pelatihans.filter(p => p.status === 'menunggu_persetujuan').length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-neutral-400">
                                                    Tidak ada pengajuan pelatihan menunggu persetujuan.
                                                </td>
                                            </tr>
                                        ) : (
                                            pelatihans.filter(p => p.status === 'menunggu_persetujuan').map((p) => (
                                                <tr key={p.id} className="hover:bg-neutral-50/50 transition">
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold text-neutral-800">{p.kegiatan}</div>
                                                        <div className="text-xs text-neutral-400 mt-0.5 max-w-[200px] truncate">{p.deskripsi || '-'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs">
                                                        <div><span className="text-neutral-400">Mulai:</span> {formatDate(p.mulai)}</div>
                                                        <div className="mt-0.5"><span className="text-neutral-400">Selesai:</span> {formatDate(p.akhir)}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-[#0071e3]">
                                                        {p.skp}
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-neutral-700 text-xs font-semibold">
                                                        {p.creator?.name || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                                                        <button
                                                            onClick={() => handleApprove(p.id)}
                                                            className="text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition"
                                                        >
                                                            Setujui
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectClick(p)}
                                                            className="text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-lg transition"
                                                        >
                                                            Tolak
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* PELATIHAN TERSEDIA / AKTIF (Semua Role) */}
                    {activeTab === 'tersedia' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {availablePelatihans.length === 0 ? (
                                <div className="col-span-1 md:col-span-2 bg-white border border-neutral-200/80 rounded-2xl p-12 text-center text-neutral-400">
                                    Saat ini tidak ada pelatihan aktif yang tersedia.
                                </div>
                            ) : (
                                availablePelatihans.map((p) => {
                                    const now = new Date();
                                    const start = new Date(p.mulai);
                                    const end = new Date(p.akhir);
                                    const isOpen = now >= start && now <= end;

                                    return (
                                        <div key={p.id} className="bg-white border border-neutral-200/80 hover:border-[#0071e3]/30 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-6 relative overflow-hidden group">
                                            {/* Top corner gradient accents for premium feel */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-[#0071e3]/10 transition-colors duration-300"></div>
                                            
                                            <div className="space-y-3 relative">
                                                <div className="flex justify-between items-start gap-4">
                                                    <h4 className="font-bold text-neutral-800 text-lg tracking-tight group-hover:text-[#0071e3] transition-colors">
                                                        {p.kegiatan}
                                                    </h4>
                                                    <span className="bg-blue-50 border border-blue-100 text-[#0071e3] text-xs font-extrabold px-3 py-1 rounded-xl shrink-0">
                                                        {p.skp} SKP
                                                    </span>
                                                </div>
                                                <p className="text-sm text-neutral-500 line-clamp-3 leading-relaxed">
                                                    {p.deskripsi || 'Tidak ada deskripsi kegiatan.'}
                                                </p>
                                                <div className="border-t border-neutral-100 pt-3 space-y-1.5 text-xs text-neutral-500">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-neutral-400">Mulai:</span>
                                                        <span className="font-semibold text-neutral-700">{formatDate(p.mulai)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-neutral-400">Selesai:</span>
                                                        <span className="font-semibold text-neutral-700">{formatDate(p.akhir)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-4 relative">
                                                <div>
                                                    {p.has_presensi ? (
                                                        <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                                                            ✓ Kehadiran Tercatat
                                                        </span>
                                                    ) : (
                                                        <span className={`inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-xl ${
                                                            isOpen ? 'text-amber-600 bg-amber-50 border border-amber-100' : 'text-neutral-400 bg-neutral-50 border border-neutral-100'
                                                        }`}>
                                                            {isOpen ? '● Presensi Dibuka' : 'Presensi Belum Dibuka'}
                                                        </span>
                                                    )}
                                                </div>

                                                {!p.has_presensi && (
                                                    isOpen ? (
                                                        <a
                                                            href={route('pelatihan.scan')}
                                                            className="font-bold px-5 py-2.5 rounded-xl shadow-sm text-xs transition duration-300 bg-[#0071e3] text-white hover:bg-blue-600 shadow-blue-500/10"
                                                        >
                                                            Isi Presensi
                                                        </a>
                                                    ) : (
                                                        <button
                                                            disabled
                                                            className="font-bold px-5 py-2.5 rounded-xl shadow-sm text-xs bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200"
                                                        >
                                                            Isi Presensi
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* PERSONAL REKAP SAYA (Semua Role) */}
                    {(activeTab === 'riwayat_saya' || activeTab === 'rekap_admin' || activeTab === 'riwayat') && (
                        <div className="space-y-6">
                            {/* Banner Kumulatif SKP untuk Pegawai */}
                            <div className="bg-white/70 backdrop-blur-md border border-neutral-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4 text-left">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-[#0071e3] flex items-center justify-center text-white shadow-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.75m-9 3.75v-3.75m9-.003c1.11 0 2.01-.893 2.01-2v-1.002c0-1.107-.9-2-2.01-2m-9 .002c-1.11 0-2.01-.893-2.01-2v-1.002c0-1.107.9-2 2.01-2m9 6.002a2 2 0 0 0-2-2m-5 2a2 2 0 0 1-2-2m5-2a2 2 0 0 0-2-2m-3 2a2 2 0 0 1-2-2M12 3v3.75" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-neutral-800">Akumulasi Nilai SKP Anda</h3>
                                        <p className="text-xs text-neutral-500 mt-0.5">Dihitung dari seluruh pelatihan selesai yang Anda ikuti.</p>
                                    </div>
                                </div>
                                <div className="bg-blue-50 border border-blue-100 rounded-2xl px-8 py-3.5 flex flex-col items-center justify-center min-w-[150px]">
                                    <span className="text-3xl font-black text-[#0071e3]">{accumulatedSkp}</span>
                                    <span className="text-[10px] font-bold text-blue-500 tracking-wider uppercase mt-1">Poin SKP</span>
                                </div>
                            </div>

                            <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
                                <h3 className="text-base font-bold text-neutral-800 border-b border-neutral-100 pb-3">Daftar Keikutsertaan Pelatihan</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-neutral-600">
                                    <thead className="text-xs text-neutral-500 bg-neutral-50 border-b border-neutral-100 font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">Pelatihan</th>
                                            <th className="px-6 py-4">Waktu</th>
                                            <th className="px-6 py-4 text-center">Status Kehadiran</th>
                                            <th className="px-6 py-4 text-center">Poin SKP</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {personalHistory.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-8 text-center text-neutral-400">
                                                    Anda belum memiliki riwayat presensi pelatihan.
                                                </td>
                                            </tr>
                                        ) : (
                                            personalHistory.map((h) => (
                                                <tr key={h.id} className="hover:bg-neutral-50/50 transition">
                                                    <td className="px-6 py-4 font-semibold text-neutral-800">
                                                        {h.pelatihan?.kegiatan}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-neutral-500">
                                                        {formatDate(h.pelatihan?.mulai)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                                                            h.status === 'hadir' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                                                            'bg-rose-50 text-rose-800 border border-rose-200'
                                                        }`}>
                                                            {h.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-[#0071e3]">
                                                        {h.skp}
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

            {/* FORM MODAL (ADMIN: BUAT/EDIT) */}
            {showFormModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowFormModal(false)}></div>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-neutral-100 max-w-lg w-full relative z-10 animate-fade-in-up">
                        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-neutral-800">
                                {editingId ? 'Edit Pelatihan' : 'Buat Pelatihan Baru'}
                            </h3>
                            <button onClick={() => setShowFormModal(false)} className="text-neutral-400 hover:text-neutral-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Nama Kegiatan</label>
                                <input
                                    type="text"
                                    required
                                    value={data.kegiatan}
                                    onChange={e => setData('kegiatan', e.target.value)}
                                    className="w-full rounded-xl border border-neutral-200 text-sm py-2.5 px-3 focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
                                />
                                {errors.kegiatan && <div className="text-xs text-rose-500 mt-1">{errors.kegiatan}</div>}
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Deskripsi</label>
                                <textarea
                                    value={data.deskripsi}
                                    onChange={e => setData('deskripsi', e.target.value)}
                                    rows="3"
                                    className="w-full rounded-xl border border-neutral-200 text-sm py-2.5 px-3 focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
                                />
                                {errors.deskripsi && <div className="text-xs text-rose-500 mt-1">{errors.deskripsi}</div>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Poin SKP</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={data.skp}
                                        onChange={e => setData('skp', parseInt(e.target.value) || 0)}
                                        className="w-full rounded-xl border border-neutral-200 text-sm py-2.5 px-3 focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
                                    />
                                    {errors.skp && <div className="text-xs text-rose-500 mt-1">{errors.skp}</div>}
                                </div>
                                <div className="space-y-1">
                                    {/* Empty grid space */}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Waktu Mulai</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={data.mulai}
                                        onChange={e => setData('mulai', e.target.value)}
                                        className="w-full rounded-xl border border-neutral-200 text-sm py-2.5 px-3 focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
                                    />
                                    {errors.mulai && <div className="text-xs text-rose-500 mt-1">{errors.mulai}</div>}
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Waktu Selesai</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={data.akhir}
                                        onChange={e => setData('akhir', e.target.value)}
                                        className="w-full rounded-xl border border-neutral-200 text-sm py-2.5 px-3 focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
                                    />
                                    {errors.akhir && <div className="text-xs text-rose-500 mt-1">{errors.akhir}</div>}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowFormModal(false)}
                                    className="bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold py-2 px-4 rounded-xl text-sm transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-[#0071e3] hover:bg-blue-600 text-white font-bold py-2 px-5 rounded-xl text-sm transition disabled:opacity-50"
                                >
                                    {editingId ? 'Simpan Perubahan' : 'Buat Pelatihan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QR CODE MODAL (ADMIN: QR) */}
            {showQrModal && selectedPelatihan && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowQrModal(false)}></div>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-neutral-100 max-w-sm w-full relative z-10 animate-fade-in-up">
                        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                            <h3 className="text-md font-bold text-neutral-800">QR Code Presensi</h3>
                            <button onClick={() => setShowQrModal(false)} className="text-neutral-400 hover:text-neutral-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 flex flex-col items-center justify-center gap-4 text-center">
                            <div className="font-bold text-neutral-800 text-sm leading-snug">{selectedPelatihan.kegiatan}</div>
                            <div className="text-xs text-neutral-400">Pindai QR Code ini menggunakan HP pegawai untuk mencatat kehadiran.</div>
                            
                            <div className="p-3 bg-white border border-neutral-100 rounded-2xl shadow-inner mt-2">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getPresensiLink(selectedPelatihan.presence_token))}`}
                                    alt="Pelatihan QR Code"
                                    className="w-[200px] h-[200px]"
                                />
                            </div>

                            <div className="w-full space-y-2 mt-4">
                                <button
                                    onClick={() => copyToClipboard(getPresensiLink(selectedPelatihan.presence_token))}
                                    className="w-full flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-2.5 px-4 rounded-xl text-xs transition"
                                >
                                    Salin Link Presensi
                                </button>
                                <button
                                    onClick={() => setShowQrModal(false)}
                                    className="w-full bg-[#0071e3] hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition"
                                >
                                    Tutup Halaman
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* REJECTION REASON MODAL (PARTNER: REJECT) */}
            {showRejectModal && rejectingPelatihan && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowRejectModal(false)}></div>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-neutral-100 max-w-md w-full relative z-10 animate-fade-in-up">
                        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                            <h3 className="text-md font-bold text-neutral-800">Tolak Pengajuan Pelatihan</h3>
                            <button onClick={() => setShowRejectModal(false)} className="text-neutral-400 hover:text-neutral-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleRejectSubmit} className="p-5 space-y-4">
                            <div className="text-xs text-neutral-500 leading-relaxed">
                                Mohon berikan alasan penolakan untuk pelatihan <span className="font-bold text-neutral-800">"{rejectingPelatihan.kegiatan}"</span> agar admin dapat memperbaikinya.
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Alasan Penolakan</label>
                                <textarea
                                    required
                                    value={rejectReason}
                                    onChange={e => {
                                        setRejectReason(e.target.value);
                                        if (e.target.value.length >= 5) setRejectError('');
                                    }}
                                    rows="4"
                                    placeholder="Masukkan alasan penolakan..."
                                    className="w-full rounded-xl border border-neutral-200 text-sm py-2.5 px-3 focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
                                />
                                {rejectError && <div className="text-xs text-rose-500 mt-1">{rejectError}</div>}
                            </div>
                            <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowRejectModal(false)}
                                    className="bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold py-2 px-4 rounded-xl text-xs transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-5 rounded-xl text-xs transition"
                                >
                                    Tolak Pengajuan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DETAIL MODAL (ADMIN/PARTNER: VIEW PARTICIPANTS) */}
            {showDetailModal && detailPelatihan && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowDetailModal(false)}></div>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-neutral-100 max-w-2xl w-full relative z-10 animate-fade-in-up">
                        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-md font-bold text-neutral-800">Detail Kehadiran Peserta</h3>
                                <p className="text-xs text-neutral-400 mt-1">{detailPelatihan.kegiatan}</p>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="text-neutral-400 hover:text-neutral-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 max-h-[400px] overflow-y-auto">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-neutral-600">
                                    <thead className="text-xs text-neutral-500 bg-neutral-50 border-b border-neutral-100 font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3">Nama Pegawai</th>
                                            <th className="px-4 py-3">Jabatan</th>
                                            <th className="px-4 py-3 text-center">Status</th>
                                            <th className="px-4 py-3 text-right">Waktu Presensi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 text-xs">
                                        {(!detailPelatihan.presensi_pelatihans || detailPelatihan.presensi_pelatihans.length === 0) ? (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-6 text-center text-neutral-400">
                                                    Tidak ada data kehadiran peserta.
                                                </td>
                                            </tr>
                                        ) : (
                                            detailPelatihan.presensi_pelatihans.map((presensi) => (
                                                <tr key={presensi.id} className="hover:bg-neutral-50/50">
                                                    <td className="px-4 py-3 font-semibold text-neutral-800">
                                                        {presensi.pegawai?.name || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-500 capitalize">
                                                        {presensi.pegawai?.jabatan || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                                            presensi.status === 'hadir' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                                                            'bg-rose-50 text-rose-800 border border-rose-200'
                                                        }`}>
                                                            {presensi.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-neutral-500">
                                                        {presensi.checkin_at ? formatDate(presensi.checkin_at) : '-'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="p-5 border-t border-neutral-100 flex justify-end">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-2 px-5 rounded-xl text-xs transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
