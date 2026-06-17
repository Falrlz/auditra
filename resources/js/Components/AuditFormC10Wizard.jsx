import React, { useState, useEffect } from 'react';
import { useForm, usePage } from '@inertiajs/react';

// Custom Numeric Input Component to support accounting style negative numbers (parentheses)
function NumericInput({ value, onChange, className, placeholder }) {
    const [isFocused, setIsFocused] = useState(false);
    const [localValue, setLocalValue] = useState('');

    // Format value for display when blurred: 2500000 -> "25.000.000", -1500000 -> "(1.500.000)"
    const formatDisplay = (val) => {
        if (val === 0 || val === null || val === undefined) return '';
        const absVal = Math.abs(val).toLocaleString('id-ID');
        return val < 0 ? `(${absVal})` : absVal;
    };

    // Convert value to simple editable string when focused: -1500000 -> "-1500000"
    const formatEdit = (val) => {
        if (val === 0 || val === null || val === undefined) return '';
        return String(val);
    };

    // Parse input string into number, treating (5000) or -5000 as -5000
    const parseNumberInput = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const trimmed = val.trim();
        const isNegative = trimmed.startsWith('-') || trimmed.startsWith('(');
        const digits = trimmed.replace(/[^0-9]/g, '');
        const num = digits ? parseInt(digits, 10) : 0;
        return isNegative ? -num : num;
    };

    useEffect(() => {
        if (!isFocused) {
            setLocalValue(formatDisplay(value));
        }
    }, [value, isFocused]);

    const handleFocus = () => {
        setIsFocused(true);
        setLocalValue(formatEdit(value));
    };

    const handleBlur = () => {
        setIsFocused(false);
        const parsed = parseNumberInput(localValue);
        onChange(parsed);
    };

    const handleChange = (e) => {
        const typed = e.target.value;
        // Allow digits, minus, parentheses
        const cleaned = typed.replace(/[^0-9\-()]/g, '');
        setLocalValue(cleaned);

        // Calculate and update parent state on character change for dynamic subtotals
        const parsed = parseNumberInput(cleaned);
        onChange(parsed);
    };

    return (
        <input
            type="text"
            value={localValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            className={className}
            placeholder={placeholder || '0'}
        />
    );
}

function TableColGroup({ showN2 }) {
    return (
        <colgroup>
            <col className="w-36" /> {/* Kode Akun */}
            <col className="w-56" /> {/* Nama Akun */}
            <col className="w-32" /> {/* Saldo Normal */}
            <col className="w-44" /> {/* Saldo Unaudited */}
            <col className="w-12" /> {/* TcM */}
            <col className="w-40" /> {/* Penyesuaian Debit */}
            <col className="w-40" /> {/* Penyesuaian Kredit */}
            <col className="w-14" /> {/* Reff */}
            <col className="w-44" /> {/* Saldo Audited */}
            <col className="w-12" /> {/* TcM */}
            <col className="w-44" /> {/* Saldo Audited Prev */}
            {showN2 && (
                <>
                    <col className="w-44" /> {/* Saldo Audited Prev2 */}
                </>
            )}
            <col className="w-44" /> {/* Perubahan Nominal */}
            <col className="w-20" /> {/* Perubahan % */}
        </colgroup>
    );
}

function TableHeader({ showN2, displayBookYear, prevBookYear, prevBookYear2 }) {
    return (
        <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider text-[9px] text-center divide-x divide-neutral-200">
                <th rowSpan="2" className="py-2.5 px-3 text-left w-36">Kode Akun</th>
                <th rowSpan="2" className="py-2.5 px-3 text-left w-52">Nama Akun</th>
                <th rowSpan="2" className="py-2.5 px-2 w-32">Saldo Normal</th>
                <th rowSpan="2" className="py-2.5 px-3 w-40 text-right font-black">Saldo Unaudited<br />31 Des {displayBookYear}</th>
                <th rowSpan="2" className="py-2.5 px-2 w-10">TcM</th>
                <th colSpan="2" className="py-1 px-3 border-b border-neutral-200 font-black">Penyesuaian</th>
                <th rowSpan="2" className="py-2.5 px-2 w-14">Reff</th>
                <th rowSpan="2" className="py-2.5 px-3 w-40 text-right bg-neutral-50/40 font-black">Saldo Audited<br />31 Des {displayBookYear}</th>
                <th rowSpan="2" className="py-2.5 px-2 w-10 bg-neutral-50/40">TcM</th>

                <th rowSpan="2" className="py-2.5 px-3 w-40 text-right font-black">Saldo Audited<br />31 Des {prevBookYear}</th>

                {showN2 && (
                    <>
                        <th rowSpan="2" className="py-2.5 px-3 w-40 text-right font-black">Saldo Audited<br />31 Des {prevBookYear2}</th>
                    </>
                )}

                <th colSpan="2" className="py-1 px-3 border-b border-neutral-200 bg-neutral-50/40 font-black">Perubahan</th>
            </tr>
            <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider text-[9px] text-center divide-x divide-neutral-200">
                <th className="py-1.5 px-3 w-36">Debit</th>
                <th className="py-1.5 px-3 w-36">Kredit</th>
                <th className="py-1.5 px-3 w-36 bg-neutral-50/40 text-right">Nominal</th>
                <th className="py-1.5 px-2 w-16 bg-neutral-50/40">%</th>
            </tr>
        </thead>
    );
}

export default function AuditFormC10Wizard({ formToEdit, clientId, clientName, bookYear, schedule, onClose, onSaveSuccess }) {
    const props = usePage().props;
    console.log("AuditFormC10Wizard Props:", props);
    const auth = props?.auth || {};
    const user = auth?.user || {};

    const showN2 = false;

    // Initial default structure for C10
    const defaultSectionData = {
        notes: '',
        groups: []
    };

    const { data, setData, post, processing } = useForm({
        client_id: formToEdit ? formToEdit.client_id : (clientId || ''),
        form_type: 'C10',
        client_name: formToEdit ? formToEdit.client_name : (clientName || ''),
        book_year: formToEdit ? formToEdit.book_year : (bookYear || ''),
        schedule: formToEdit ? formToEdit.schedule : (schedule || 'Pre-Engagement & Evaluasi'),
        section_data: formToEdit ? formToEdit.section_data : defaultSectionData
    });

    // Accounting currency formatting helper: 2500000 -> "Rp 25.000.000", -1500000 -> "Rp (1.500.000)"
    const formatCurrency = (val) => {
        if (!val && val !== 0) return '-';
        if (val === 0) return '-';
        const absVal = Math.abs(val).toLocaleString('id-ID');
        return val < 0 ? `Rp (${absVal})` : `Rp ${absVal}`;
    };

    // Calculate audited, changes, and subtotals across groups
    const recalculateC10 = (groups) => {
        return groups.map(group => {
            const normalBalance = group.saldo_normal || 'debit';

            const updatedChildren = (group.children || []).map(child => {
                const unaudited = Number(child.saldo_unaudited || 0);
                const deb = Number(child.penyesuaian_debit || 0);
                const kre = Number(child.penyesuaian_kredit || 0);
                const prev = Number(child.saldo_audited_prev || 0);

                // Formula based on normal balance: Debit (U + D - K) / Credit (U - D + K)
                let audited = 0;
                if (normalBalance === 'debit') {
                    audited = unaudited + deb - kre;
                } else {
                    audited = unaudited - deb + kre;
                }

                // Changes between current year and previous year N-1
                const nominal = audited - prev;
                let percent = 0;
                if (prev === 0) {
                    if (nominal > 0) percent = 100;
                    else if (nominal < 0) percent = -100;
                    else percent = 0;
                } else {
                    percent = (nominal / prev) * 100;
                }

                return {
                    ...child,
                    saldo_audited: audited,
                    perubahan_nominal: nominal,
                    perubahan_persen: percent
                };
            });

            // Subtotals calculations
            const subUnaudited = updatedChildren.reduce((sum, c) => sum + Number(c.saldo_unaudited || 0), 0);
            const subDeb = updatedChildren.reduce((sum, c) => sum + Number(c.penyesuaian_debit || 0), 0);
            const subKre = updatedChildren.reduce((sum, c) => sum + Number(c.penyesuaian_kredit || 0), 0);
            const subAudited = updatedChildren.reduce((sum, c) => sum + Number(c.saldo_audited || 0), 0);
            const subPrev = updatedChildren.reduce((sum, c) => sum + Number(c.saldo_audited_prev || 0), 0);
            const subPrev2 = updatedChildren.reduce((sum, c) => sum + Number(c.saldo_audited_prev2 || 0), 0);
            const subNominal = subAudited - subPrev;

            let subPercent = 0;
            if (subPrev === 0) {
                if (subNominal > 0) subPercent = 100;
                else if (subNominal < 0) subPercent = -100;
                else subPercent = 0;
            } else {
                subPercent = (subNominal / subPrev) * 100;
            }

            return {
                ...group,
                children: updatedChildren,
                subtotals: {
                    saldo_unaudited: subUnaudited,
                    penyesuaian_debit: subDeb,
                    penyesuaian_kredit: subKre,
                    saldo_audited: subAudited,
                    saldo_audited_prev: subPrev,
                    saldo_audited_prev2: subPrev2,
                    perubahan_nominal: subNominal,
                    perubahan_persen: subPercent
                }
            };
        });
    };

    // Calculate grand totals of all groups
    const getGrandTotals = (groupsList) => {
        const list = groupsList || [];
        const grandUnaudited = list.reduce((sum, g) => sum + (g.subtotals?.saldo_unaudited || 0), 0);
        const grandDeb = list.reduce((sum, g) => sum + (g.subtotals?.penyesuaian_debit || 0), 0);
        const grandKre = list.reduce((sum, g) => sum + (g.subtotals?.penyesuaian_kredit || 0), 0);
        const grandAudited = list.reduce((sum, g) => sum + (g.subtotals?.saldo_audited || 0), 0);
        const grandPrev = list.reduce((sum, g) => sum + (g.subtotals?.saldo_audited_prev || 0), 0);
        const grandPrev2 = list.reduce((sum, g) => sum + (g.subtotals?.saldo_audited_prev2 || 0), 0);
        const grandNominal = grandAudited - grandPrev;

        let grandPercent = 0;
        if (grandPrev === 0) {
            if (grandNominal > 0) grandPercent = 100;
            else if (grandNominal < 0) grandPercent = -100;
            else grandPercent = 0;
        } else {
            grandPercent = (grandNominal / grandPrev) * 100;
        }

        return {
            saldo_unaudited: grandUnaudited,
            penyesuaian_debit: grandDeb,
            penyesuaian_kredit: grandKre,
            saldo_audited: grandAudited,
            saldo_audited_prev: grandPrev,
            saldo_audited_prev2: grandPrev2,
            perubahan_nominal: grandNominal,
            perubahan_persen: grandPercent
        };
    };

    // Recalculate on mount
    useEffect(() => {
        const sec = { ...data.section_data };
        if (sec.groups && sec.groups.length > 0) {
            sec.groups = recalculateC10(sec.groups);
            setData('section_data', sec);
        } else {
            const initialGroups = recalculateC10(defaultSectionData.groups);
            setData('section_data', {
                ...defaultSectionData,
                groups: initialGroups
            });
        }
    }, []);

    // Handlers for adding/removing items
    const handleAddGroup = () => {
        const sec = { ...data.section_data };
        const currentGroups = [...(sec.groups || [])];
        const newGroupId = `group-${Date.now()}`;
        currentGroups.push({
            id: newGroupId,
            kode_induk: '',
            nama_induk: '',
            saldo_normal: 'debit',
            children: []
        });
        sec.groups = recalculateC10(currentGroups);
        setData('section_data', sec);
    };

    const handleRemoveGroup = (groupId) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus kelompok akun ini beserta seluruh anak akun di dalamnya?\nTindakan ini tidak dapat dibatalkan.")) {
            const sec = { ...data.section_data };
            const currentGroups = (sec.groups || []).filter(g => g.id !== groupId);
            sec.groups = recalculateC10(currentGroups);
            setData('section_data', sec);
        }
    };

    const handleAddChild = (groupId) => {
        const sec = { ...data.section_data };
        const currentGroups = (sec.groups || []).map(g => {
            if (g.id === groupId) {
                const currentChildren = [...(g.children || [])];
                const childId = `child-${Date.now()}`;
                currentChildren.push({
                    id: childId,
                    suffix: '',
                    kode_lengkap: g.kode_induk ? `${g.kode_induk}-` : '',
                    nama: '',
                    saldo_unaudited: 0,
                    tcm_unaudited: '',
                    penyesuaian_debit: 0,
                    penyesuaian_kredit: 0,
                    reff: '',
                    saldo_audited: 0,
                    tcm_audited: '',
                    saldo_audited_prev: 0,
                    saldo_audited_prev2: 0
                });
                return { ...g, children: currentChildren };
            }
            return g;
        });
        sec.groups = recalculateC10(currentGroups);
        setData('section_data', sec);
    };

    const handleRemoveChild = (groupId, childId) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus akun anak ini?\nTindakan ini tidak dapat dibatalkan.")) {
            const sec = { ...data.section_data };
            const currentGroups = (sec.groups || []).map(g => {
                if (g.id === groupId) {
                    const currentChildren = (g.children || []).filter(c => c.id !== childId);
                    return { ...g, children: currentChildren };
                }
                return g;
            });
            sec.groups = recalculateC10(currentGroups);
            setData('section_data', sec);
        }
    };

    const handleGroupChange = (groupId, field, value) => {
        const sec = { ...data.section_data };
        const currentGroups = (sec.groups || []).map(g => {
            if (g.id === groupId) {
                let updatedGroup = { ...g, [field]: value };
                if (field === 'kode_induk') {
                    // Update all children full code prefix based on new parent code
                    updatedGroup.children = (updatedGroup.children || []).map(c => ({
                        ...c,
                        kode_lengkap: value ? `${value}-${c.suffix}` : c.suffix
                    }));
                }
                return updatedGroup;
            }
            return g;
        });
        sec.groups = recalculateC10(currentGroups);
        setData('section_data', sec);
    };

    const handleChildChange = (groupId, childId, field, value) => {
        const sec = { ...data.section_data };
        const currentGroups = (sec.groups || []).map(g => {
            if (g.id === groupId) {
                const currentChildren = (g.children || []).map(c => {
                    if (c.id === childId) {
                        let updatedChild = { ...c, [field]: value };
                        if (field === 'suffix') {
                            updatedChild.kode_lengkap = g.kode_induk ? `${g.kode_induk}-${value}` : value;
                        }
                        return updatedChild;
                    }
                    return c;
                });
                return { ...g, children: currentChildren };
            }
            return g;
        });
        sec.groups = recalculateC10(currentGroups);
        setData('section_data', sec);
    };

    const handleNotesChange = (e) => {
        const sec = { ...data.section_data };
        sec.notes = e.target.value;
        setData('section_data', sec);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (formToEdit) {
            post(route('audit-forms.update', formToEdit.id), {
                onSuccess: () => onSaveSuccess()
            });
        } else {
            post(route('audit-forms.store'), {
                onSuccess: () => onSaveSuccess()
            });
        }
    };

    const currentBookYear = data.book_year || '2024';
    const extractYear = (val) => {
        const match = String(val).match(/\d{4}/);
        return match ? match[0] : null;
    };
    const parsedYear = extractYear(currentBookYear);
    const displayBookYear = parsedYear ? parsedYear : currentBookYear;
    const prevBookYear = parsedYear ? String(Number(parsedYear) - 1) : 'Sebelumnya';
    const prevBookYear2 = parsedYear ? String(Number(parsedYear) - 2) : 'Sebelumnya Lagi';

    const groups = data.section_data?.groups || [];
    const grandTotals = getGrandTotals(groups);

    return (
        <div className="bg-[#f5f5f7] p-6 rounded-2xl max-w-7xl mx-auto my-6 space-y-6 shadow-sm border border-neutral-200">
            {/* KAP SANDRA PRACIPTA HEADER */}
            <div className="border border-neutral-300 p-6 bg-white shadow-2xs rounded-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2 w-full md:w-80">
                        <div className="flex items-center justify-between bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs">
                            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Kertas Kerja</span>
                            <span className="font-black text-emerald-600">C10 (Worksheets)</span>
                        </div>
                        <div className="flex items-center justify-between bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs">
                            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Klien</span>
                            <span className="font-bold text-neutral-800">{data.client_name}</span>
                        </div>
                        <div className="flex items-center justify-between bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs">
                            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Tahun Buku</span>
                            <span className="font-bold text-neutral-800">{currentBookYear}</span>
                        </div>
                    </div>
                    <div className="w-full md:w-auto overflow-x-auto">
                        <table className="border-collapse border border-neutral-300 text-xs text-left w-full md:w-80">
                            <thead>
                                <tr className="bg-neutral-50 text-neutral-500 font-bold border-b border-neutral-300">
                                    <th className="py-1.5 px-3 border-r border-neutral-300">Deskripsi</th>
                                    <th className="py-1.5 px-3 border-r border-neutral-300 w-24">Tanggal</th>
                                    <th className="py-1.5 px-3 w-16">Inisial</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 text-neutral-700">
                                <tr>
                                    <td className="py-1.5 px-3 border-r border-neutral-300 font-semibold">Disiapkan Oleh</td>
                                    <td className="py-1.5 px-3 border-r border-neutral-300">{formToEdit?.created_at ? new Date(formToEdit.created_at).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID')}</td>
                                    <td className="py-1.5 px-3 uppercase font-bold text-[#0071e3]">{formToEdit?.preparer?.inisial || user?.inisial || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="py-1.5 px-3 border-r border-neutral-300 font-semibold">Direview Oleh</td>
                                    <td className="py-1.5 px-3 border-r border-neutral-300">{formToEdit?.reviewed_at ? new Date(formToEdit.reviewed_at).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID')}</td>
                                    <td className="py-1.5 px-3 uppercase font-bold text-neutral-600">{formToEdit?.reviewer?.inisial || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="py-1.5 px-3 border-r border-neutral-300 font-semibold">Disetujui Oleh</td>
                                    <td className="py-1.5 px-3 border-r border-neutral-300">{formToEdit?.approved_at ? new Date(formToEdit.approved_at).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID')}</td>
                                    <td className="py-1.5 px-3 uppercase font-bold text-neutral-600">{formToEdit?.approver?.inisial || '-'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* WORKSSHEETS MAIN TABLE */}
                <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-5 overflow-x-auto">
                    <div className="pb-3 border-b border-neutral-100">
                        <h3 className="text-sm font-black text-neutral-800 uppercase tracking-wider">Lembar Kerja Akun C10</h3>
                        <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">Kelola kelompok akun induk dan sub-akun di bawahnya</p>
                    </div>
                    <table className={`text-left text-xs border-collapse table-fixed w-full ${showN2 ? 'min-w-[1880px]' : 'min-w-[1710px]'}`}>
                        <colgroup>
                            <col className="w-36" /> {/* Kode Akun */}
                            <col className="w-56" /> {/* Nama Akun */}
                            <col className="w-32" /> {/* Saldo Normal */}
                            <col className="w-44" /> {/* Saldo Unaudited */}
                            <col className="w-12" /> {/* TcM */}
                            <col className="w-40" /> {/* Penyesuaian Debit */}
                            <col className="w-40" /> {/* Penyesuaian Kredit */}
                            <col className="w-14" /> {/* Reff */}
                            <col className="w-44" /> {/* Saldo Audited */}
                            <col className="w-12" /> {/* TcM */}
                            <col className="w-44" /> {/* Saldo Audited Prev */}
                            {showN2 && (
                                <>
                                    <col className="w-44" /> {/* Saldo Audited Prev2 */}
                                </>
                            )}
                            <col className="w-44" /> {/* Perubahan Nominal */}
                            <col className="w-20" /> {/* Perubahan % */}
                        </colgroup>
                        <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider text-[9px] text-center divide-x divide-neutral-200">
                                <th rowSpan="2" className="py-2.5 px-3 text-left w-36">Kode Akun</th>
                                <th rowSpan="2" className="py-2.5 px-3 text-left w-52">Nama Akun</th>
                                <th rowSpan="2" className="py-2.5 px-2 w-32">Saldo Normal</th>
                                <th rowSpan="2" className="py-2.5 px-3 w-40 text-right">Saldo Unaudited<br />31 Des {displayBookYear}</th>
                                <th rowSpan="2" className="py-2.5 px-2 w-10">TcM</th>
                                <th colSpan="2" className="py-1 px-3 border-b border-neutral-200">Penyesuaian</th>
                                <th rowSpan="2" className="py-2.5 px-2 w-14">Reff</th>
                                <th rowSpan="2" className="py-2.5 px-3 w-40 text-right bg-neutral-50/40">Saldo Audited<br />31 Des {displayBookYear}</th>
                                <th rowSpan="2" className="py-2.5 px-2 w-10 bg-neutral-50/40">TcM</th>

                                <th rowSpan="2" className="py-2.5 px-3 w-40 text-right">Saldo Audited<br />31 Des {prevBookYear}</th>

                                {showN2 && (
                                    <>
                                        <th rowSpan="2" className="py-2.5 px-3 w-40 text-right">Saldo Audited<br />31 Des {prevBookYear2}</th>
                                    </>
                                )}

                                <th colSpan="2" className="py-1 px-3 border-b border-neutral-200 bg-neutral-50/40">Perubahan</th>
                            </tr>
                            <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider text-[9px] text-center divide-x divide-neutral-200">
                                <th className="py-1.5 px-3 w-36">Debit</th>
                                <th className="py-1.5 px-3 w-36">Kredit</th>
                                <th className="py-1.5 px-3 w-36 bg-neutral-50/40 text-right">Nominal</th>
                                <th className="py-1.5 px-2 w-16 bg-neutral-50/40">%</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 text-neutral-700 divide-x divide-neutral-100">
                            {groups.map((group) => {
                                return (
                                    <React.Fragment key={group.id}>
                                        {/* GROUP / PARENT ROW */}
                                        <tr className="bg-neutral-50/80 font-bold border-t-2 border-neutral-300 divide-x divide-neutral-100">
                                            <td className="py-2 px-3">
                                                <div className="flex items-center justify-between gap-1.5 text-xs w-full">
                                                    <input
                                                        type="text"
                                                        value={group.kode_induk || ''}
                                                        onChange={(e) => handleGroupChange(group.id, 'kode_induk', e.target.value)}
                                                        className="flex-grow min-w-0 custom-input py-1 px-2 text-xs font-black text-neutral-800 bg-white"
                                                        placeholder="Kode Induk"
                                                    />
                                                    <div className="relative flex items-center group/tooltip">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveGroup(group.id)}
                                                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100 focus:ring-1 focus:ring-red-400 focus:border-red-400 rounded-lg transition duration-150 flex-shrink-0"
                                                            title="Hapus Kelompok"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                            </svg>
                                                        </button>
                                                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 scale-0 group-hover/tooltip:scale-100 transition-all duration-100 origin-bottom bg-neutral-800 text-white text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-50 font-normal">
                                                            Hapus Kelompok
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2 px-3">
                                                <input
                                                    type="text"
                                                    value={group.nama_induk || ''}
                                                    onChange={(e) => handleGroupChange(group.id, 'nama_induk', e.target.value)}
                                                    className="w-full custom-input py-1 px-2.5 text-xs font-black text-neutral-800 bg-white uppercase"
                                                    placeholder="Nama Kelompok"
                                                />
                                            </td>
                                            <td className="py-2 px-2 text-center">
                                                <select
                                                    value={group.saldo_normal || 'debit'}
                                                    onChange={(e) => handleGroupChange(group.id, 'saldo_normal', e.target.value)}
                                                    className="w-full py-1 px-2.5 pr-8 text-[11px] font-extrabold text-neutral-700 border border-neutral-300 rounded-lg bg-white hover:bg-neutral-50 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer shadow-3xs transition duration-150"
                                                >
                                                    <option value="debit">DEBIT (D)</option>
                                                    <option value="kredit">KREDIT (K)</option>
                                                </select>
                                            </td>
                                            <td colSpan={showN2 ? 11 : 10} className="py-2 px-3 text-right bg-neutral-50/30"></td>
                                        </tr>

                                        {/* CHILDREN ROWS */}
                                        {(group.children || []).map((child) => {
                                            return (
                                                <tr key={child.id} className="hover:bg-neutral-50/20 divide-x divide-neutral-100">
                                                    {/* Kode Akun */}
                                                    <td className="py-2 px-3">
                                                        <div className="flex items-center justify-between gap-1.5 text-xs w-full">
                                                            <div className="flex items-center min-w-0 flex-1 custom-input py-1 px-2 bg-white shadow-3xs focus-within:border-[#0071e3] focus-within:ring-4 focus-within:ring-[#0071e3]/15">
                                                                {group.kode_induk && (
                                                                    <span className="text-neutral-400 font-bold select-none flex-shrink-0">{group.kode_induk}-</span>
                                                                )}
                                                                <input
                                                                    type="text"
                                                                    value={child.suffix || ''}
                                                                    onChange={(e) => handleChildChange(group.id, child.id, 'suffix', e.target.value)}
                                                                    className="w-full border-0 p-0 text-xs font-semibold text-neutral-800 bg-transparent focus:ring-0 rounded ml-0.5"
                                                                    placeholder="Suffix"
                                                                />
                                                            </div>
                                                            <div className="relative flex items-center group/tooltip">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveChild(group.id, child.id)}
                                                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100 focus:ring-1 focus:ring-red-400 focus:border-red-400 rounded-lg transition duration-150 flex-shrink-0"
                                                                    title="Hapus Akun Anak"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                                    </svg>
                                                                </button>
                                                                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 scale-0 group-hover/tooltip:scale-100 transition-all duration-100 origin-bottom bg-neutral-800 text-white text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-50 font-normal">
                                                                    Hapus Akun Anak
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {/* Nama Akun */}
                                                    <td className="py-2 px-3">
                                                        <input
                                                            type="text"
                                                            value={child.nama || ''}
                                                            onChange={(e) => handleChildChange(group.id, child.id, 'nama', e.target.value)}
                                                            className="w-full custom-input py-1 px-2 text-xs font-semibold text-neutral-800 bg-white"
                                                            placeholder="Nama Akun"
                                                        />
                                                    </td>
                                                    {/* Saldo Normal - Blank placeholder for children */}
                                                    <td className="py-2 px-2 bg-neutral-50/10 text-center font-bold text-neutral-400 text-[10px]">
                                                        {group.saldo_normal === 'debit' ? 'D' : 'K'}
                                                    </td>
                                                    {/* Saldo Unaudited */}
                                                    <td className="py-2 px-3">
                                                        <NumericInput
                                                            value={child.saldo_unaudited}
                                                            onChange={(val) => handleChildChange(group.id, child.id, 'saldo_unaudited', val)}
                                                            className="w-full custom-input py-1 px-2 text-xs font-bold text-right text-neutral-800 bg-white"
                                                        />
                                                    </td>
                                                    {/* TcM (Unaudited) */}
                                                    <td className="py-2 px-1 text-center">
                                                        <input
                                                            type="text"
                                                            value={child.tcm_unaudited || ''}
                                                            onChange={(e) => handleChildChange(group.id, child.id, 'tcm_unaudited', e.target.value)}
                                                            className="w-full custom-input py-1 px-2 text-[10px] font-bold text-center text-neutral-500 bg-white uppercase"
                                                            placeholder="TcM"
                                                            maxLength={3}
                                                        />
                                                    </td>
                                                    {/* Penyesuaian Debit */}
                                                    <td className="py-2 px-3">
                                                        <NumericInput
                                                            value={child.penyesuaian_debit}
                                                            onChange={(val) => handleChildChange(group.id, child.id, 'penyesuaian_debit', val)}
                                                            className="w-full custom-input py-1 px-2 text-xs font-bold text-right text-neutral-800 bg-white"
                                                        />
                                                    </td>
                                                    {/* Penyesuaian Kredit */}
                                                    <td className="py-2 px-3">
                                                        <NumericInput
                                                            value={child.penyesuaian_kredit}
                                                            onChange={(val) => handleChildChange(group.id, child.id, 'penyesuaian_kredit', val)}
                                                            className="w-full custom-input py-1 px-2 text-xs font-bold text-right text-neutral-800 bg-white"
                                                        />
                                                    </td>
                                                    {/* Reff */}
                                                    <td className="py-2 px-1 text-center">
                                                        <input
                                                            type="text"
                                                            value={child.reff || ''}
                                                            onChange={(e) => handleChildChange(group.id, child.id, 'reff', e.target.value)}
                                                            className="w-full custom-input py-1 px-2 text-[10px] font-bold text-center text-neutral-500 bg-white uppercase"
                                                            placeholder="Reff"
                                                        />
                                                    </td>
                                                    {/* Saldo Audited Sekarang */}
                                                    <td className="py-2 px-3 text-right font-black text-neutral-800 bg-neutral-50/20">
                                                        {formatCurrency(child.saldo_audited)}
                                                    </td>
                                                    {/* TcM (Audited Sekarang) */}
                                                    <td className="py-2 px-1 text-center bg-neutral-50/20">
                                                        <input
                                                            type="text"
                                                            value={child.tcm_audited || ''}
                                                            onChange={(e) => handleChildChange(group.id, child.id, 'tcm_audited', e.target.value)}
                                                            className="w-full custom-input py-1 px-2 text-[10px] font-bold text-center text-neutral-500 bg-white uppercase"
                                                            placeholder="TcM"
                                                            maxLength={3}
                                                        />
                                                    </td>
                                                    {/* Saldo Audited Pembanding N-1 */}
                                                    <td className="py-2 px-3">
                                                        <NumericInput
                                                            value={child.saldo_audited_prev}
                                                            onChange={(val) => handleChildChange(group.id, child.id, 'saldo_audited_prev', val)}
                                                            className="w-full custom-input py-1 px-2 text-xs font-bold text-right text-neutral-800 bg-white"
                                                        />
                                                    </td>

                                                    {/* OPTIONAL N-2 COLUMNS */}
                                                    {showN2 && (
                                                        <>
                                                            <td className="py-2 px-3">
                                                                <NumericInput
                                                                    value={child.saldo_audited_prev2}
                                                                    onChange={(val) => handleChildChange(group.id, child.id, 'saldo_audited_prev2', val)}
                                                                    className="w-full custom-input py-1 px-2 text-xs font-bold text-right text-neutral-800 bg-white"
                                                                />
                                                            </td>
                                                        </>
                                                    )}

                                                    {/* Perubahan Nominal */}
                                                    <td className="py-2 px-3 text-right font-bold bg-neutral-50/20">
                                                        <span className={child.perubahan_nominal < 0 ? 'text-red-650' : child.perubahan_nominal > 0 ? 'text-emerald-700' : 'text-neutral-800'}>
                                                            {formatCurrency(child.perubahan_nominal)}
                                                        </span>
                                                    </td>
                                                    {/* Perubahan % */}
                                                    <td className="py-2 px-2 text-center font-bold bg-neutral-50/20 w-16">
                                                        <span className={child.perubahan_persen < 0 ? 'text-red-655' : child.perubahan_persen > 0 ? 'text-emerald-700' : 'text-neutral-800'}>
                                                            {child.perubahan_persen === undefined || (child.perubahan_persen === 0 && child.perubahan_nominal === 0) ? '-' : `${child.perubahan_persen < 0 ? `(${Math.abs(child.perubahan_persen).toFixed(1)})` : Number(child.perubahan_persen).toFixed(1)}%`}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {/* TAMBAH AKUN ANAK ROW */}
                                        <tr className="bg-white/50">
                                            <td colSpan={2} className="py-2.5 px-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddChild(group.id)}
                                                    className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-black border border-dashed border-emerald-350 rounded-lg transition flex items-center justify-center gap-1 shadow-3xs"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                    </svg>
                                                    TAMBAH AKUN ANAK
                                                </button>
                                            </td>
                                            <td colSpan={showN2 ? 12 : 11} className="py-2 px-3 bg-transparent text-center"></td>
                                        </tr>

                                        {/* GROUP SUBTOTAL ROW */}
                                        <tr className="bg-neutral-100/50 font-bold border-b border-neutral-350 divide-x divide-neutral-100">
                                            <td className="py-2 px-3"></td>
                                            <td className="py-2 px-3 text-neutral-500 font-extrabold text-[10px] tracking-wider uppercase bg-neutral-150/40">SUBTOTAL</td>
                                            <td className="py-2 px-2 bg-neutral-50/10 text-center text-[10px] font-extrabold text-neutral-400">
                                                {group.saldo_normal === 'debit' ? 'D' : 'K'}
                                            </td>
                                            <td className="py-2 px-3 text-right text-neutral-700 bg-neutral-100/20">{formatCurrency(group.subtotals?.saldo_unaudited)}</td>
                                            <td className="py-2 px-2 bg-neutral-50/10"></td>
                                            <td className="py-2 px-3 text-right text-neutral-700 bg-neutral-100/20">{formatCurrency(group.subtotals?.penyesuaian_debit)}</td>
                                            <td className="py-2 px-3 text-right text-neutral-700 bg-neutral-100/20">{formatCurrency(group.subtotals?.penyesuaian_kredit)}</td>
                                            <td className="py-2 px-2 bg-neutral-50/10"></td>
                                            <td className="py-2 px-3 text-right text-neutral-800 bg-neutral-100/30 font-black">{formatCurrency(group.subtotals?.saldo_audited)}</td>
                                            <td className="py-2 px-2 bg-neutral-100/30"></td>
                                            <td className="py-2 px-3 text-right text-neutral-700 bg-neutral-100/20">{formatCurrency(group.subtotals?.saldo_audited_prev)}</td>

                                            {showN2 && (
                                                <>
                                                    <td className="py-2 px-3 text-right text-neutral-700 bg-neutral-100/20">{formatCurrency(group.subtotals?.saldo_audited_prev2)}</td>
                                                </>
                                            )}

                                            <td className="py-2 px-3 text-right text-neutral-800 bg-neutral-100/30 font-black">
                                                <span className={group.subtotals?.perubahan_nominal < 0 ? 'text-red-650' : group.subtotals?.perubahan_nominal > 0 ? 'text-emerald-700' : 'text-neutral-850'}>
                                                    {formatCurrency(group.subtotals?.perubahan_nominal)}
                                                </span>
                                            </td>
                                            <td className="py-2 px-2 text-center text-neutral-800 bg-neutral-100/30 w-16 font-black">
                                                <span className={group.subtotals?.perubahan_persen < 0 ? 'text-red-655' : group.subtotals?.perubahan_persen > 0 ? 'text-emerald-700' : 'text-neutral-850'}>
                                                    {group.subtotals?.perubahan_persen === undefined || (group.subtotals?.perubahan_persen === 0 && group.subtotals?.perubahan_nominal === 0) ? '-' : `${group.subtotals?.perubahan_persen < 0 ? `(${Math.abs(group.subtotals?.perubahan_persen).toFixed(1)})` : Number(group.subtotals?.perubahan_persen).toFixed(1)}%`}
                                                </span>
                                            </td>
                                        </tr>

                                        {/* SPACER ROW BETWEEN GROUPS */}
                                        <tr className="h-4 border-0 border-transparent">
                                            <td colSpan={showN2 ? 14 : 13} className="border-0 border-transparent bg-[#f5f5f7] h-4 p-0"></td>
                                        </tr>
                                    </React.Fragment>
                                );
                            })}

                            {/* TAMBAH KELOMPOK AKUN ROW AT THE BOTTOM OF THE GROUPS */}
                            <tr className="bg-neutral-50/30 hover:bg-neutral-100/50 border-t border-b border-neutral-200">
                                <td colSpan={2} className="py-2.5 px-3">
                                    <button
                                        type="button"
                                        onClick={handleAddGroup}
                                        className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0071e3] text-[10px] font-black border border-dashed border-blue-350 rounded-lg transition flex items-center justify-center gap-1 shadow-3xs"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                        TAMBAH KELOMPOK AKUN
                                    </button>
                                </td>
                                <td colSpan={showN2 ? 12 : 11} className="py-2.5 px-3 bg-transparent"></td>
                            </tr>

                            {/* SPACER ROW BEFORE GRAND TOTAL */}
                            <tr className="h-6 border-0 border-transparent">
                                <td colSpan={showN2 ? 14 : 13} className="border-0 border-transparent bg-[#f5f5f7] h-6 p-0"></td>
                            </tr>

                            {/* GRAND TOTAL ROW */}
                            <tr className="bg-neutral-200 text-neutral-800 font-extrabold border-t-2 border-b-2 border-neutral-400 divide-x divide-neutral-200">
                                <td className="py-2.5 px-3"></td>
                                <td className="py-2.5 px-3 text-[10px] tracking-wider uppercase font-black text-neutral-700">TOTAL KELOMPOK AKUN</td>
                                <td className="py-2.5 px-3 bg-neutral-100/10 text-center text-neutral-400 font-black">-</td>
                                <td className="py-2.5 px-3 text-right bg-neutral-200/50 font-black">{formatCurrency(grandTotals.saldo_unaudited)}</td>
                                <td className="py-2.5 px-2"></td>
                                <td className="py-2.5 px-3 text-right bg-neutral-200/50 font-black">{formatCurrency(grandTotals.penyesuaian_debit)}</td>
                                <td className="py-2.5 px-3 text-right bg-neutral-200/50 font-black">{formatCurrency(grandTotals.penyesuaian_kredit)}</td>
                                <td className="py-2.5 px-2"></td>
                                <td className="py-2.5 px-3 text-right text-blue-700 bg-neutral-100/40 font-black">{formatCurrency(grandTotals.saldo_audited)}</td>
                                <td className="py-2.5 px-2 bg-neutral-100/40"></td>
                                <td className="py-2.5 px-3 text-right bg-neutral-200/50 font-black">{formatCurrency(grandTotals.saldo_audited_prev)}</td>

                                {showN2 && (
                                    <>
                                        <td className="py-2.5 px-3 text-right bg-neutral-200/50 font-black">{formatCurrency(grandTotals.saldo_audited_prev2)}</td>
                                    </>
                                )}

                                <td className="py-2.5 px-3 text-right text-neutral-850 bg-neutral-100/40 font-black">
                                    <span className={grandTotals.perubahan_nominal < 0 ? 'text-red-650' : grandTotals.perubahan_nominal > 0 ? 'text-emerald-700' : 'text-neutral-850'}>
                                        {formatCurrency(grandTotals.perubahan_nominal)}
                                    </span>
                                </td>
                                <td className="py-2.5 px-3 text-center text-neutral-850 bg-neutral-100/40 w-16 font-black">
                                    <span className={grandTotals.perubahan_persen < 0 ? 'text-red-655' : grandTotals.perubahan_persen > 0 ? 'text-emerald-700' : 'text-neutral-850'}>
                                        {grandTotals.perubahan_persen === undefined || (grandTotals.perubahan_persen === 0 && grandTotals.perubahan_nominal === 0) ? '-' : `${grandTotals.perubahan_persen < 0 ? `(${Math.abs(grandTotals.perubahan_persen).toFixed(1)})` : Number(grandTotals.perubahan_persen).toFixed(1)}%`}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Footer Controls */}
                <div className="flex justify-end items-center border-t border-neutral-200 pt-6 mt-6 gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-3 border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl text-xs font-bold transition duration-200"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-6 py-3 bg-gradient-to-tr from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 disabled:opacity-40 rounded-xl text-xs font-bold shadow-md shadow-green-500/10 transition duration-200"
                    >
                        {processing ? 'Menyimpan...' : 'Simpan Laporan C10'}
                    </button>
                </div>
            </form>
        </div>
    );
}
