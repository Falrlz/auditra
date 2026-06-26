import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import AuditFormWizard from '@/Components/AuditFormWizard';
import AuditFormD10Wizard from '@/Components/AuditFormD10Wizard';
import axios from 'axios';

export default function Dashboard({ auth, clients, allUsers, allPegawai = [] }) {
    const user = auth?.user;
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const activeTab = urlParams.get('tab') === 'users' ? 'users' : 'perikatan';
    const [viewDetailForm, setViewDetailForm] = useState(null);
    const [activeDetailTab, setActiveDetailTab] = useState(0);

    // Persist active client ID in localStorage
    const [selectedClientId, setSelectedClientId] = useState(() => {
        return localStorage.getItem('auditra_selected_client_id') || '';
    });

    const activeClient = clients.find(c => String(c.id) === String(selectedClientId)) || null;

    const formatCurrency = (val) => {
        if (!val && val !== 0) return '-';
        return 'Rp ' + Number(val).toLocaleString('id-ID');
    };

    const handleSelectClient = (client) => {
        setSelectedClientId(client.id);
        localStorage.setItem('auditra_selected_client_id', client.id);
    };

    const handleBackToClients = () => {
        setSelectedClientId('');
        localStorage.removeItem('auditra_selected_client_id');
    };

    // Client CRUD Modals State
    const [showAddClientModal, setShowAddClientModal] = useState(false);
    const [showEditClientModal, setShowEditClientModal] = useState(false);
    const [editClientData, setEditClientData] = useState(null);
    const [newClientName, setNewClientName] = useState('');
    const [newBookYear, setNewBookYear] = useState('');
    const [newSchedule, setNewSchedule] = useState('');

    // Team Assignment Modal State
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [teamClient, setTeamClient] = useState(null);
    const [teamRows, setTeamRows] = useState([]);

    // User Sub-tab state
    const [userSubTab, setUserSubTab] = useState('users'); // 'users' or 'pegawai'

    // User Register Modal State
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [selectedPegawaiId, setSelectedPegawaiId] = useState('new'); // 'new' or specific pegawai ID
    const [usrName, setUsrName] = useState('');
    const [usrEmail, setUsrEmail] = useState('');
    const [usrPassword, setUsrPassword] = useState('');
    const [usrRole, setUsrRole] = useState('staff');
    const [usrInisial, setUsrInisial] = useState('');

    // User Edit Modal State
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [editUserData, setEditUserData] = useState(null);
    const [editUsrEmail, setEditUsrEmail] = useState('');
    const [editUsrPassword, setEditUsrPassword] = useState('');
    const [editUsrIsActive, setEditUsrIsActive] = useState(true);

    // Pegawai CRUD Modals State
    const [showAddPegawaiModal, setShowAddPegawaiModal] = useState(false);
    const [pegName, setPegName] = useState('');
    const [pegInisial, setPegInisial] = useState('');
    const [pegJabatan, setPegJabatan] = useState('staff');
    const [pegTelp, setPegTelp] = useState('');
    const [pegAlamat, setPegAlamat] = useState('');
    const [pegCv, setPegCv] = useState('');
    const [pegStatus, setPegStatus] = useState('aktif');

    const [showEditPegawaiModal, setShowEditPegawaiModal] = useState(false);
    const [editPegawaiData, setEditPegawaiData] = useState(null);
    const [editPegName, setEditPegName] = useState('');
    const [editPegInisial, setEditPegInisial] = useState('');
    const [editPegJabatan, setEditPegJabatan] = useState('staff');
    const [editPegTelp, setEditPegTelp] = useState('');
    const [editPegAlamat, setEditPegAlamat] = useState('');
    const [editPegCv, setEditPegCv] = useState('');
    const [editPegStatus, setEditPegStatus] = useState('aktif');

    // Review Modal State
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewForm, setReviewForm] = useState(null);
    const [reviewAction, setReviewAction] = useState('approve');
    const [rejectReason, setRejectReason] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    const handleOpenDetail = (form) => {
        setViewDetailForm(form);
        setActiveDetailTab(0);
    };

    const handleCreateA10 = () => {
        router.visit(route('a10.create', { client_id: activeClient.id }));
    };

    const handleCreateD10 = () => {
        router.visit(route('d10.create', { client_id: activeClient.id }));
    };

    const handleCreateC10 = () => {
        router.visit(route('c10.create', { client_id: activeClient.id }));
    };

    const handleEditForm = (form) => {
        if (form.form_type === 'D10') {
            router.visit(route('d10.edit', form.id));
        } else if (form.form_type === 'C10') {
            router.visit(route('c10.edit', form.id));
        } else {
            router.visit(route('a10.edit', form.id));
        }
    };

    const handleSubmitToReview = (formId, formType) => {
        if (confirm('Kirim formulir ini ke Ketua Tim untuk direview?')) {
            router.post(route('audit-forms.submit', formId), { form_type: formType }, {
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
            reject_reason: rejectReason,
            form_type: reviewForm.form_type
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

    // Client CRUD Actions
    const handleAddClientSubmit = (e) => {
        e.preventDefault();
        router.post(route('clients.store'), {
            name: newClientName,
            book_year: newBookYear,
            schedule: newSchedule || 'Pre-Engagement & Evaluasi',
        }, {
            onSuccess: () => {
                setShowAddClientModal(false);
                setNewClientName('');
                setNewBookYear('');
                setNewSchedule('');
            }
        });
    };

    const handleOpenEditClient = (client) => {
        setEditClientData(client);
        setNewClientName(client.name);
        setNewBookYear(client.book_year);
        setNewSchedule(client.schedule);
        setShowEditClientModal(true);
    };

    const handleEditClientSubmit = (e) => {
        e.preventDefault();
        router.post(route('clients.update', editClientData.id), {
            name: newClientName,
            book_year: newBookYear,
            schedule: newSchedule,
        }, {
            onSuccess: () => {
                setShowEditClientModal(false);
                setEditClientData(null);
                setNewClientName('');
                setNewBookYear('');
                setNewSchedule('');
            }
        });
    };

    const handleDeleteClient = (client) => {
        if (confirm(`Apakah Anda yakin ingin menghapus perikatan klien ${client.name}?`)) {
            router.delete(route('clients.destroy', client.id), {
                onSuccess: () => router.reload()
            });
        }
    };

    // Team Assignment Actions
    const handleOpenTeamModal = (client) => {
        setTeamClient(client);

        if (client.team && client.team.length > 0) {
            setTeamRows(client.team.map(t => ({
                user_id: String(t.id),
                role: t.role
            })));
        } else {
            setTeamRows([{ user_id: '', role: 'anggota' }]);
        }

        setShowTeamModal(true);
    };

    const handleAddRow = () => {
        setTeamRows([...teamRows, { user_id: '', role: 'anggota' }]);
    };

    const handleRemoveRow = (index) => {
        if (teamRows.length === 1) {
            setTeamRows([{ user_id: '', role: 'anggota' }]);
        } else {
            setTeamRows(teamRows.filter((_, idx) => idx !== index));
        }
    };

    const handleUpdateRow = (index, field, value) => {
        const updated = [...teamRows];
        updated[index][field] = value;
        setTeamRows(updated);
    };

    const handleTeamSubmit = (e) => {
        e.preventDefault();
        const validRows = teamRows.filter(row => row.user_id !== '');

        router.post(route('clients.team.update', teamClient.id), {
            team: validRows
        }, {
            onSuccess: () => {
                setShowTeamModal(false);
                setTeamClient(null);
            }
        });
    };

    // Register User Action
    const handleAddUserSubmit = (e) => {
        e.preventDefault();
        const payload = {
            email: usrEmail,
            password: usrPassword,
        };
        if (selectedPegawaiId === 'new') {
            payload.name = usrName;
            payload.role = usrRole;
            payload.inisial = usrInisial;
        } else {
            payload.pegawai_id = selectedPegawaiId;
        }

        router.post(route('users.store'), payload, {
            onSuccess: () => {
                setShowAddUserModal(false);
                setUsrName('');
                setUsrEmail('');
                setUsrPassword('');
                setUsrRole('staff');
                setUsrInisial('');
                setSelectedPegawaiId('new');
            }
        });
    };

    // Edit User Action
    const handleOpenEditUser = (userToEdit) => {
        setEditUserData(userToEdit);
        setEditUsrEmail(userToEdit.email);
        setEditUsrPassword('');
        setEditUsrIsActive(userToEdit.is_active !== false);
        setShowEditUserModal(true);
    };

    const handleEditUserSubmit = (e) => {
        e.preventDefault();
        router.post(route('users.update', editUserData.id), {
            email: editUsrEmail,
            password: editUsrPassword,
            is_active: editUsrIsActive ? 1 : 0
        }, {
            onSuccess: () => {
                setShowEditUserModal(false);
                setEditUserData(null);
                setEditUsrEmail('');
                setEditUsrPassword('');
                setEditUsrIsActive(true);
            }
        });
    };

    // Delete User Action
    const handleDeleteUser = (userToDelete) => {
        if (confirm(`Apakah Anda yakin ingin menghapus user ${userToDelete.name}?`)) {
            router.delete(route('users.destroy', userToDelete.id), {
                onSuccess: () => router.reload()
            });
        }
    };

    // Toggle User Status Action
    const handleToggleUserStatus = (userToToggle) => {
        router.post(route('users.toggle-status', userToToggle.id), {}, {
            onSuccess: () => router.reload()
        });
    };

    // Pegawai CRUD Actions
    const handleAddPegawaiSubmit = (e) => {
        e.preventDefault();
        router.post(route('pegawai.store'), {
            name: pegName,
            inisial: pegInisial,
            jabatan: pegJabatan,
            telp: pegTelp,
            alamat: pegAlamat,
            cv: pegCv,
            status: pegStatus,
        }, {
            onSuccess: () => {
                setShowAddPegawaiModal(false);
                setPegName('');
                setPegInisial('');
                setPegJabatan('staff');
                setPegTelp('');
                setPegAlamat('');
                setPegCv('');
                setPegStatus('aktif');
            }
        });
    };

    const handleOpenEditPegawai = (pegToEdit) => {
        setEditPegawaiData(pegToEdit);
        setEditPegName(pegToEdit.name);
        setEditPegInisial(pegToEdit.inisial || '');
        setEditPegJabatan(pegToEdit.jabatan);
        setEditPegTelp(pegToEdit.telp || '');
        setEditPegAlamat(pegToEdit.alamat || '');
        setEditPegCv(pegToEdit.cv || '');
        setEditPegStatus(pegToEdit.status);
        setShowEditPegawaiModal(true);
    };

    const handleEditPegawaiSubmit = (e) => {
        e.preventDefault();
        router.post(route('pegawai.update', editPegawaiData.id), {
            name: editPegName,
            inisial: editPegInisial,
            jabatan: editPegJabatan,
            telp: editPegTelp,
            alamat: editPegAlamat,
            cv: editPegCv,
            status: editPegStatus,
        }, {
            onSuccess: () => {
                setShowEditPegawaiModal(false);
                setEditPegawaiData(null);
                setEditPegName('');
                setEditPegInisial('');
                setEditPegJabatan('staff');
                setEditPegTelp('');
                setEditPegAlamat('');
                setEditPegCv('');
                setEditPegStatus('aktif');
            }
        });
    };

    const handleDeletePegawai = (pegToDelete) => {
        if (confirm(`Apakah Anda yakin ingin menghapus data pegawai ${pegToDelete.name}?`)) {
            router.delete(route('pegawai.destroy', pegToDelete.id), {
                onSuccess: () => router.reload()
            });
        }
    };

    const handleApprovePegawai = (pegToApprove) => {
        if (confirm(`Apakah Anda yakin ingin menyetujui pegawai ${pegToApprove.name}?`)) {
            router.post(route('pegawai.approve', pegToApprove.id), {}, {
                onSuccess: () => router.reload()
            });
        }
    };

    const handleRejectPegawai = (pegToReject) => {
        if (confirm(`Apakah Anda yakin ingin menolak pegawai ${pegToReject.name}?`)) {
            router.post(route('pegawai.reject', pegToReject.id), {}, {
                onSuccess: () => router.reload()
            });
        }
    };


    // Helper for rendering badges
    const renderStatusBadge = (status) => {
        const styles = {
            draft: 'bg-neutral-100 text-neutral-600 border-neutral-200/80',
            pending_ketua_tim: 'bg-orange-50 text-orange-600 border-orange-200',
            pending_supervisor: 'bg-amber-50 text-amber-600 border-amber-200',
            pending_partner: 'bg-blue-50 text-blue-600 border-blue-200',
            final_approved: 'bg-green-50 text-green-700 border-green-200',
            rejected: 'bg-red-50 text-red-600 border-red-200',
            rejected_ketua_tim: 'bg-red-50 text-red-600 border-red-200',
            rejected_supervisor: 'bg-red-50 text-red-600 border-red-200',
            rejected_partner: 'bg-red-50 text-red-600 border-red-200',
        };

        const labels = {
            draft: 'Draft',
            pending_ketua_tim: 'Menunggu Ketua Tim',
            pending_supervisor: 'Menunggu Supervisor',
            pending_partner: 'Menunggu Partner',
            final_approved: 'Disetujui Final',
            rejected: 'Ditolak',
            rejected_ketua_tim: 'Ditolak Ketua Tim',
            rejected_supervisor: 'Ditolak Supervisor',
            rejected_partner: 'Ditolak Partner',
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || 'bg-neutral-150 text-neutral-500'}`}>
                {labels[status] || status}
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
                            {activeClient ? (
                                <>
                                    <h2 className="text-xl font-extrabold text-[#1d1d1f] tracking-tight">
                                        Perikatan: {activeClient.name}
                                    </h2>
                                    <p className="text-xs text-neutral-400 font-medium">
                                        Tahun Buku: {activeClient.book_year} | Jadwal: {activeClient.schedule}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-xl font-extrabold text-[#1d1d1f] tracking-tight">
                                        {activeTab === 'users' ? 'Kelola User Sistem' : 'Daftar Perikatan Audit'}
                                    </h2>
                                    <p className="text-xs text-neutral-400 font-medium">
                                        {activeTab === 'users' ? 'Kelola akun & hak akses untuk Linda, Sandra, Joko, Andi, Saipul.' : 'Pilih perikatan klien untuk mengelola laporan'}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard Auditra" />

            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {activeClient ? (
                        /* ================== WORKSPACE: ACTIVE CLIENT DETAIL ================== */
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                                <button
                                    onClick={handleBackToClients}
                                    className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-200 hover:border-neutral-300 text-neutral-600 hover:text-neutral-900 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition text-xs font-bold"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                    </svg>
                                    Kembali ke Daftar Perikatan
                                </button>
                                <div className="text-xs text-neutral-500 font-medium">
                                    Role Anda di Tim: <span className="text-[#0071e3] font-bold bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 uppercase tracking-wider">{activeClient.team_role || 'Tidak Terlibat'}</span>
                                </div>
                            </div>

                            {/* Client Team Information */}
                            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                                <h3 className="text-sm font-extrabold text-[#1d1d1f] uppercase tracking-wider">Susunan Tim Perikatan Klien</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {activeClient.team && activeClient.team.length > 0 ? (
                                        activeClient.team.map((member, idx) => {
                                            const roleLabels = {
                                                anggota: 'Anggota (Staff)',
                                                ketua_tim: 'Ketua Tim (Staff)',
                                                supervisor: 'Supervisor (Manager)',
                                                partner: 'Partner (Partner)'
                                            };
                                            return (
                                                <div key={idx} className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 flex flex-col justify-between">
                                                    <span className="text-[10px] text-neutral-400 font-bold block uppercase">{roleLabels[member.role] || member.role}</span>
                                                    <div className="mt-2">
                                                        <span className="text-sm font-extrabold text-neutral-800 block">{member.name}</span>
                                                        <span className="inline-block mt-1 bg-white border px-2 py-0.5 rounded text-[10px] font-bold text-neutral-500">Inisial: {member.inisial}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="col-span-full py-4 text-center text-xs text-neutral-450 italic">Belum ada tim yang ditunjuk.</div>
                                    )}
                                </div>
                            </div>

                            {/* Reports List Table */}
                            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
                                    <h3 className="text-sm font-extrabold text-[#1d1d1f] uppercase tracking-wider">Daftar Formulir / Laporan Kerja</h3>
                                    <span className="text-[10px] text-neutral-500 bg-white border px-2 py-0.5 rounded font-bold uppercase">Dokumen Audit</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-neutral-200 text-neutral-500 bg-neutral-50/30 text-xs font-bold uppercase tracking-wider text-[10px]">
                                                <th className="py-4 px-6 w-24">INDEX</th>
                                                <th className="py-4 px-6">KETERANGAN</th>
                                                <th className="py-4 px-6 w-48">STATUS</th>
                                                <th className="py-4 px-6 w-60">PEMBUAT / PENINJAU</th>
                                                <th className="py-4 px-6 text-right w-80">AKSI</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100 text-sm text-neutral-700">
                                            {/* Baris 1: A10 */}
                                            {(() => {
                                                const formA10 = activeClient.forms.find(f => f.form_type === 'A10');
                                                const canEdit = activeClient.team_role === 'anggota' && (!formA10 || ['draft', 'rejected', 'rejected_ketua_tim', 'rejected_supervisor', 'rejected_partner'].includes(formA10.status));
                                                const isPendingReview = formA10 && (
                                                    (formA10.status === 'pending_ketua_tim' && activeClient.team_role === 'ketua_tim') ||
                                                    (formA10.status === 'pending_supervisor' && activeClient.team_role === 'supervisor') ||
                                                    (formA10.status === 'pending_partner' && activeClient.team_role === 'partner')
                                                );

                                                return (
                                                    <tr className="hover:bg-neutral-50/30 transition">
                                                        <td className="py-5 px-6 font-extrabold text-[#0071e3]">A10</td>
                                                        <td className="py-5 px-6">
                                                            <div className="font-bold text-neutral-900">Survei Penerimaan Klien (SA 210)</div>
                                                        </td>
                                                        <td className="py-5 px-6">
                                                            {formA10 ? renderStatusBadge(formA10.status) : (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-neutral-100 text-neutral-400 border-neutral-200/60">
                                                                    Belum Dibuat
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-5 px-6 text-xs text-neutral-500 space-y-1">
                                                            {formA10 ? (
                                                                <>
                                                                    <div>Disiapkan oleh: <strong className="text-neutral-700 font-bold">{formA10.preparer?.name || '-'} ({formA10.preparer?.inisial || '-'})</strong></div>
                                                                    {formA10.reject_reason && <div className="text-red-500 font-medium mt-0.5">Alasan Penolakan: <strong>"{formA10.reject_reason}"</strong></div>}
                                                                </>
                                                            ) : (
                                                                <span className="text-neutral-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="py-5 px-6 text-right">
                                                            <div className="flex justify-end gap-1.5 flex-wrap">
                                                                {formA10 && (
                                                                    <button
                                                                        onClick={() => handleOpenDetail(formA10)}
                                                                        className="px-3 py-1.5 border border-neutral-200 hover:border-neutral-300 text-neutral-600 hover:text-neutral-800 rounded-lg hover:bg-neutral-50 text-xs font-bold transition duration-200"
                                                                    >
                                                                        Pratinjau
                                                                    </button>
                                                                )}

                                                                {canEdit && (
                                                                    <>
                                                                        <button
                                                                            onClick={formA10 ? () => handleEditForm(formA10) : handleCreateA10}
                                                                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0071e3] border border-blue-100 rounded-lg text-xs font-bold transition duration-200"
                                                                        >
                                                                            {formA10 ? 'Edit' : 'Isi Form'}
                                                                        </button>
                                                                        {formA10 && (
                                                                            <button
                                                                                onClick={() => handleSubmitToReview(formA10.id, 'A10')}
                                                                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition duration-200"
                                                                            >
                                                                                Kirim Review
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}

                                                                {isPendingReview && (
                                                                    <button
                                                                        onClick={() => handleOpenReview(formA10)}
                                                                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition duration-200"
                                                                    >
                                                                        Review
                                                                    </button>
                                                                )}

                                                                {!formA10 && !canEdit && (
                                                                    <span className="text-xs text-neutral-400 font-medium">Menunggu Staff Anggota</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })()}

                                            {/* Baris 2: C10 */}
                                            {(() => {
                                                const formC10 = activeClient.forms.find(f => f.form_type === 'C10');
                                                const canEdit = activeClient.team_role === 'anggota' && (!formC10 || ['draft', 'rejected', 'rejected_ketua_tim', 'rejected_supervisor', 'rejected_partner'].includes(formC10.status));
                                                const isPendingReview = formC10 && (
                                                    (formC10.status === 'pending_ketua_tim' && activeClient.team_role === 'ketua_tim') ||
                                                    (formC10.status === 'pending_supervisor' && activeClient.team_role === 'supervisor') ||
                                                    (formC10.status === 'pending_partner' && activeClient.team_role === 'partner')
                                                );

                                                return (
                                                    <tr className="hover:bg-neutral-50/30 transition">
                                                        <td className="py-5 px-6 font-extrabold text-emerald-600">C10</td>
                                                        <td className="py-5 px-6">
                                                            <div className="font-bold text-neutral-900">Worksheets</div>
                                                        </td>
                                                        <td className="py-5 px-6">
                                                            {formC10 ? renderStatusBadge(formC10.status) : (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-neutral-100 text-neutral-400 border-neutral-200/60">
                                                                    Belum Dibuat
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-5 px-6 text-xs text-neutral-500 space-y-1">
                                                            {formC10 ? (
                                                                <>
                                                                    <div>Disiapkan oleh: <strong className="text-neutral-700 font-bold">{formC10.preparer?.name || '-'} ({formC10.preparer?.inisial || '-'})</strong></div>
                                                                    {formC10.reject_reason && <div className="text-red-500 font-medium mt-0.5">Alasan Penolakan: <strong>"{formC10.reject_reason}"</strong></div>}
                                                                </>
                                                            ) : (
                                                                <span className="text-neutral-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="py-5 px-6 text-right">
                                                            <div className="flex justify-end gap-1.5 flex-wrap">
                                                                {formC10 && (
                                                                    <button
                                                                        onClick={() => handleOpenDetail(formC10)}
                                                                        className="px-3 py-1.5 border border-neutral-200 hover:border-neutral-300 text-neutral-600 hover:text-neutral-800 rounded-lg hover:bg-neutral-50 text-xs font-bold transition duration-200"
                                                                    >
                                                                        Pratinjau
                                                                    </button>
                                                                )}

                                                                {canEdit && (
                                                                    <>
                                                                        <button
                                                                            onClick={formC10 ? () => handleEditForm(formC10) : handleCreateC10}
                                                                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0071e3] border border-blue-100 rounded-lg text-xs font-bold transition duration-200"
                                                                        >
                                                                            {formC10 ? 'Edit' : 'Isi Form'}
                                                                        </button>
                                                                        {formC10 && (
                                                                            <button
                                                                                onClick={() => handleSubmitToReview(formC10.id, 'C10')}
                                                                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition duration-200"
                                                                            >
                                                                                Kirim Review
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}

                                                                {isPendingReview && (
                                                                    <button
                                                                        onClick={() => handleOpenReview(formC10)}
                                                                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition duration-200"
                                                                    >
                                                                        Review
                                                                    </button>
                                                                )}

                                                                {!formC10 && !canEdit && (
                                                                    <span className="text-xs text-neutral-400 font-medium">Menunggu Staff Anggota</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })()}

                                            {/* Baris 3: D10 */}
                                            {(() => {
                                                const formD10 = activeClient.forms.find(f => f.form_type === 'D10');
                                                const canEdit = activeClient.team_role === 'anggota' && (!formD10 || ['draft', 'rejected', 'rejected_ketua_tim', 'rejected_supervisor', 'rejected_partner'].includes(formD10.status));
                                                const isPendingReview = formD10 && (
                                                    (formD10.status === 'pending_ketua_tim' && activeClient.team_role === 'ketua_tim') ||
                                                    (formD10.status === 'pending_supervisor' && activeClient.team_role === 'supervisor') ||
                                                    (formD10.status === 'pending_partner' && activeClient.team_role === 'partner')
                                                );

                                                return (
                                                    <tr className="hover:bg-neutral-50/30 transition">
                                                        <td className="py-5 px-6 font-extrabold text-indigo-600">D10</td>
                                                        <td className="py-5 px-6">
                                                            <div className="font-bold text-neutral-900">Materialitas & Batas Salah Saji</div>
                                                        </td>
                                                        <td className="py-5 px-6">
                                                            {formD10 ? renderStatusBadge(formD10.status) : (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-neutral-100 text-neutral-400 border-neutral-200/60">
                                                                    Belum Dibuat
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-5 px-6 text-xs text-neutral-500 space-y-1">
                                                            {formD10 ? (
                                                                <>
                                                                    <div>Disiapkan oleh: <strong className="text-neutral-700 font-bold">{formD10.preparer?.name || '-'} ({formD10.preparer?.inisial || '-'})</strong></div>
                                                                    {formD10.reject_reason && <div className="text-red-500 font-medium mt-0.5">Alasan Penolakan: <strong>"{formD10.reject_reason}"</strong></div>}
                                                                </>
                                                            ) : (
                                                                <span className="text-neutral-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="py-5 px-6 text-right">
                                                            <div className="flex justify-end gap-1.5 flex-wrap">
                                                                {formD10 && (
                                                                    <button
                                                                        onClick={() => handleOpenDetail(formD10)}
                                                                        className="px-3 py-1.5 border border-neutral-200 hover:border-neutral-300 text-neutral-600 hover:text-neutral-800 rounded-lg hover:bg-neutral-50 text-xs font-bold transition duration-200"
                                                                    >
                                                                        Pratinjau
                                                                    </button>
                                                                )}

                                                                {canEdit && (
                                                                    <>
                                                                        <button
                                                                            onClick={formD10 ? () => handleEditForm(formD10) : handleCreateD10}
                                                                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0071e3] border border-blue-100 rounded-lg text-xs font-bold transition duration-200"
                                                                        >
                                                                            {formD10 ? 'Edit' : 'Isi Form'}
                                                                        </button>
                                                                        {formD10 && (
                                                                            <button
                                                                                onClick={() => handleSubmitToReview(formD10.id, 'D10')}
                                                                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition duration-200"
                                                                            >
                                                                                Kirim Review
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}

                                                                {isPendingReview && (
                                                                    <button
                                                                        onClick={() => handleOpenReview(formD10)}
                                                                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition duration-200"
                                                                    >
                                                                        Review
                                                                    </button>
                                                                )}

                                                                {!formD10 && !canEdit && (
                                                                    <span className="text-xs text-neutral-400 font-medium">Menunggu Staff Anggota</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'users' ? (
                        /* ================== TAB 2 (ADMIN): USER & PEGAWAI MANAGEMENT ================== */
                        <div className="space-y-6">
                            {/* Segmented Control */}
                            <div className="flex bg-neutral-100 p-1 rounded-xl max-w-md gap-1 bg-white border border-neutral-200">
                                <button
                                    type="button"
                                    onClick={() => setUserSubTab('users')}
                                    className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg transition-all duration-200 ${
                                        userSubTab === 'users'
                                            ? 'bg-neutral-900 text-white shadow-sm'
                                            : 'text-neutral-500 hover:text-neutral-800'
                                    }`}
                                >
                                    Kelola Akun User
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUserSubTab('pegawai')}
                                    className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg transition-all duration-200 ${
                                        userSubTab === 'pegawai'
                                            ? 'bg-neutral-900 text-white shadow-sm'
                                            : 'text-neutral-500 hover:text-neutral-800'
                                    }`}
                                >
                                    Kelola Data Pegawai
                                </button>
                            </div>

                            {userSubTab === 'users' ? (
                                <div className="glass-panel rounded-2xl overflow-hidden bg-white">
                                    <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-bold text-[#1d1d1f]">Daftar Pengguna Sistem</h3>
                                            <p className="text-neutral-500 text-xs mt-1">Daftar akun login pengguna dan hak akses role masing-masing.</p>
                                        </div>
                                        {user?.role === 'admin' && (
                                            <button
                                                onClick={() => setShowAddUserModal(true)}
                                                className="btn-glow-indigo text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2"
                                            >
                                                Daftarkan User Baru
                                            </button>
                                        )}
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-neutral-200 text-xs text-neutral-500 bg-neutral-50/80 font-bold uppercase tracking-wider text-[10px]">
                                                    <th className="py-4 px-6">NAMA</th>
                                                    <th className="py-4 px-6">INISIAL</th>
                                                    <th className="py-4 px-6">EMAIL</th>
                                                    <th className="py-4 px-6">ROLE SISTEM</th>
                                                    <th className="py-4 px-6">STATUS LOGIN</th>
                                                    <th className="py-4 px-6 text-right">AKSI</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100 text-sm text-neutral-750">
                                                {allUsers.map((u) => (
                                                    <tr key={u.id} className="hover:bg-neutral-50/30">
                                                        <td className="py-4 px-6 font-bold text-neutral-900">{u.name || '-'}</td>
                                                        <td className="py-4 px-6"><span className="bg-neutral-100 px-2 py-0.5 rounded font-extrabold text-xs text-neutral-600">{u.inisial || '-'}</span></td>
                                                        <td className="py-4 px-6 text-neutral-600 font-semibold">{u.email}</td>
                                                        <td className="py-4 px-6">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-blue-50 text-[#0071e3] border-blue-100 uppercase tracking-wider text-[9px]">
                                                                {u.role}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${u.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                                                {u.is_active ? 'Aktif' : 'Nonaktif'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            {user?.role === 'admin' ? (
                                                                <div className="flex justify-end gap-1.5">
                                                                    {u.id !== user?.id && (
                                                                        <button
                                                                            onClick={() => handleToggleUserStatus(u)}
                                                                            className={`px-2.5 py-1.5 rounded-lg transition text-xs font-bold ${u.is_active ? 'bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200' : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'}`}
                                                                        >
                                                                            {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => handleOpenEditUser(u)}
                                                                        className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition text-xs font-bold border border-neutral-200/50"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    {u.id !== user?.id ? (
                                                                        <button
                                                                            onClick={() => handleDeleteUser(u)}
                                                                            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition text-xs font-bold border border-red-200/40"
                                                                        >
                                                                            Hapus
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-xs text-neutral-400 font-medium italic self-center px-1">Akun Anda</span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-neutral-400 font-medium italic">Hanya Admin</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="glass-panel rounded-2xl overflow-hidden bg-white animate-fade-in-up">
                                    <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-bold text-[#1d1d1f]">Database Pegawai</h3>
                                            <p className="text-neutral-500 text-xs mt-1">Kelola data seluruh pegawai kantor akuntan publik.</p>
                                        </div>
                                        {user?.role === 'admin' && (
                                            <button
                                                onClick={() => setShowAddPegawaiModal(true)}
                                                className="btn-glow-indigo text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2"
                                            >
                                                Tambah Pegawai Baru
                                            </button>
                                        )}
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-neutral-200 text-xs text-neutral-500 bg-neutral-50/80 font-bold uppercase tracking-wider text-[10px]">
                                                    <th className="py-4 px-6">NAMA</th>
                                                    <th className="py-4 px-6">INISIAL</th>
                                                    <th className="py-4 px-6">JABATAN</th>
                                                    <th className="py-4 px-6">TELP / ALAMAT</th>
                                                    <th className="py-4 px-6">STATUS KERJA</th>
                                                    <th className="py-4 px-6">AKUN USER</th>
                                                    <th className="py-4 px-6 text-right">AKSI</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100 text-sm text-neutral-750">
                                                {allPegawai.map((p) => (
                                                    <tr key={p.id} className="hover:bg-neutral-50/30">
                                                        <td className="py-4 px-6 font-bold text-neutral-900">{p.name}</td>
                                                        <td className="py-4 px-6"><span className="bg-neutral-100 px-2 py-0.5 rounded font-extrabold text-xs text-neutral-600">{p.inisial}</span></td>
                                                        <td className="py-4 px-6 capitalize">{p.jabatan}</td>
                                                        <td className="py-4 px-6 text-xs text-neutral-650 space-y-0.5">
                                                            <div>Telp: {p.telp || '-'}</div>
                                                            <div className="max-w-[200px] truncate" title={p.alamat}>Alamat: {p.alamat || '-'}</div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                                                p.status === 'aktif' ? 'bg-green-50 text-green-700 border-green-200' : 
                                                                p.status === 'cuti' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                                                p.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                                'bg-neutral-100 text-neutral-600 border-neutral-200'
                                                            }`}>
                                                                {p.status === 'pending' ? 'Menunggu Persetujuan' : p.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            {p.has_user ? (
                                                                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                                    Terhubung ({p.user_email})
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500 font-semibold bg-neutral-50 px-2.5 py-1 rounded-full border border-neutral-200/50">
                                                                    Belum Terhubung
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            {p.status === 'pending' ? (
                                                                user?.role === 'partner' ? (
                                                                    <div className="flex justify-end gap-1.5">
                                                                        <button
                                                                            onClick={() => handleApprovePegawai(p)}
                                                                            className="px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition text-xs font-bold border border-green-200"
                                                                        >
                                                                            Setujui
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleRejectPegawai(p)}
                                                                            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition text-xs font-bold border border-red-200/40"
                                                                        >
                                                                            Tolak
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 font-semibold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 whitespace-nowrap">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                                        Menunggu Persetujuan Partner
                                                                    </span>
                                                                )
                                                            ) : (
                                                                user?.role === 'admin' ? (
                                                                    <div className="flex justify-end gap-1.5">
                                                                        <button
                                                                            onClick={() => handleOpenEditPegawai(p)}
                                                                            className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition text-xs font-bold border border-neutral-200/50"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeletePegawai(p)}
                                                                            disabled={p.user_id === user?.id}
                                                                            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition text-xs font-bold border border-red-200/40 disabled:opacity-40 disabled:hover:bg-red-50 disabled:hover:text-red-600"
                                                                        >
                                                                            Hapus
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-neutral-400 font-medium italic">Hanya Admin</span>
                                                                )
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ================== TAB 1: LIST CLIENTS/PERIKATAN ================== */
                        <div className="glass-panel rounded-2xl overflow-hidden bg-white animate-fade-in-up">
                            <div className="p-6 border-b border-neutral-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-[#1d1d1f]">Daftar Klien / Perikatan Audit</h3>
                                    <p className="text-neutral-500 text-xs mt-1">
                                        {user?.role === 'admin' ? 'Daftar perikatan untuk kelola data CRUD perikatan klien.' : 'Daftar perikatan aktif tempat Anda ditugaskan.'}
                                    </p>
                                </div>
                                {user?.role === 'admin' && (
                                    <button
                                        onClick={() => setShowAddClientModal(true)}
                                        className="btn-glow-indigo text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                        Tambah Perikatan Baru
                                    </button>
                                )}
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-200 text-xs text-neutral-500 bg-neutral-50/80">
                                            <th className="py-4 px-6">NAMA KLIEN</th>
                                            <th className="py-4 px-6">TAHUN BUKU</th>
                                            <th className="py-4 px-6">JADWAL/SKEDUL PENILAIAN</th>
                                            <th className="py-4 px-6">STATUS LAPORAN</th>
                                            <th className="py-4 px-6 text-right">AKSI</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 text-sm text-neutral-700">
                                        {clients.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="py-12 text-center text-neutral-400 font-semibold">
                                                    Belum ada data perikatan aktif untuk Anda.
                                                </td>
                                            </tr>
                                        ) : (
                                            clients.map((client) => {
                                                const formA10 = client.forms.find(f => f.form_type === 'A10');
                                                const formD10 = client.forms.find(f => f.form_type === 'D10');
                                                const formC10 = client.forms.find(f => f.form_type === 'C10');
                                                return (
                                                    <tr key={client.id} className="hover:bg-neutral-50/50 transition">
                                                        <td className="py-4 px-6 font-bold text-neutral-900">
                                                            <button onClick={() => handleSelectClient(client)} className="hover:text-[#0071e3] text-left">
                                                                {client.name}
                                                            </button>
                                                        </td>
                                                        <td className="py-4 px-6 text-xs text-neutral-600 font-semibold">{client.book_year}</td>
                                                        <td className="py-4 px-6 text-xs text-neutral-500 truncate max-w-[200px]">{client.schedule}</td>
                                                        <td className="py-4 px-6 text-xs font-semibold">
                                                            <div className="flex gap-2">
                                                                <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${formA10 ? 'bg-blue-50 border-blue-200 text-[#0071e3]' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>A10</span>
                                                                <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${formC10 ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>C10</span>
                                                                <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${formD10 ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>D10</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <div className="flex justify-end gap-1.5">
                                                                {user?.role === 'admin' && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleOpenEditClient(client)}
                                                                            className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition text-xs font-bold"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteClient(client)}
                                                                            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition text-xs font-bold border border-red-200/40"
                                                                        >
                                                                            Hapus
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {user?.role === 'partner' && (
                                                                    <button
                                                                        onClick={() => handleOpenTeamModal(client)}
                                                                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition text-xs font-bold border border-indigo-100"
                                                                    >
                                                                        Kelola Tim
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleSelectClient(client)}
                                                                    className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-900 rounded-lg transition text-xs font-bold"
                                                                >
                                                                    Buka Perikatan
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Ketua Tim / Supervisor / Partner Review Modal */}
            {showReviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
                    <div className="glass-panel w-full max-w-md p-6 rounded-2xl animate-fade-in-up border border-neutral-200 bg-white">
                        <h3 className="text-lg font-bold text-[#1d1d1f] mb-2">Review Laporan: {reviewForm.form_type}</h3>
                        <p className="text-neutral-500 text-xs mb-4">Berikan keputusan persetujuan atau pengembalian dengan catatan untuk Laporan ini.</p>

                        <form onSubmit={handleSubmitReview} className="space-y-4">
                            <div>
                                <label className="block text-xs text-neutral-500 font-semibold mb-2">KEPUTUSAN</label>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setReviewAction('approve')}
                                        className={`flex-1 py-3 px-4 border rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${reviewAction === 'approve' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}
                                    >
                                        Setujui (Approve)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReviewAction('reject')}
                                        className={`flex-1 py-3 px-4 border rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${reviewAction === 'reject' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}
                                    >
                                        Kembalikan (Reject)
                                    </button>
                                </div>
                            </div>

                            {reviewAction === 'reject' && (
                                <div className="animate-fade-in-up">
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">CATATAN REJECT / CATATAN PERBAIKAN</label>
                                    <textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Berikan instruksi detail perbaikan kepada Anggota tim..."
                                        className="w-full custom-input p-3 text-sm h-24"
                                        required
                                    />
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowReviewModal(false);
                                        setReviewForm(null);
                                    }}
                                    className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 text-xs transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    className={`px-4 py-2 text-white rounded-lg text-xs font-semibold shadow transition ${reviewAction === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                                >
                                    {submittingReview ? 'Memproses...' : 'Kirim Keputusan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewDetailForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="w-full max-w-7xl max-h-[95vh] overflow-y-auto bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xl relative">
                        <button
                            onClick={() => setViewDetailForm(null)}
                            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-700 shadow-md border border-neutral-200 transition active:scale-95"
                            title="Tutup Pratinjau"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="mt-4">
                            {viewDetailForm.form_type === 'D10' ? (
                                <AuditFormD10Wizard
                                    formToEdit={viewDetailForm}
                                    clientId={viewDetailForm.client_id}
                                    clientName={viewDetailForm.client_name || activeClient?.name}
                                    bookYear={viewDetailForm.book_year || activeClient?.book_year}
                                    schedule={viewDetailForm.schedule || activeClient?.schedule}
                                    readOnly={true}
                                    onClose={() => setViewDetailForm(null)}
                                    onSaveSuccess={() => {}}
                                />
                            ) : viewDetailForm.form_type === 'A10' ? (
                                <AuditFormWizard
                                    formToEdit={viewDetailForm}
                                    clientId={viewDetailForm.client_id}
                                    clientName={viewDetailForm.client_name || activeClient?.name}
                                    bookYear={viewDetailForm.book_year || activeClient?.book_year}
                                    schedule={viewDetailForm.schedule || activeClient?.schedule}
                                    materiality={{
                                        overall_materiality: activeClient?.forms?.find(f => f.form_type === 'D10')?.section_data?.overall_materiality ?? null,
                                        performance_materiality: activeClient?.forms?.find(f => f.form_type === 'D10')?.section_data?.performance_materiality ?? null,
                                        tolerable_error: activeClient?.forms?.find(f => f.form_type === 'D10')?.section_data?.tolerable_error ?? null,
                                    }}
                                    readOnly={true}
                                    onClose={() => setViewDetailForm(null)}
                                    onSaveSuccess={() => {}}
                                />
                            ) : (
                                /* C10 Tabbed Layout Preview */
                                <div className="flex flex-col h-[75vh]">
                                    {/* Custom Segmented Control (Tabs Navigation) */}
                                    <div className="flex bg-neutral-100 p-1 rounded-xl mb-6 overflow-x-auto whitespace-nowrap scrollbar-none gap-1 shrink-0">
                                        {['Ringkasan Penugasan', 'Kertas Kerja (Worksheets)'].map((tab, idx) => (
                                            <button
                                                key={tab}
                                                type="button"
                                                onClick={() => setActiveDetailTab(idx)}
                                                className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg transition-all duration-200 ${activeDetailTab === idx
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
                                                    <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                                                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Informasi Klien</h4>
                                                        <div className="space-y-3">
                                                            <div>
                                                                <span className="text-[10px] text-neutral-400 font-bold block">NAMA KLIEN</span>
                                                                <span className="text-neutral-900 font-extrabold text-base">{activeClient?.name}</span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <span className="text-[10px] text-neutral-400 font-bold block">TAHUN BUKU</span>
                                                                    <span className="text-neutral-800 font-bold text-sm">{activeClient?.book_year}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-[10px] text-neutral-400 font-bold block">SKEDUL / JASA</span>
                                                                    <span className="text-neutral-800 font-bold text-sm">{activeClient?.schedule || '-'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                                                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Tim Audit & Kesimpulan Laporan</h4>
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
                                                            <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 text-center">
                                                                <span className="text-[9px] text-emerald-600 block font-bold uppercase tracking-wider">STATUS KERTAS KERJA</span>
                                                                <span className="text-emerald-700 font-extrabold text-sm mt-0.5 block">Dalam Persiapan</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Tab 2: Worksheets Placeholder */}
                                        {activeDetailTab === 1 && (
                                            <div className="space-y-6 animate-fade-in-up">
                                                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm text-center py-12">
                                                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                                        </svg>
                                                    </div>
                                                    <h4 className="text-base font-bold text-neutral-800">Kertas Kerja C10 Worksheets</h4>
                                                    <p className="text-xs text-neutral-500 mt-2 max-w-md mx-auto">
                                                        Dokumen ini sedang dalam tahap persiapan kerja. Anda dapat menyunting dan mereview laporan ini sesuai alur persetujuan.
                                                    </p>
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
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Add Client Modal */}
            {showAddClientModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
                    <div className="glass-panel w-full max-w-md p-6 rounded-2xl animate-fade-in-up border border-neutral-200 bg-white">
                        <h3 className="text-lg font-bold text-[#1d1d1f] mb-2">Tambah Perikatan Klien Baru</h3>
                        <form onSubmit={handleAddClientSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs text-neutral-500 font-semibold mb-1">NAMA KLIEN</label>
                                <input
                                    type="text"
                                    value={newClientName}
                                    onChange={(e) => setNewClientName(e.target.value)}
                                    placeholder="Contoh: PT EASTPARC HOTEL TBK"
                                    className="w-full custom-input p-3 text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-neutral-500 font-semibold mb-1">TAHUN BUKU</label>
                                <input
                                    type="text"
                                    value={newBookYear}
                                    onChange={(e) => setNewBookYear(e.target.value)}
                                    placeholder="Contoh: 31 Desember 2024"
                                    className="w-full custom-input p-3 text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-neutral-500 font-semibold mb-1">JADWAL / SKEDUL PENILAIAN</label>
                                <input
                                    type="text"
                                    value={newSchedule}
                                    onChange={(e) => setNewSchedule(e.target.value)}
                                    placeholder="Contoh: Pre-Engagement"
                                    className="w-full custom-input p-3 text-sm"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAddClientModal(false)}
                                    className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 text-xs transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="btn-glow-indigo text-xs font-semibold px-4 py-2 rounded-lg"
                                >
                                    Simpan Klien
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Admin Edit Client Modal */}
            {showEditClientModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
                    <div className="glass-panel w-full max-w-md p-6 rounded-2xl animate-fade-in-up border border-neutral-200 bg-white">
                        <h3 className="text-lg font-bold text-[#1d1d1f] mb-2">Edit Perikatan Klien</h3>
                        <form onSubmit={handleEditClientSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs text-neutral-500 font-semibold mb-1">NAMA KLIEN</label>
                                <input
                                    type="text"
                                    value={newClientName}
                                    onChange={(e) => setNewClientName(e.target.value)}
                                    className="w-full custom-input p-3 text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-neutral-500 font-semibold mb-1">TAHUN BUKU</label>
                                <input
                                    type="text"
                                    value={newBookYear}
                                    onChange={(e) => setNewBookYear(e.target.value)}
                                    className="w-full custom-input p-3 text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-neutral-500 font-semibold mb-1">JADWAL / SKEDUL PENILAIAN</label>
                                <input
                                    type="text"
                                    value={newSchedule}
                                    onChange={(e) => setNewSchedule(e.target.value)}
                                    className="w-full custom-input p-3 text-sm"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditClientModal(false);
                                        setEditClientData(null);
                                    }}
                                    className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 text-xs transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="btn-glow-indigo text-xs font-semibold px-4 py-2 rounded-lg"
                                >
                                    Perbarui
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Partner Manage Team Modal */}
            {showTeamModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
                    <div className="glass-panel w-full max-w-2xl p-6 rounded-2xl animate-fade-in-up border border-neutral-200 bg-white">
                        <h3 className="text-lg font-bold text-[#1d1d1f] mb-2">Susun Tim Perikatan: {teamClient.name}</h3>
                        <p className="text-neutral-500 text-xs mb-4">Tunjuk anggota tim untuk masing-masing peran di perikatan ini. Anda dapat menambah atau mengurangi baris secara dinamis.</p>

                        <form onSubmit={handleTeamSubmit} className="space-y-4">
                            <div className="max-h-[350px] overflow-y-auto pr-1 space-y-3">
                                <div className="flex gap-2 text-[10px] text-neutral-400 font-bold uppercase px-1">
                                    <div className="flex-1">Nama Anggota</div>
                                    <div className="w-48">Role Tim Perikatan</div>
                                    <div className="w-8 shrink-0"></div>
                                </div>
                                {teamRows.map((row, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <div className="flex-1">
                                            <select
                                                value={row.user_id}
                                                onChange={(e) => handleUpdateRow(index, 'user_id', e.target.value)}
                                                className="w-full custom-input p-2.5 text-xs"
                                                required
                                            >
                                                <option value="">Pilih Anggota...</option>
                                                {allUsers.map(u => (
                                                    <option key={u.id} value={u.id}>{u.name} ({u.role.toUpperCase()} - {u.inisial})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-48">
                                            <select
                                                value={row.role}
                                                onChange={(e) => handleUpdateRow(index, 'role', e.target.value)}
                                                className="w-full custom-input p-2.5 text-xs"
                                                required
                                            >
                                                <option value="anggota">Anggota (Staff)</option>
                                                <option value="ketua_tim">Ketua Tim (Staff)</option>
                                                <option value="supervisor">Supervisor (Manager)</option>
                                                <option value="partner">Partner (Partner)</option>
                                            </select>
                                        </div>
                                        <div className="shrink-0 w-8 flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveRow(index)}
                                                className="p-2 text-red-500 hover:text-red-700 transition"
                                                title="Hapus Baris"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={handleAddRow}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-dashed border-neutral-300 hover:border-neutral-400 text-[#0071e3] hover:bg-neutral-50 rounded-xl text-xs font-bold transition w-full justify-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    Tambah Baris Anggota
                                </button>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowTeamModal(false);
                                        setTeamClient(null);
                                    }}
                                    className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 text-xs transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="btn-glow-indigo text-xs font-semibold px-4 py-2 rounded-lg"
                                >
                                    Simpan Susunan Tim
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Admin Add User Modal */}
            {showAddUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
                    <div className="glass-panel w-full max-w-md rounded-2xl animate-fade-in-up border border-neutral-200 bg-white max-h-[90vh] flex flex-col overflow-hidden">
                        <form onSubmit={handleAddUserSubmit} className="flex flex-col max-h-[90vh] min-h-0">
                            {/* Header */}
                            <div className="p-6 pb-4 border-b border-neutral-100 shrink-0">
                                <h3 className="text-lg font-bold text-[#1d1d1f] mb-1">Daftarkan Pengguna Baru</h3>
                                <p className="text-neutral-500 text-xs">Buat akun untuk staf atau manajemen baru agar mereka dapat mengakses perikatan.</p>
                            </div>

                            {/* Scrollable Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">HUBUNGKAN KE PEGAWAI</label>
                                    <select
                                        value={selectedPegawaiId}
                                        onChange={(e) => setSelectedPegawaiId(e.target.value)}
                                        className="w-full custom-input p-2.5 text-xs"
                                    >
                                        <option value="new">-- Buat Pegawai Baru --</option>
                                        {allPegawai.filter(p => !p.has_user).map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.inisial} - {p.jabatan.toUpperCase()})</option>
                                        ))}
                                    </select>
                                </div>

                                {selectedPegawaiId === 'new' && (
                                    <>
                                        <div>
                                            <label className="block text-xs text-neutral-500 font-semibold mb-1">NAMA LENGKAP PEGAWAI</label>
                                            <input
                                                type="text"
                                                value={usrName}
                                                onChange={(e) => setUsrName(e.target.value)}
                                                placeholder="Contoh: Andi Wijaya"
                                                className="w-full custom-input p-3 text-xs"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-neutral-500 font-semibold mb-1">INISIAL PENGGUNA</label>
                                            <input
                                                type="text"
                                                value={usrInisial}
                                                onChange={(e) => setUsrInisial(e.target.value.toUpperCase())}
                                                placeholder="Contoh: AND"
                                                maxLength={3}
                                                className="w-full custom-input p-3 text-xs uppercase"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-neutral-500 font-semibold mb-1">ROLE SISTEM (JABATAN)</label>
                                            <select
                                                value={usrRole}
                                                onChange={(e) => setUsrRole(e.target.value)}
                                                className="w-full custom-input p-2.5 text-xs"
                                            >
                                                <option value="staff">Staff</option>
                                                <option value="manager">Manager</option>
                                                <option value="partner">Partner</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">ALAMAT EMAIL AKUN</label>
                                    <input
                                        type="email"
                                        value={usrEmail}
                                        onChange={(e) => setUsrEmail(e.target.value)}
                                        placeholder="Contoh: andi@example.com"
                                        className="w-full custom-input p-3 text-xs"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">KATA SANDI</label>
                                    <input
                                        type="password"
                                        value={usrPassword}
                                        onChange={(e) => setUsrPassword(e.target.value)}
                                        placeholder="Minimal 8 karakter..."
                                        className="w-full custom-input p-3 text-xs"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 pt-4 border-t border-neutral-100 bg-neutral-50/50 flex justify-end gap-3 shrink-0 rounded-b-2xl">
                                <button
                                    type="button"
                                    onClick={() => setShowAddUserModal(false)}
                                    className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 text-xs font-bold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="btn-glow-indigo text-xs font-semibold px-4 py-2 rounded-lg"
                                >
                                    Daftarkan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Admin Edit User Modal */}
            {showEditUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
                    <div className="glass-panel w-full max-w-md rounded-2xl animate-fade-in-up border border-neutral-200 bg-white max-h-[90vh] flex flex-col overflow-hidden">
                        <form onSubmit={handleEditUserSubmit} className="flex flex-col max-h-[90vh] min-h-0">
                            {/* Header */}
                            <div className="p-6 pb-4 border-b border-neutral-100 shrink-0">
                                <h3 className="text-lg font-bold text-[#1d1d1f] mb-1">Edit Pengguna</h3>
                                <p className="text-neutral-500 text-xs">Ubah detail akun atau hak akses login.</p>
                            </div>

                            {/* Scrollable Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">ALAMAT EMAIL</label>
                                    <input
                                        type="email"
                                        value={editUsrEmail}
                                        onChange={(e) => setEditUsrEmail(e.target.value)}
                                        placeholder="Contoh: andi@example.com"
                                        className="w-full custom-input p-3 text-xs"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">KATA SANDI BARU</label>
                                    <input
                                        type="password"
                                        value={editUsrPassword}
                                        onChange={(e) => setEditUsrPassword(e.target.value)}
                                        placeholder="Kosongkan jika tidak ingin diubah..."
                                        className="w-full custom-input p-3 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">STATUS LOGIN</label>
                                    <select
                                        value={editUsrIsActive ? '1' : '0'}
                                        onChange={(e) => setEditUsrIsActive(e.target.value === '1')}
                                        className="w-full custom-input p-2.5 text-xs"
                                    >
                                        <option value="1">Aktif (Bisa Login)</option>
                                        <option value="0">Nonaktif (Blokir Login)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 pt-4 border-t border-neutral-100 bg-neutral-50/50 flex justify-end gap-3 shrink-0 rounded-b-2xl">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditUserModal(false);
                                        setEditUserData(null);
                                    }}
                                    className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 text-xs font-bold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="btn-glow-indigo text-xs font-semibold px-4 py-2 rounded-lg"
                                >
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Admin Add Pegawai Modal */}
            {showAddPegawaiModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
                    <div className="glass-panel w-full max-w-md rounded-2xl animate-fade-in-up border border-neutral-200 bg-white max-h-[90vh] flex flex-col overflow-hidden">
                        <form onSubmit={handleAddPegawaiSubmit} className="flex flex-col max-h-[90vh] min-h-0">
                            {/* Header */}
                            <div className="p-6 pb-4 border-b border-neutral-100 shrink-0">
                                <h3 className="text-lg font-bold text-[#1d1d1f] mb-1">Tambah Pegawai Baru</h3>
                                <p className="text-neutral-500 text-xs">Tambahkan data profil pegawai baru ke database sistem.</p>
                            </div>

                            {/* Scrollable Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">NAMA LENGKAP</label>
                                    <input
                                        type="text"
                                        value={pegName}
                                        onChange={(e) => setPegName(e.target.value)}
                                        placeholder="Contoh: Budi Susanto"
                                        className="w-full custom-input p-3 text-xs"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">INISIAL</label>
                                    <input
                                        type="text"
                                        value={pegInisial}
                                        onChange={(e) => setPegInisial(e.target.value.toUpperCase())}
                                        placeholder="Contoh: BUD"
                                        maxLength={3}
                                        className="w-full custom-input p-3 text-xs uppercase"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">JABATAN</label>
                                    <select
                                        value={pegJabatan}
                                        onChange={(e) => setPegJabatan(e.target.value)}
                                        className="w-full custom-input p-2.5 text-xs"
                                    >
                                        <option value="staff">Staff</option>
                                        <option value="manager">Manager</option>
                                        <option value="partner">Partner</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">NO. TELEPON</label>
                                    <input
                                        type="text"
                                        value={pegTelp}
                                        onChange={(e) => setPegTelp(e.target.value)}
                                        placeholder="Contoh: 08123456789"
                                        className="w-full custom-input p-3 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">ALAMAT</label>
                                    <textarea
                                        value={pegAlamat}
                                        onChange={(e) => setPegAlamat(e.target.value)}
                                        placeholder="Alamat lengkap..."
                                        className="w-full custom-input p-3 text-xs h-20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">RINGKASAN CV</label>
                                    <textarea
                                        value={pegCv}
                                        onChange={(e) => setPegCv(e.target.value)}
                                        placeholder="Pengalaman kerja singkat..."
                                        className="w-full custom-input p-3 text-xs h-20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">STATUS PEGAWAI</label>
                                    <select
                                        value={pegStatus}
                                        onChange={(e) => setPegStatus(e.target.value)}
                                        className="w-full custom-input p-2.5 text-xs"
                                    >
                                        <option value="aktif">Aktif</option>
                                        <option value="cuti">Cuti</option>
                                        <option value="nonaktif">Nonaktif</option>
                                    </select>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 pt-4 border-t border-neutral-100 bg-neutral-50/50 flex justify-end gap-3 shrink-0 rounded-b-2xl">
                                <button
                                    type="button"
                                    onClick={() => setShowAddPegawaiModal(false)}
                                    className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 text-xs font-bold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="btn-glow-indigo text-xs font-semibold px-4 py-2 rounded-lg"
                                >
                                    Simpan Pegawai
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Admin Edit Pegawai Modal */}
            {showEditPegawaiModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
                    <div className="glass-panel w-full max-w-md rounded-2xl animate-fade-in-up border border-neutral-200 bg-white max-h-[90vh] flex flex-col overflow-hidden">
                         <form onSubmit={handleEditPegawaiSubmit} className="flex flex-col max-h-[90vh] min-h-0">
                            {/* Header */}
                            <div className="p-6 pb-4 border-b border-neutral-100 shrink-0">
                                <h3 className="text-lg font-bold text-[#1d1d1f] mb-1">Edit Pegawai</h3>
                                <p className="text-neutral-500 text-xs">Perbarui data profil pegawai.</p>
                            </div>

                            {/* Scrollable Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">NAMA LENGKAP</label>
                                    <input
                                        type="text"
                                        value={editPegName}
                                        onChange={(e) => setEditPegName(e.target.value)}
                                        className="w-full custom-input p-3 text-xs"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">INISIAL</label>
                                    <input
                                        type="text"
                                        value={editPegInisial}
                                        onChange={(e) => setEditPegInisial(e.target.value.toUpperCase())}
                                        maxLength={3}
                                        className="w-full custom-input p-3 text-xs uppercase"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">JABATAN</label>
                                    <select
                                        value={editPegJabatan}
                                        onChange={(e) => setEditPegJabatan(e.target.value)}
                                        className="w-full custom-input p-2.5 text-xs"
                                    >
                                        <option value="staff">Staff</option>
                                        <option value="manager">Manager</option>
                                        <option value="partner">Partner</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">NO. TELEPON</label>
                                    <input
                                        type="text"
                                        value={editPegTelp}
                                        onChange={(e) => setEditPegTelp(e.target.value)}
                                        className="w-full custom-input p-3 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">ALAMAT</label>
                                    <textarea
                                        value={editPegAlamat}
                                        onChange={(e) => setEditPegAlamat(e.target.value)}
                                        className="w-full custom-input p-3 text-xs h-20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">RINGKASAN CV</label>
                                    <textarea
                                        value={editPegCv}
                                        onChange={(e) => setEditPegCv(e.target.value)}
                                        className="w-full custom-input p-3 text-xs h-20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">STATUS PEGAWAI</label>
                                    <select
                                        value={editPegStatus}
                                        onChange={(e) => setEditPegStatus(e.target.value)}
                                        className="w-full custom-input p-2.5 text-xs"
                                    >
                                        <option value="aktif">Aktif</option>
                                        <option value="cuti">Cuti</option>
                                        <option value="nonaktif">Nonaktif</option>
                                    </select>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 pt-4 border-t border-neutral-100 bg-neutral-50/50 flex justify-end gap-3 shrink-0 rounded-b-2xl">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditPegawaiModal(false);
                                        setEditPegawaiData(null);
                                    }}
                                    className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 text-xs font-bold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="btn-glow-indigo text-xs font-semibold px-4 py-2 rounded-lg"
                                >
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
