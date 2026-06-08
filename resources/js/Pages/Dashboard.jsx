import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import AuditFormWizard from '@/Components/AuditFormWizard';
import axios from 'axios';

export default function Dashboard({ auth, forms }) {
    const user = auth.user;
    const [showWizard, setShowWizard] = useState(false);
    const [selectedForm, setSelectedForm] = useState(null);
    const [viewDetailForm, setViewDetailForm] = useState(null);
    const [activeDetailTab, setActiveDetailTab] = useState(0);

    const handleOpenDetail = (form) => {
        setViewDetailForm(form);
        setActiveDetailTab(0);
    };

    // Ketua Tim Review state
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewForm, setReviewForm] = useState(null);
    const [reviewAction, setReviewAction] = useState('approve');
    const [rejectReason, setRejectReason] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    const handleCreateNew = () => {
        setSelectedForm(null);
        setShowWizard(true);
    };

    const handleEditForm = (form) => {
        setSelectedForm(form);
        setShowWizard(true);
    };

    const handleSaveSuccess = () => {
        setShowWizard(false);
        setSelectedForm(null);
        router.reload();
    };

    const handleSubmitToReview = (formId) => {
        if (confirm('Kirim formulir ini ke Ketua Tim untuk direview?')) {
            router.post(route('audit-forms.submit', formId), {}, {
                onSuccess: () => router.reload()
            });
        }
    };

    const handleOpenReview = (form) => {
        setReviewForm(form);
        setReviewAction('approve');
        setRejectReason('');
        setShowReviewModal(true);
    };

    const handleSubmitReview = (e) => {
        e.preventDefault();
        setSubmittingReview(true);

        router.post(route('audit-forms.review', reviewForm.id), {
            action: reviewAction,
            reject_reason: rejectReason
        }, {
            onSuccess: () => {
                setShowReviewModal(false);
                setReviewForm(null);
                setSubmittingReview(false);
                router.reload();
            },
            onError: () => setSubmittingReview(false)
        });
    };

    const handleApproveSupervisor = (formId) => {
        if (confirm('Setujui formulir audit ini secara final?')) {
            router.post(route('audit-forms.approve-supervisor', formId), {}, {
                onSuccess: () => router.reload()
            });
        }
    };

    // Helper for rendering badges
    const renderStatusBadge = (status) => {
        const styles = {
            draft: 'bg-neutral-100 text-neutral-600 border-neutral-200/80',
            pending_approval: 'bg-orange-50 text-orange-600 border-orange-200',
            approved_by_leader: 'bg-blue-50 text-blue-600 border-blue-200',
            approved: 'bg-green-50 text-green-600 border-green-200',
            rejected: 'bg-red-50 text-red-600 border-red-200',
        };

        const labels = {
            draft: 'Draft',
            pending_approval: 'Menunggu Persetujuan',
            approved_by_leader: 'Disetujui Ketua Tim',
            approved: 'Disetujui Final',
            rejected: 'Ditolak',
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0071e3] border border-blue-100 flex items-center justify-center shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.375M9 18h3.375m-6.75 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3H5.25A3 3 0 0 0 2.25 6v12a3 3 0 0 0 3 3Z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-[#1d1d1f] tracking-tight">
                                Persetujuan Dokumen Audit
                            </h2>
                            <p className="text-xs text-neutral-400 font-medium">Manajemen Evaluasi & Penerimaan Klien KAP</p>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-3 bg-neutral-50/80 px-4 py-2 rounded-xl border border-neutral-200/60 shadow-sm backdrop-blur-sm">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left">
                            <span className="block text-[9px] text-neutral-400 font-bold uppercase tracking-wider">PENGGUNA AKTIF</span>
                            <span className="text-xs text-neutral-600 font-medium">
                                👋 Selamat bekerja, <strong className="text-[#0071e3] font-bold">{user.name}</strong>
                            </span>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Top Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        <div className="glass-panel p-4 md:p-5 rounded-xl md:rounded-2xl flex items-center justify-between animate-fade-in-up hover:-translate-y-1 hover:shadow-md hover:border-[#0071e3]/20 transition-all duration-300 ease-out" style={{ animationDelay: '0.05s' }}>
                            <div>
                                <p className="text-[10px] md:text-xs text-neutral-500 font-semibold uppercase tracking-wider">Total Formulir</p>
                                <h3 className="text-2xl md:text-3xl font-bold text-[#1d1d1f] mt-1">{forms.length}</h3>
                            </div>
                            <div className="bg-blue-50 p-2 md:p-3 rounded-lg md:rounded-xl border border-blue-100 text-[#0071e3] shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                            </div>
                        </div>

                        <div className="glass-panel p-4 md:p-5 rounded-xl md:rounded-2xl flex items-center justify-between animate-fade-in-up hover:-translate-y-1 hover:shadow-md hover:border-orange-500/20 transition-all duration-300 ease-out" style={{ animationDelay: '0.1s' }}>
                            <div>
                                <p className="text-[10px] md:text-xs text-neutral-500 font-semibold uppercase tracking-wider">Menunggu Approval</p>
                                <h3 className="text-2xl md:text-3xl font-bold text-orange-500 mt-1">
                                    {forms.filter(f => f.status === 'pending_approval').length}
                                </h3>
                            </div>
                            <div className="bg-orange-50 p-2 md:p-3 rounded-lg md:rounded-xl border border-orange-100 text-orange-500 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="glass-panel p-4 md:p-5 rounded-xl md:rounded-2xl flex items-center justify-between animate-fade-in-up hover:-translate-y-1 hover:shadow-md hover:border-green-600/20 transition-all duration-300 ease-out" style={{ animationDelay: '0.15s' }}>
                            <div>
                                <p className="text-[10px] md:text-xs text-neutral-500 font-semibold uppercase tracking-wider">Disetujui Final</p>
                                <h3 className="text-2xl md:text-3xl font-bold text-green-600 mt-1">
                                    {forms.filter(f => f.status === 'approved').length}
                                </h3>
                            </div>
                            <div className="bg-green-50 p-2 md:p-3 rounded-lg md:rounded-xl border border-green-100 text-green-600 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="glass-panel p-4 md:p-5 rounded-xl md:rounded-2xl flex items-center justify-between animate-fade-in-up hover:-translate-y-1 hover:shadow-md hover:border-red-500/20 transition-all duration-300 ease-out" style={{ animationDelay: '0.2s' }}>
                            <div>
                                <p className="text-[10px] md:text-xs text-neutral-500 font-semibold uppercase tracking-wider">Form Ditolak</p>
                                <h3 className="text-2xl md:text-3xl font-bold text-red-500 mt-1">
                                    {forms.filter(f => f.status === 'rejected').length}
                                </h3>
                            </div>
                            <div className="bg-red-50 p-2 md:p-3 rounded-lg md:rounded-xl border border-red-100 text-red-500 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Main Workflow Area */}
                    {showWizard ? (
                        <AuditFormWizard
                            formToEdit={selectedForm}
                            onClose={() => setShowWizard(false)}
                            onSaveSuccess={handleSaveSuccess}
                        />
                    ) : (
                        <div className="glass-panel rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
                            <div className="p-6 border-b border-neutral-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-[#1d1d1f]">Daftar Dokumen Survei Pendahuluan - A10</h3>
                                    <p className="text-neutral-500 text-xs mt-1">Klik nama klien untuk melihat pratinjau detail.</p>
                                </div>
                                {user.role === 'anggota' && (
                                    <button
                                        onClick={handleCreateNew}
                                        className="btn-glow-indigo text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                        Isi Form Baru
                                    </button>
                                )}
                            </div>

                            {/* Desktop Table - Hidden on Mobile */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-200 text-xs text-neutral-500 bg-neutral-50/80">
                                            <th className="py-4 px-6">NAMA KLIEN</th>
                                            <th className="py-4 px-6">TAHUN BUKU</th>
                                            <th className="py-4 px-6">STATUS</th>
                                            <th className="py-4 px-6">DISIAPKAN OLEH</th>
                                            <th className="py-4 px-6">TANGGAL UPDATE</th>
                                            <th className="py-4 px-6 text-right">AKSI</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 text-sm text-neutral-700">
                                        {forms.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="py-12 text-center text-neutral-400">
                                                    Belum ada data formulir audit.
                                                </td>
                                            </tr>
                                        ) : (
                                            forms.map((form) => (
                                                <tr key={form.id} className="hover:bg-neutral-50/50 transition border-b border-neutral-100">
                                                    <td className="py-4 px-6 font-semibold text-neutral-900">
                                                        <button onClick={() => handleOpenDetail(form)} className="hover:text-[#0071e3] text-left">
                                                            {form.client_name}
                                                        </button>
                                                    </td>
                                                    <td className="py-4 px-6 text-xs text-neutral-600">{form.book_year}</td>
                                                    <td className="py-4 px-6">{renderStatusBadge(form.status)}</td>
                                                    <td className="py-4 px-6 text-xs text-neutral-600">{form.preparer?.name}</td>
                                                    <td className="py-4 px-6 text-xs text-neutral-500">
                                                        {new Date(form.updated_at).toLocaleDateString('id-ID', {
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {/* Details button */}
                                                            <button
                                                                onClick={() => handleOpenDetail(form)}
                                                                className="px-2.5 py-1 border border-neutral-200 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-50 transition text-xs"
                                                            >
                                                                Detail
                                                            </button>

                                                            {/* Anggota Actions */}
                                                            {user.role === 'anggota' && (form.status === 'draft' || form.status === 'rejected') && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleEditForm(form)}
                                                                        className="px-2.5 py-1 bg-blue-50 text-[#0071e3] border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-semibold"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleSubmitToReview(form.id)}
                                                                        className="px-2.5 py-1 bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 rounded-lg text-xs font-semibold"
                                                                    >
                                                                        Submit
                                                                    </button>
                                                                </>
                                                            )}

                                                            {/* Ketua Tim Actions */}
                                                            {user.role === 'ketua_tim' && form.status === 'pending_approval' && (
                                                                <button
                                                                    onClick={() => handleOpenReview(form)}
                                                                    className="px-2.5 py-1 bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 rounded-lg text-xs font-semibold"
                                                                >
                                                                    Review
                                                                </button>
                                                            )}

                                                            {/* Supervisor Actions */}
                                                            {user.role === 'supervisor' && form.status === 'approved_by_leader' && (
                                                                <button
                                                                    onClick={() => handleApproveSupervisor(form.id)}
                                                                    className="px-2.5 py-1 bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 rounded-lg text-xs font-semibold"
                                                                >
                                                                    Setujui Final
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card List - Visible on Mobile only */}
                            <div className="block md:hidden divide-y divide-neutral-100">
                                {forms.length === 0 ? (
                                    <div className="py-12 text-center text-neutral-400 text-sm">
                                        Belum ada data formulir audit.
                                    </div>
                                ) : (
                                    forms.map((form) => (
                                        <div key={form.id} className="p-5 space-y-4 hover:bg-neutral-50/50 transition">
                                            <div className="flex justify-between items-start gap-3">
                                                <div>
                                                    <button
                                                        onClick={() => handleOpenDetail(form)}
                                                        className="font-bold text-neutral-900 hover:text-[#0071e3] text-left text-base"
                                                    >
                                                        {form.client_name}
                                                    </button>
                                                    <span className="block text-xs text-neutral-500 mt-1">
                                                        Tahun Buku: <strong className="text-neutral-700">{form.book_year}</strong>
                                                    </span>
                                                </div>
                                                <div className="shrink-0">
                                                    {renderStatusBadge(form.status)}
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center text-xs text-neutral-500 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">
                                                <div>
                                                    <span className="block text-[9px] text-neutral-400 font-bold uppercase">DISIAPKAN OLEH</span>
                                                    <span className="font-semibold text-neutral-700">{form.preparer?.name || '-'}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-[9px] text-neutral-400 font-bold uppercase">TANGGAL UPDATE</span>
                                                    <span className="font-semibold text-neutral-700 text-right block">
                                                        {new Date(form.updated_at).toLocaleDateString('id-ID', {
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Mobile Actions block */}
                                            <div className="flex flex-wrap gap-2 pt-1.5 justify-end">
                                                <button
                                                    onClick={() => handleOpenDetail(form)}
                                                    className="flex-1 min-w-[70px] text-center py-2 border border-neutral-200 text-neutral-600 hover:text-neutral-900 rounded-xl hover:bg-neutral-50 transition text-xs font-semibold"
                                                >
                                                    Detail
                                                </button>

                                                {/* Anggota Actions */}
                                                {user.role === 'anggota' && (form.status === 'draft' || form.status === 'rejected') && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEditForm(form)}
                                                            className="flex-1 min-w-[70px] text-center py-2 bg-blue-50 text-[#0071e3] border border-blue-200 hover:bg-blue-100 rounded-xl text-xs font-bold"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleSubmitToReview(form.id)}
                                                            className="flex-1 min-w-[70px] text-center py-2 bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 rounded-xl text-xs font-bold"
                                                        >
                                                            Submit
                                                        </button>
                                                    </>
                                                )}

                                                {/* Ketua Tim Actions */}
                                                {user.role === 'ketua_tim' && form.status === 'pending_approval' && (
                                                    <button
                                                        onClick={() => handleOpenReview(form)}
                                                        className="flex-1 min-w-[100px] text-center py-2 bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 rounded-xl text-xs font-bold"
                                                    >
                                                        Review
                                                    </button>
                                                )}

                                                {/* Supervisor Actions */}
                                                {user.role === 'supervisor' && form.status === 'approved_by_leader' && (
                                                    <button
                                                        onClick={() => handleApproveSupervisor(form.id)}
                                                        className="flex-1 min-w-[120px] text-center py-2 bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 rounded-xl text-xs font-bold"
                                                    >
                                                        Setujui Final
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Ketua Tim Review Modal */}
            {showReviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
                    <div className="glass-panel w-full max-w-md p-6 rounded-2xl animate-fade-in-up border border-neutral-200">
                        <h3 className="text-lg font-bold text-[#1d1d1f] mb-2">Review Formulir: {reviewForm.client_name}</h3>
                        <p className="text-neutral-500 text-xs mb-4">Pilih keputusan persetujuan untuk data survei pendahuluan ini.</p>

                        <form onSubmit={handleSubmitReview} className="space-y-4">
                            <div>
                                <label className="block text-xs text-neutral-500 font-semibold mb-2">KEPUTUSAN</label>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setReviewAction('approve')}
                                        className={`px-4 py-2.5 rounded-lg text-xs font-bold border flex-1 transition ${reviewAction === 'approve'
                                            ? 'bg-green-50 border-green-500 text-green-600 font-semibold'
                                            : 'border-neutral-200 bg-white text-neutral-600 hover:text-neutral-800'
                                            }`}
                                    >
                                        Setujui & Teruskan
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReviewAction('reject')}
                                        className={`px-4 py-2.5 rounded-lg text-xs font-bold border flex-1 transition ${reviewAction === 'reject'
                                            ? 'bg-red-50 border-red-500 text-red-600 font-semibold'
                                            : 'border-neutral-200 bg-white text-neutral-600 hover:text-neutral-800'
                                            }`}
                                    >
                                        Tolak / Perlu Koreksi
                                    </button>
                                </div>
                            </div>

                            {reviewAction === 'reject' && (
                                <div className="animate-fade-in-up">
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">ALASAN PENOLAKAN / INSTRUKSI PERBAIKAN</label>
                                    <textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        className="w-full custom-input p-3 text-sm h-24"
                                        placeholder="Masukkan detail perbaikan yang diperlukan..."
                                        required
                                    />
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                                <button
                                    type="button"
                                    onClick={() => setShowReviewModal(false)}
                                    className="px-4 py-2 border border-neutral-200 text-neutral-600 hover:text-neutral-800 rounded-lg hover:bg-neutral-50 text-xs transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    className="btn-glow-indigo text-xs font-semibold px-4 py-2 rounded-lg"
                                >
                                    {submittingReview ? 'Memproses...' : 'Kirim Keputusan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail View Modal */}
            {viewDetailForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
                    <div className="glass-panel w-full max-w-4xl p-4 sm:p-6 rounded-2xl my-8 animate-fade-in-up border border-neutral-200 max-h-[90vh] overflow-y-auto flex flex-col bg-white/95">
                        
                        {/* Modal Header */}
                        <div className="flex justify-between items-start border-b border-neutral-200 pb-4 mb-4 shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-[#1d1d1f] tracking-tight">{viewDetailForm.client_name}</h3>
                                <p className="text-neutral-500 text-xs mt-1">Pratinjau detail formulir survei pendahuluan - Tahun Buku {viewDetailForm.book_year}</p>
                            </div>
                            <button
                                onClick={() => setViewDetailForm(null)}
                                className="px-3.5 py-1.5 border border-neutral-200 text-neutral-600 hover:text-neutral-900 rounded-xl text-xs font-semibold hover:bg-neutral-50 transition"
                            >
                                Tutup
                            </button>
                        </div>

                        {/* Workflow Tracker (Workflow Visual Indicator) */}
                        <div className="mb-6 bg-neutral-50/50 p-4 rounded-xl border border-neutral-200/60 shrink-0">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Status Alur Kerja:</span>
                                    {renderStatusBadge(viewDetailForm.status)}
                                </div>
                                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
                                    <div className="flex items-center gap-1">
                                        <div className={`w-2.5 h-2.5 rounded-full ${viewDetailForm.status === 'draft' ? 'bg-neutral-400 animate-pulse' : 'bg-green-500'}`} />
                                        <span>Draft</span>
                                    </div>
                                    <div className="w-4 h-[1px] bg-neutral-300" />
                                    <div className="flex items-center gap-1">
                                        <div className={`w-2.5 h-2.5 rounded-full ${viewDetailForm.status === 'pending_approval' ? 'bg-orange-500 animate-pulse' : viewDetailForm.status === 'draft' ? 'bg-neutral-300' : 'bg-green-500'}`} />
                                        <span>Review</span>
                                    </div>
                                    <div className="w-4 h-[1px] bg-neutral-300" />
                                    <div className="flex items-center gap-1">
                                        <div className={`w-2.5 h-2.5 rounded-full ${viewDetailForm.status === 'approved_by_leader' ? 'bg-blue-500 animate-pulse' : (viewDetailForm.status === 'draft' || viewDetailForm.status === 'pending_approval') ? 'bg-neutral-300' : 'bg-green-500'}`} />
                                        <span>Ketua Tim</span>
                                    </div>
                                    <div className="w-4 h-[1px] bg-neutral-300" />
                                    <div className="flex items-center gap-1">
                                        <div className={`w-2.5 h-2.5 rounded-full ${viewDetailForm.status === 'approved' ? 'bg-green-500' : 'bg-neutral-300'}`} />
                                        <span>Final</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rejection comment banner */}
                        {viewDetailForm.status === 'rejected' && viewDetailForm.reject_reason && (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 shrink-0">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-1">Catatan Penolakan Ketua Tim:</h4>
                                <p className="text-sm">{viewDetailForm.reject_reason}</p>
                            </div>
                        )}

                        {/* Custom Segmented Control (Tabs Navigation) */}
                        <div className="flex bg-neutral-100 p-1 rounded-xl mb-6 overflow-x-auto whitespace-nowrap scrollbar-none gap-1 shrink-0">
                            {['Ringkasan Penugasan', 'Pemahaman SA 210', 'Latar Belakang & GC', 'Akuntansi & Bantuan Klien', 'Evaluasi Kualitatif'].map((tab, idx) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveDetailTab(idx)}
                                    className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg transition-all duration-200 ${
                                        activeDetailTab === idx 
                                            ? 'bg-white text-[#0071e3] shadow-sm' 
                                            : 'text-neutral-500 hover:text-neutral-800'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Tabs Content - Scrollable area */}
                        <div className="flex-1 overflow-y-auto pr-1 text-sm space-y-6">
                            
                            {/* Tab 1: Ringkasan Penugasan */}
                            {activeDetailTab === 0 && (
                                <div className="space-y-6 animate-fade-in-up">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Client details card */}
                                        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Informasi Klien</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <span className="text-[10px] text-neutral-400 font-bold block">NAMA KLIEN</span>
                                                    <span className="text-neutral-900 font-extrabold text-base">{viewDetailForm.client_name}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <span className="text-[10px] text-neutral-400 font-bold block">TAHUN BUKU</span>
                                                        <span className="text-neutral-800 font-bold text-sm">{viewDetailForm.book_year}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-neutral-400 font-bold block">JADWAL/SKEDUL</span>
                                                        <span className="text-neutral-800 font-bold text-sm">{viewDetailForm.schedule || '-'}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-neutral-400 font-bold block">RUANG LINGKUP JASA</span>
                                                    <span className="text-neutral-800 font-semibold text-xs">{viewDetailForm.section_data?.section_2_c || '-'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Summary Status card */}
                                        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Tim Audit & Kesimpulan</h4>
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-3 gap-2 text-xs">
                                                    <div className="bg-neutral-50 p-2 rounded-xl border border-neutral-100/80">
                                                        <span className="text-[9px] text-neutral-400 block uppercase font-bold text-center">PREPARER</span>
                                                        <span className="text-neutral-800 font-bold block text-center truncate mt-0.5">{viewDetailForm.preparer?.name || '-'}</span>
                                                    </div>
                                                    <div className="bg-neutral-50 p-2 rounded-xl border border-neutral-100/80">
                                                        <span className="text-[9px] text-neutral-400 block uppercase font-bold text-center">REVIEWER</span>
                                                        <span className="text-neutral-800 font-bold block text-center truncate mt-0.5">{viewDetailForm.reviewer?.name || '-'}</span>
                                                    </div>
                                                    <div className="bg-neutral-50 p-2 rounded-xl border border-neutral-100/80">
                                                        <span className="text-[9px] text-neutral-400 block uppercase font-bold text-center">APPROVER</span>
                                                        <span className="text-neutral-800 font-bold block text-center truncate mt-0.5">{viewDetailForm.approver?.name || '-'}</span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
                                                    <div className="bg-red-50/50 p-2.5 rounded-xl border border-red-100 text-center">
                                                        <span className="text-[9px] text-red-500 block font-bold uppercase tracking-wider">TINGKAT RISIKO</span>
                                                        <span className="text-red-600 font-extrabold text-sm mt-0.5 block">{viewDetailForm.section_data?.section_b?.level_risiko || '-'}</span>
                                                    </div>
                                                    <div className="bg-green-50/50 p-2.5 rounded-xl border border-green-100 text-center">
                                                        <span className="text-[9px] text-green-600 block font-bold uppercase tracking-wider">KEPUTUSAN</span>
                                                        <span className="text-green-700 font-extrabold text-sm mt-0.5 block">{viewDetailForm.section_data?.section_b?.kesimpulan || '-'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Prakiraan Kontrak & Jadwal Pembayaran */}
                                    <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Prakiraan Kontrak & Jadwal Pembayaran</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                            <div>
                                                <span className="text-[10px] text-neutral-400 font-bold block uppercase">PRAKIRAAN NILAI KONTRAK</span>
                                                <span className="text-neutral-800 font-bold text-sm block mt-0.5">{viewDetailForm.section_data?.section_2_h?.nilai_kontrak || '-'}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-neutral-400 font-bold block uppercase">TAHAP PEMBAYARAN</span>
                                                <p className="text-neutral-700 font-medium block mt-0.5 whitespace-pre-line">{viewDetailForm.section_data?.section_2_h?.tahap_pembayaran || '-'}</p>
                                            </div>
                                        </div>
                                        {viewDetailForm.section_data?.section_2_h?.jadwal_pelunasan && viewDetailForm.section_data?.section_2_h?.jadwal_pelunasan?.length > 0 && (
                                            <div className="border-t border-neutral-100 pt-3 mt-1 text-xs">
                                                <span className="text-[10px] text-neutral-400 font-bold block uppercase mb-2">JADWAL PELUNASAN FEE</span>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {viewDetailForm.section_data.section_2_h.jadwal_pelunasan.map((item, idx) => (
                                                        <div key={idx} className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-100/80">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="font-bold text-neutral-700 text-[10px] uppercase">Termin {item.no}</span>
                                                                <span className="text-[#0071e3] font-bold text-[10px]">{item.persen || ''}</span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                                <div>
                                                                    <span className="text-neutral-400 block uppercase">Tanggal/Bulan</span>
                                                                    <span className="text-neutral-800 font-bold">{item.tanggal || '-'}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-neutral-400 block uppercase">Nominal</span>
                                                                    <span className="text-neutral-800 font-bold">{item.nominal || '-'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Auditor Pendahulu Subcard */}
                                    {viewDetailForm.section_data?.section_2_d?.nama_kap && (
                                        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
                                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Informasi Auditor Pendahulu (KAP Lain)</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
                                                <div>
                                                    <span className="text-[10px] text-neutral-400 font-bold block uppercase">NAMA KAP</span>
                                                    <span className="text-neutral-800 font-bold text-sm block mt-0.5">{viewDetailForm.section_data.section_2_d.nama_kap}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-neutral-400 font-bold block uppercase">NAMA AP (PARTNER)</span>
                                                    <span className="text-neutral-800 font-bold text-sm block mt-0.5">{viewDetailForm.section_data.section_2_d.nama_ap || '-'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-neutral-400 font-bold block uppercase">ALAMAT KAP</span>
                                                    <span className="text-neutral-800 font-medium block mt-0.5">{viewDetailForm.section_data.section_2_d.alamat || '-'}</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs border-t border-neutral-100 pt-3 mt-1">
                                                <div>
                                                    <span className="text-[10px] text-neutral-400 block font-bold uppercase">ALASAN PENGGANTIAN AUDITOR</span>
                                                    <p className="text-neutral-700 mt-1 font-medium">{viewDetailForm.section_data.section_2_d.alasan_penggantian || '-'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-neutral-400 block font-bold uppercase">BANTUAN DARI AUDITOR PENDAHULU</span>
                                                    <p className="text-neutral-700 mt-1 font-medium">{viewDetailForm.section_data.section_2_d.bantuan_pendahulu || '-'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab 2: Pemahaman SA 210 */}
                            {activeDetailTab === 1 && (
                                <div className="space-y-4 animate-fade-in-up">
                                    <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
                                        <h4 className="text-sm font-bold text-[#0071e3]">Cakupan Ketentuan Perikatan (SA 210)</h4>
                                        <span className="text-[10px] text-neutral-500 font-bold bg-neutral-100 border border-neutral-200/60 px-2.5 py-1 rounded-full uppercase tracking-wider">Checklist 15 Parameter</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-2 text-xs">
                                        {viewDetailForm.section_data?.section_1?.map((item) => {
                                            const hasData = item.date && item.initial;
                                            return (
                                                <div key={item.no} className="bg-white p-3.5 rounded-xl border border-neutral-200/80 hover:border-blue-100 flex items-start gap-4 hover:bg-neutral-50/20 transition-all duration-200 shadow-sm">
                                                    <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                                                        hasData 
                                                            ? 'bg-green-100 text-green-700 border border-green-200' 
                                                            : 'bg-neutral-100 text-neutral-400 border border-neutral-200/60'
                                                    }`}>
                                                        {hasData ? '✓' : item.no}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-neutral-700 font-semibold leading-relaxed">{item.description}</p>
                                                        {(item.date || item.initial) && (
                                                            <div className="flex flex-wrap gap-2 mt-2.5">
                                                                {item.date && (
                                                                    <span className="inline-flex items-center gap-1.5 text-[10px] bg-blue-50 text-[#0071e3] border border-blue-100 px-2.5 py-0.5 rounded-full font-bold">
                                                                        <svg className="w-3 h-3 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                                                        Tanggal: {item.date}
                                                                    </span>
                                                                )}
                                                                {item.initial && (
                                                                    <span className="inline-flex items-center gap-1 text-[10px] bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20 px-2.5 py-0.5 rounded-full font-bold">
                                                                        Inisial: {item.initial}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Tab 3: Latar Belakang & Kelangsungan Hidup */}
                            {activeDetailTab === 2 && (
                                <div className="space-y-6 animate-fade-in-up">
                                    {/* Bisnis info cards */}
                                    <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Deskripsi & Struktur Klien</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <span className="text-[10px] text-neutral-400 font-bold block">PROFIL SINGKAT BISNIS KLIEN</span>
                                                <p className="text-neutral-700 leading-relaxed font-semibold text-xs mt-0.5">{viewDetailForm.section_data?.section_2_a?.description || '-'}</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-neutral-100 pt-3">
                                                <div>
                                                    <span className="text-[10px] text-neutral-400 font-bold block">ALAMAT OPERASIONAL</span>
                                                    <p className="text-neutral-700 text-xs font-bold mt-0.5">{viewDetailForm.section_data?.section_2_a?.address || '-'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-neutral-400 font-bold block">SUMBER PENDAPATAN UTAMA</span>
                                                    <p className="text-neutral-700 text-xs font-bold mt-0.5">{viewDetailForm.section_data?.section_2_a?.revenue_sources || '-'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dewan / Manajemen cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Komisaris */}
                                        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
                                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Dewan Komisaris</h4>
                                            <div className="divide-y divide-neutral-100">
                                                {viewDetailForm.section_data?.section_2_a?.dewan_komisaris?.map((kom, index) => (
                                                    <div key={index} className="py-2 flex justify-between items-center text-xs">
                                                        <span className="text-neutral-500 font-semibold">{kom.jabatan}</span>
                                                        <span className="text-neutral-900 font-bold">{kom.nama_2024 || kom.nama_2023 || '-'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Direksi */}
                                        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
                                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Dewan Direksi</h4>
                                            <div className="divide-y divide-neutral-100">
                                                {viewDetailForm.section_data?.section_2_a?.dewan_direksi?.map((dir, index) => (
                                                    <div key={index} className="py-2 flex justify-between items-center text-xs">
                                                        <span className="text-neutral-500 font-semibold">{dir.jabatan}</span>
                                                        <span className="text-neutral-900 font-bold">{dir.nama_2024 || dir.nama_2023 || '-'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Going concern questions block */}
                                    <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                                        <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Indikator Going Concern (Kelangsungan Usaha)</h4>
                                            <span className="text-[10px] text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-bold">Evaluasi Risiko</span>
                                        </div>
                                        
                                        <div className="space-y-3 text-xs">
                                            {viewDetailForm.section_data?.section_2_e?.going_concern?.map((item) => (
                                                <div key={item.no} className="p-3.5 bg-neutral-50/50 border border-neutral-200/60 rounded-xl flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <span className="text-neutral-400 font-bold block text-[9px] uppercase">PERTANYAAN {item.no}</span>
                                                        <p className="text-neutral-700 font-bold mt-0.5 leading-relaxed">{item.description}</p>
                                                        {item.notes && (
                                                            <p className="text-neutral-500 italic mt-1 bg-white p-2 rounded border border-neutral-100 text-[11px] font-medium">
                                                                Catatan: {item.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0 ${
                                                        item.value === 'Ya' 
                                                            ? 'bg-red-50 border-red-200 text-red-600' 
                                                            : 'bg-green-50 border-green-200 text-green-600'
                                                    }`}>
                                                        {item.value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mt-2">
                                            <span className="text-[9px] text-neutral-400 font-bold block uppercase tracking-wider">Kesimpulan Kelangsungan Hidup Klien</span>
                                            <p className="text-neutral-800 font-bold italic text-xs mt-1 leading-relaxed">"{viewDetailForm.section_data?.section_2_e?.going_concern_conclusion || '-'}"</p>
                                        </div>
                                    </div>

                                    {/* Section 2.b: Anak Perusahaan & Hubungan Istimewa */}
                                    <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                                        <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Anak Perusahaan & Hubungan Istimewa</h4>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                                                viewDetailForm.section_data?.section_2_b?.has_subsidiary === 'Ya'
                                                    ? 'bg-orange-50 border-orange-200 text-orange-600'
                                                    : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                                            }`}>
                                                {viewDetailForm.section_data?.section_2_b?.has_subsidiary === 'Ya' ? 'Ada Afiliasi' : 'Tidak Ada Afiliasi'}
                                            </span>
                                        </div>
                                        {viewDetailForm.section_data?.section_2_b?.has_subsidiary === 'Ya' && viewDetailForm.section_data?.section_2_b?.related_parties?.length > 0 && (
                                            <div className="overflow-x-auto border border-neutral-100 rounded-xl">
                                                <table className="w-full text-left text-xs border-collapse">
                                                    <thead>
                                                        <tr className="bg-neutral-50 border-b border-neutral-100 text-neutral-400 font-bold uppercase tracking-wider text-[9px]">
                                                            <th className="py-2 px-3 w-10 text-center">No</th>
                                                            <th className="py-2 px-3">Nama Pihak</th>
                                                            <th className="py-2 px-3">Hubungan</th>
                                                            <th className="py-2 px-3">Sifat Transaksi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-neutral-100">
                                                        {viewDetailForm.section_data.section_2_b.related_parties.map((party, idx) => (
                                                            <tr key={idx} className="hover:bg-neutral-50/20">
                                                                <td className="py-2 px-3 text-center text-neutral-500 font-bold">{party.no || idx + 1}</td>
                                                                <td className="py-2 px-3 text-neutral-800 font-bold">{party.nama || '-'}</td>
                                                                <td className="py-2 px-3 text-neutral-600">{party.hubungan || '-'}</td>
                                                                <td className="py-2 px-3 text-neutral-600">{party.sifat_transaksi || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    {/* Section 2.g: Penggunaan Spesialis */}
                                    <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
                                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Penggunaan Spesialis</h4>
                                        <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-150 text-xs">
                                            <p className="text-neutral-700 leading-relaxed font-semibold">{viewDetailForm.section_data?.section_2_g || 'Tidak ada'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab 4: Akuntansi & Bantuan Klien */}
                            {activeDetailTab === 3 && (
                                <div className="space-y-6 animate-fade-in-up">
                                    {/* Section 2.f: Akuntansi & Pelaporan Keuangan */}
                                    <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Akuntansi & Pelaporan Keuangan</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                            <div>
                                                <span className="text-[10px] text-neutral-400 font-bold block">BUKU PEDOMAN AKUNTANSI / SOP</span>
                                                <p className="text-neutral-800 font-bold mt-1 leading-relaxed">{viewDetailForm.section_data?.section_2_f?.buku_pedoman || '-'}</p>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-neutral-400 font-bold block">METODE PENGOLAHAN DATA</span>
                                                <p className="text-neutral-800 font-bold mt-1 leading-relaxed">{viewDetailForm.section_data?.section_2_f?.cara_mengolah_data || '-'}</p>
                                            </div>
                                        </div>
                                        <div className="border-t border-neutral-100 pt-3 mt-1 text-xs">
                                            <span className="text-[10px] text-neutral-400 font-bold block">SIKLUS TRANSAKSI SIGNIFIKAN (CYCLES)</span>
                                            <p className="text-neutral-800 font-semibold mt-1 leading-relaxed">{viewDetailForm.section_data?.section_2_f?.cycles || '-'}</p>
                                        </div>
                                        
                                        {viewDetailForm.section_data?.section_2_f?.auditable && viewDetailForm.section_data?.section_2_f?.auditable?.length > 0 && (
                                            <div className="border-t border-neutral-100 pt-3 mt-1 text-xs space-y-2">
                                                <span className="text-[10px] text-neutral-400 font-bold block uppercase mb-2">Kelayakan Audit (Auditable Checklist)</span>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {viewDetailForm.section_data.section_2_f.auditable.map((item, idx) => (
                                                        <div key={idx} className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 flex justify-between items-center gap-2">
                                                            <span className="text-neutral-700 font-semibold text-xs leading-relaxed">{item.no} {item.description}</span>
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase shrink-0 ${
                                                                item.value === 'Ya' 
                                                                    ? 'bg-green-50 border-green-200 text-green-700' 
                                                                    : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                                                            }`}>
                                                                {item.value}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Section 5: Bantuan Klien Info */}
                                    <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Pemberian Informasi & Referensi</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                            <div>
                                                <span className="text-[10px] text-neutral-400 font-bold block uppercase">Staf Introduksi</span>
                                                <span className="text-neutral-800 font-bold block mt-0.5">{viewDetailForm.section_data?.section_5?.staf_introduksi || '-'}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-neutral-400 font-bold block uppercase">Referensi Pihak Lain</span>
                                                <ul className="list-disc list-inside text-neutral-700 mt-1 font-semibold space-y-1">
                                                    {(viewDetailForm.section_data?.section_5?.referensi || []).map((ref, i) => ref && (
                                                        <li key={i}>{ref}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                        {viewDetailForm.section_data?.section_5?.prosedur_lain?.length > 0 && (
                                            <div className="border-t border-neutral-100 pt-3 mt-1 text-xs">
                                                <span className="text-[10px] text-neutral-400 font-bold block uppercase mb-1">Prosedur Evaluasi Tambahan</span>
                                                <ul className="list-decimal list-inside text-neutral-700 mt-1 font-semibold space-y-1">
                                                    {viewDetailForm.section_data.section_5.prosedur_lain.map((proc, i) => proc && (
                                                        <li key={i}>{proc}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Section 5 Checklist Dokumen */}
                                    {viewDetailForm.section_data?.section_5?.bantuan_klien && (
                                        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
                                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Daftar Dokumen Bantuan Klien</h4>
                                            <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto p-1 bg-neutral-50 rounded-xl border border-neutral-150">
                                                {viewDetailForm.section_data.section_5.bantuan_klien.map((doc, idx) => (
                                                    <div key={idx} className="bg-white p-3 rounded-lg border border-neutral-100/80 flex justify-between items-center gap-4 text-xs hover:border-blue-100 transition">
                                                        <div className="flex-1">
                                                            <span className="text-[9px] text-neutral-400 font-bold block">DOKUMEN {doc.no}</span>
                                                            <span className="text-neutral-700 font-semibold mt-0.5 block">{doc.description}</span>
                                                            {doc.notes && (
                                                                <span className="text-[9px] text-neutral-400 italic block mt-0.5">Catatan: {doc.notes}</span>
                                                            )}
                                                        </div>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase shrink-0 ${
                                                            doc.value === 'Ya' 
                                                                ? 'bg-green-50 border-green-200 text-green-700' 
                                                                : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                                                        }`}>
                                                            {doc.value === 'Ya' ? 'Ada' : 'Tidak'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab 5: Evaluasi Kualitatif */}
                            {activeDetailTab === 4 && (
                                <div className="space-y-6 animate-fade-in-up">
                                    {/* Section B: Ringkasan Evaluasi Penerimaan */}
                                    <div className="bg-gradient-to-br from-blue-50/50 to-neutral-50 p-5 rounded-2xl border border-blue-100 shadow-sm space-y-4">
                                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-700">Ringkasan Keputusan Penerimaan/Keberlanjutan Klien</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                                            <div className="bg-white p-3 rounded-xl border border-neutral-200/60 shadow-xs">
                                                <span className="text-[9px] text-neutral-400 block font-bold uppercase">Evaluasi Integritas</span>
                                                <span className="text-neutral-800 font-bold block mt-1">{viewDetailForm.section_data?.section_b?.integritas || '-'}</span>
                                            </div>
                                            <div className="bg-white p-3 rounded-xl border border-neutral-200/60 shadow-xs">
                                                <span className="text-[9px] text-neutral-400 block font-bold uppercase">Evaluasi Independensi</span>
                                                <span className="text-neutral-800 font-bold block mt-1">{viewDetailForm.section_data?.section_b?.independensi || '-'}</span>
                                            </div>
                                            <div className="bg-white p-3 rounded-xl border border-neutral-200/60 shadow-xs">
                                                <span className="text-[9px] text-neutral-400 block font-bold uppercase">Dapat Diaudit (Auditable)</span>
                                                <span className="text-neutral-800 font-bold block mt-1">{viewDetailForm.section_data?.section_b?.auditable || '-'}</span>
                                            </div>
                                            <div className="bg-white p-3 rounded-xl border border-neutral-200/60 shadow-xs">
                                                <span className="text-[9px] text-neutral-400 block font-bold uppercase">Risiko Penugasan</span>
                                                <span className="text-neutral-800 font-bold block mt-1">{viewDetailForm.section_data?.section_b?.risiko || '-'}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 border-t border-blue-100 pt-3">
                                            <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-center">
                                                <span className="text-[9px] text-red-500 font-bold block uppercase tracking-wider">Level Risiko Penugasan</span>
                                                <span className="text-red-700 font-extrabold text-sm block mt-0.5">{viewDetailForm.section_data?.section_b?.level_risiko || '-'}</span>
                                            </div>
                                            <div className="bg-green-50 border border-green-200 p-3 rounded-xl text-center">
                                                <span className="text-[9px] text-green-500 font-bold block uppercase tracking-wider">Keputusan Akhir</span>
                                                <span className="text-green-700 font-extrabold text-sm block mt-0.5">{viewDetailForm.section_data?.section_b?.kesimpulan || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 6: Entitas Bisnis Kecil */}
                                    {viewDetailForm.section_data?.section_6 && (
                                        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                                            <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Kriteria Entitas Bisnis Kecil</h4>
                                                <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-bold">14 Parameter</span>
                                            </div>
                                            <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                                                <span className="text-[9px] text-neutral-400 font-bold block uppercase tracking-wider">Kesimpulan Kriteria Bisnis Kecil</span>
                                                <p className="text-neutral-800 font-bold italic text-xs mt-1 leading-relaxed">"{viewDetailForm.section_data.section_6.conclusion || '-'}"</p>
                                            </div>
                                            <div className="divide-y divide-neutral-100 text-xs max-h-60 overflow-y-auto pr-1">
                                                {viewDetailForm.section_data.section_6.questions?.map((q) => (
                                                    <div key={q.no} className="py-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                                        <div className="flex-1 min-w-0 pr-2">
                                                            <p className="text-neutral-700 font-semibold leading-relaxed">{q.no}. {q.description}</p>
                                                            {q.notes && (
                                                                <p className="text-neutral-500 italic text-[10px] mt-1 bg-neutral-50 p-1.5 rounded border border-neutral-100">Catatan: {q.notes}</p>
                                                            )}
                                                        </div>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 uppercase tracking-wider ${
                                                            q.value === 'Y' 
                                                                ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' 
                                                                : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                                                        }`}>
                                                            {q.value === 'Y' ? 'Ya' : q.value === 'T' ? 'Tidak' : q.value}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Integrity Assessment card */}
                                    <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                                        <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">III. Evaluasi Integritas Manajemen</h4>
                                            <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold">Integritas</span>
                                        </div>
                                        <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                                            <span className="text-[9px] text-neutral-400 font-bold block uppercase tracking-wider">Kesimpulan Penilaian Integritas</span>
                                            <p className="text-neutral-800 font-bold italic text-xs mt-1 leading-relaxed">"{viewDetailForm.section_data?.section_3?.conclusion || '-'}"</p>
                                        </div>
                                        <div className="divide-y divide-neutral-100 text-xs">
                                            {viewDetailForm.section_data?.section_3?.questions?.map((q) => (
                                                <div key={q.no} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <p className="text-neutral-700 font-semibold leading-relaxed">{q.no}. {q.description}</p>
                                                        {q.notes && (
                                                            <p className="text-neutral-500 italic text-[10px] mt-1 bg-neutral-50 p-1.5 rounded border border-neutral-100">Catatan: {q.notes}</p>
                                                        )}
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 uppercase tracking-wider ${
                                                        q.value === 'Ya' 
                                                            ? 'bg-green-50 border-green-200 text-green-700 font-bold' 
                                                            : q.value === 'Tidak'
                                                                ? 'bg-neutral-50 border-neutral-200 text-neutral-600'
                                                                : 'bg-orange-50 border-orange-200 text-orange-600'
                                                    }`}>
                                                        {q.value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Independence Assessment card */}
                                    <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                                        <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">IV. Evaluasi Independensi KAP</h4>
                                            <span className="text-[10px] text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full font-bold">Independensi</span>
                                        </div>
                                        <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                                            <span className="text-[9px] text-neutral-400 font-bold block uppercase tracking-wider">Kesimpulan Penilaian Independensi</span>
                                            <p className="text-neutral-800 font-bold italic text-xs mt-1 leading-relaxed">"{viewDetailForm.section_data?.section_4?.conclusion || '-'}"</p>
                                        </div>
                                        <div className="divide-y divide-neutral-100 text-xs">
                                            {viewDetailForm.section_data?.section_4?.questions?.map((q) => (
                                                <div key={q.no} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <p className="text-neutral-700 font-semibold leading-relaxed">{q.no}. {q.description}</p>
                                                        {q.notes && (
                                                            <p className="text-neutral-500 italic text-[10px] mt-1 bg-neutral-50 p-1.5 rounded border border-neutral-100">Catatan: {q.notes}</p>
                                                        )}
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 uppercase tracking-wider ${
                                                        q.value === 'Ya' 
                                                            ? 'bg-red-50 border-red-200 text-red-700 font-bold' 
                                                            : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                                                    }`}>
                                                        {q.value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 mt-4 shrink-0">
                            <button
                                onClick={() => setViewDetailForm(null)}
                                className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition duration-200"
                            >
                                Tutup Pratinjau
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
