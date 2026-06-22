import React, { useState, useEffect } from 'react';
import { useForm, usePage } from '@inertiajs/react';

export default function AuditFormD10Wizard({ formToEdit, clientId, clientName, bookYear, schedule, onClose, onSaveSuccess }) {
    const { auth } = usePage().props;
    const user = auth.user;

    // Default trial balance accounts for Section D
    const defaultAccounts = [
        { nama: '', inhouse: 0, persen: 50, nominal: 0, status: 'Tidak' }
    ];

    const defaultSectionData = {
        jenis_kondisi: 'stabil', // stabil, tidak_stabil, pengembangan, likuiditas
        benchmark: 'laba_bersih', // laba_bersih, pendapatan, aset, ekuitas
        overall_materiality: 0,
        performance_percent: 80, // default 80% as shown in screenshot
        performance_materiality: 0,
        tolerable_percent: 5,
        tolerable_error: 0,
        benchmarks: {
            pendapatan: { nominal: 0, persen: 1.0, hasil: 0 },
            laba_bersih: { nominal: 0, persen: 5.0, hasil: 0 },
            aset: { nominal: 0, persen: 1.0, hasil: 0 },
            ekuitas: { nominal: 0, persen: 3.0, hasil: 0 }
        },
        qualitative_questions: [
            { no: 1, description: 'Apakah salah saji tahun sebelumnya signifikan?', value: 'Ya', notes: '' },
            { no: 2, description: 'Apakah ada perubahan struktur organisasi kunci yang menimbulkan risiko?', value: 'Ya', notes: '' },
            { no: 3, description: 'Apakah perusahaan diatur oleh regulasi yang ketat?', value: 'Ya', notes: '' },
            { no: 4, description: 'Apakah perusahaan termasuk perusahaan publik atau dalam proses gopublik?', value: 'Ya', notes: '' },
        ],
        accounts: defaultAccounts
    };

    const { data, setData, post, processing, errors } = useForm({
        client_id: formToEdit ? formToEdit.client_id : (clientId || ''),
        form_type: 'D10',
        client_name: formToEdit ? formToEdit.client_name : (clientName || ''),
        book_year: formToEdit ? formToEdit.book_year : (bookYear || ''),
        schedule: formToEdit ? formToEdit.schedule : (schedule || 'Pre-Engagement & Evaluasi'),
        section_data: formToEdit ? formToEdit.section_data : defaultSectionData
    });

    const [newlyAddedIndex, setNewlyAddedIndex] = useState(null);

    const conditionToBenchmarkMap = {
        stabil: 'laba_bersih',
        tidak_stabil: 'pendapatan',
        pengembangan: 'aset',
        likuiditas: 'ekuitas',
    };

    const benchmarkLabels = {
        laba_bersih: 'Laba Bersih Sebelum Pajak',
        pendapatan: 'Pendapatan',
        aset: 'Total Aset',
        ekuitas: 'Total Ekuitas',
    };

    const getPercentOptions = (jenisKondisi) => {
        if (jenisKondisi === 'stabil') return [3, 4, 5, 6, 7];
        if (jenisKondisi === 'tidak_stabil') return [1, 2, 3];
        if (jenisKondisi === 'pengembangan') return [1, 2, 3];
        if (jenisKondisi === 'likuiditas') return [3, 4, 5];
        return [1, 2, 3, 4, 5];
    };

    const runCalculations = (sec) => {
        // 1. Calculate active benchmark hasil
        const activeBenchmark = sec.benchmark || 'laba_bersih';
        const target = sec.benchmarks[activeBenchmark];
        if (target) {
            target.hasil = Math.round(target.nominal * (target.persen / 100));
        }

        // 2. Calculate Performance Materiality from overall_materiality
        sec.performance_materiality = Math.round(sec.overall_materiality * (sec.performance_percent / 100));

        // 3. Calculate Tolerable Error from overall_materiality
        sec.tolerable_error = Math.round(sec.overall_materiality * (sec.tolerable_percent / 100));

        // 4. Update Account Nominals and Materiality Statuses in Section D
        if (sec.accounts) {
            sec.accounts = sec.accounts.map(acc => {
                const nominal = Math.round(sec.overall_materiality * (acc.persen / 100));
                const isMaterial = Math.abs(acc.inhouse) > nominal;
                return {
                    ...acc,
                    nominal: nominal,
                    status: isMaterial ? 'Material' : 'Tidak'
                };
            });
        }
        return sec;
    };

    // Auto-calculate values on mount to sync initial state
    useEffect(() => {
        const sec = { ...data.section_data };
        const calculated = runCalculations(sec);
        setData('section_data', calculated);
    }, []);

    // Autofocus on newly added account name input
    useEffect(() => {
        if (newlyAddedIndex !== null) {
            const inputEl = document.getElementById(`acc-nama-${newlyAddedIndex}`);
            if (inputEl) {
                inputEl.focus();
            }
            setNewlyAddedIndex(null);
        }
    }, [newlyAddedIndex]);

    const formatCurrency = (val) => {
        if (!val && val !== 0) return '-';
        return 'Rp ' + Number(val).toLocaleString('id-ID');
    };

    const handleJenisKondisiChange = (val) => {
        const sec = { ...data.section_data };
        sec.jenis_kondisi = val;
        
        let activeBenchmark = 'laba_bersih';
        let defaultPercent = 5;
        if (val === 'stabil') {
            activeBenchmark = 'laba_bersih';
            defaultPercent = 5;
        } else if (val === 'tidak_stabil') {
            activeBenchmark = 'pendapatan';
            defaultPercent = 1;
        } else if (val === 'pengembangan') {
            activeBenchmark = 'aset';
            defaultPercent = 1;
        } else if (val === 'likuiditas') {
            activeBenchmark = 'ekuitas';
            defaultPercent = 3;
        }
        
        sec.benchmark = activeBenchmark;
        sec.benchmarks[activeBenchmark].persen = defaultPercent;
        
        // Re-calculate the active benchmark's hasil
        const bench = sec.benchmarks[activeBenchmark];
        bench.hasil = Math.round(bench.nominal * (bench.persen / 100));
        
        // Update overall materiality to this new hasil
        sec.overall_materiality = bench.hasil;
        
        const calculated = runCalculations(sec);
        setData('section_data', calculated);
    };

    const handleNominalChange = (value) => {
        const cleanVal = Number(value.replace(/[^0-9]/g, ''));
        const sec = { ...data.section_data };
        const activeBenchmark = sec.benchmark || 'laba_bersih';
        
        sec.benchmarks[activeBenchmark].nominal = cleanVal;
        sec.benchmarks[activeBenchmark].hasil = Math.round(cleanVal * (sec.benchmarks[activeBenchmark].persen / 100));
        sec.overall_materiality = sec.benchmarks[activeBenchmark].hasil;
        
        const calculated = runCalculations(sec);
        setData('section_data', calculated);
    };

    const handlePercentChange = (val) => {
        const sec = { ...data.section_data };
        const activeBenchmark = sec.benchmark || 'laba_bersih';
        
        sec.benchmarks[activeBenchmark].persen = val;
        sec.benchmarks[activeBenchmark].hasil = Math.round(sec.benchmarks[activeBenchmark].nominal * (val / 100));
        sec.overall_materiality = sec.benchmarks[activeBenchmark].hasil;
        
        const calculated = runCalculations(sec);
        setData('section_data', calculated);
    };

    const handleOverallMaterialityChange = (value) => {
        const cleanVal = Number(value.replace(/[^0-9]/g, ''));
        const sec = { ...data.section_data };
        
        sec.overall_materiality = cleanVal;
        
        const calculated = runCalculations(sec);
        setData('section_data', calculated);
    };

    const handlePerformancePercentChange = (val) => {
        const sec = { ...data.section_data };
        sec.performance_percent = val;
        
        const calculated = runCalculations(sec);
        setData('section_data', calculated);
    };

    const handleTolerablePercentChange = (val) => {
        const sec = { ...data.section_data };
        sec.tolerable_percent = val;
        
        const calculated = runCalculations(sec);
        setData('section_data', calculated);
    };

    const handleQualitativeChange = (index, field, val) => {
        const sec = { ...data.section_data };
        const list = [...sec.qualitative_questions];
        list[index][field] = val;
        sec.qualitative_questions = list;
        
        setData('section_data', sec);
    };

    const handleAccountChange = (index, field, val) => {
        const sec = { ...data.section_data };
        const list = [...sec.accounts];
        
        if (field === 'persen') {
            list[index].persen = Number(val);
        } else if (field === 'inhouse') {
            list[index].inhouse = Number(val.replace(/[^0-9-]/g, ''));
        } else {
            list[index].nama = val;
        }
        
        sec.accounts = list;
        const calculated = runCalculations(sec);
        setData('section_data', calculated);
    };

    const handleAddAccount = () => {
        const sec = { ...data.section_data };
        const list = [...sec.accounts];
        const newRowIndex = list.length;
        list.push({ nama: '', inhouse: 0, persen: 50, nominal: 0, status: 'Tidak' });
        sec.accounts = list;
        
        const calculated = runCalculations(sec);
        setData('section_data', calculated);
        setNewlyAddedIndex(newRowIndex);
    };

    const handleRemoveAccount = (index) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus baris akun ini?")) {
            const sec = { ...data.section_data };
            const list = sec.accounts.filter((_, idx) => idx !== index);
            sec.accounts = list;
            
            const calculated = runCalculations(sec);
            setData('section_data', calculated);
        }
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

    const activeFactorId = data.section_data.benchmark || 'laba_bersih';
    const activeFactorLabel = benchmarkLabels[activeFactorId] || 'Laba Bersih Sebelum Pajak';
    const currentPercent = data.section_data.benchmarks[activeFactorId]?.persen || 0;
    const options = getPercentOptions(data.section_data.jenis_kondisi);

    return (
        <div className="bg-[#f5f5f7] p-6 rounded-2xl max-w-6xl mx-auto my-6 space-y-6 shadow-sm border border-neutral-200">
            {/* KAP SANDRA PRACIPTA HEADER */}
            <div className="border border-neutral-300 p-6 bg-white shadow-2xs rounded-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2 w-full md:w-80">
                        <div className="flex items-center justify-between bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs">
                            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Materialitas Keseluruhan</span>
                            <span className="font-black text-[#0071e3]">{formatCurrency(data.section_data.overall_materiality)}</span>
                        </div>
                        <div className="flex items-center justify-between bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs">
                            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Materialitas Pelaksanaan</span>
                            <span className="font-black text-neutral-800">{formatCurrency(data.section_data.performance_materiality)}</span>
                        </div>
                        <div className="flex items-center justify-between bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs">
                            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Kesalahan yang ditoleransi</span>
                            <span className="font-black text-emerald-600">{formatCurrency(data.section_data.tolerable_error)}</span>
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

            {/* PETUNJUK BOX */}
            <div className="border border-green-200 bg-green-50/20 p-5 rounded-xl">
                <h4 className="text-xs font-bold text-red-650 mb-2 uppercase tracking-wider">Petunjuk:</h4>
                <ol className="list-decimal pl-5 text-xs text-neutral-600 space-y-1.5 font-medium leading-relaxed">
                    <li>Formulir ini digunakan untuk menetapkan materialitas, baik tingkat laporan keuangan maupun pelaksanaan.</li>
                    <li>Formulir ini harus diisi oleh In-charge atau Manager selama tahap perencanaan dan disetujui oleh Partner sebelum pekerjaan lapangan dimulai.</li>
                </ol>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* SECTION A */}
                <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-5">
                    <h3 className="text-base font-black text-neutral-800 border-b border-neutral-100 pb-2">
                        A. Perhitungan Materialitas Keseluruhan Tingkat Laporan Keuangan (Overall Materiality)
                    </h3>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                        Dasar penentuan materialitas keseluruhan pada tingkat laporan keuangan biasanya berdasarkan sudut pandang para pemakai laporan keuangan. Pada umumnya, penentuan ini berhubungan dengan kondisi keuangan klien.
                        Berikut ini kebijakan kantor kami terkait penentuan materialitas keseluruhan pada tingkat laporan keuangan dalam kisaran prosentase untuk entitas berorientasi laba:
                    </p>
                    <ol className="list-decimal pl-5 text-xs text-neutral-500 space-y-1">
                        <li>Klien yang kondisi keuangan stabil: 3% - 7% dari laba bersih sebelum pajak;</li>
                        <li>Klien dengan kondisi keuangan tidak stabil atau break even atau rugi terus-menerus: 1% - 3% dari pendapatan;</li>
                        <li>Klien dengan bisnis masih dalam tahap pengembangan: 1% - 3% dari total aset;</li>
                        <li>Kerugian berturut-turut dan masalah likuiditas : 3% - 5% dari Total Ekuitas.</li>
                    </ol>
                    <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
                        Angka yang dijadikan dasar perhitungan materialitas secara keseluruhan adalah angka setahun. Oleh karena itu, apabila tim melakukan audit dalam periode interim, laporan keuangan yang disajikan klien harus disetahunkan dengan metode ekstrapolasi, dengan mempertimbangkan anggaran dan prakiraan periode berjalan, penyesuaian jika ada perubahan signifikan yang terjadi di entitas (misal adanya akuisisi bisnis yang signifikan), perubahan kondisi industri atau lingkungan ekonomi yang relevan, faktor musiman, dan lain-lain.
                    </p>

                    <div className="border-t border-neutral-100 pt-5 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                            <span className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider w-44 shrink-0">Jenis dan kondisi klien:</span>
                            <select
                                value={data.section_data.jenis_kondisi}
                                onChange={(e) => handleJenisKondisiChange(e.target.value)}
                                className="custom-input p-2.5 text-xs flex-grow font-semibold"
                            >
                                <option value="stabil">Kondisi keuangan perusahaan stabil</option>
                                <option value="tidak_stabil">Kondisi keuangan tidak stabil atau break even atau rugi terus-menerus</option>
                                <option value="pengembangan">Klien bisnis masih dalam tahap pengembangan</option>
                                <option value="likuiditas">Kerugian berturut-turut dan masalah likuiditas</option>
                            </select>
                        </div>

                        <div className="overflow-x-auto border border-neutral-300 rounded-lg">
                            <table className="w-full text-left text-xs border-collapse border border-neutral-300">
                                <thead>
                                    <tr className="bg-neutral-200 text-neutral-700 font-bold uppercase tracking-wider text-[10px] text-center border-b border-neutral-300">
                                        <th className="py-2.5 px-3 border border-neutral-300 text-center w-[40%]">Faktor</th>
                                        <th className="py-2.5 px-3 border border-neutral-300 text-center w-[25%]">Nominal</th>
                                        <th className="py-2.5 px-3 border border-neutral-300 text-center w-[15%]">%</th>
                                        <th className="py-2.5 px-3 border border-neutral-300 text-center w-[20%]">Hasil</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    <tr className="hover:bg-neutral-50/20">
                                        <td className="py-3 px-3 border border-neutral-300 font-semibold text-neutral-800">
                                            {activeFactorLabel}
                                        </td>
                                        <td className="py-2 px-3 border border-neutral-300">
                                            <div className="flex items-center gap-1.5 bg-white border border-neutral-300 rounded-md px-2 py-1 shadow-2xs focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                                                <span className="text-neutral-400 font-bold">Rp</span>
                                                <input
                                                    type="text"
                                                    value={Number(data.section_data.benchmarks[activeFactorId]?.nominal || 0).toLocaleString('id-ID')}
                                                    onChange={(e) => handleNominalChange(e.target.value)}
                                                    className="w-full border-0 p-0 text-xs text-right font-bold focus:ring-0 text-neutral-800"
                                                />
                                            </div>
                                        </td>
                                        <td className="py-2 px-3 border border-neutral-300">
                                            <select
                                                value={currentPercent}
                                                onChange={(e) => handlePercentChange(Number(e.target.value))}
                                                className="w-full border border-neutral-300 rounded-md py-1 px-2.5 text-xs text-center font-bold text-neutral-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                            >
                                                {options.map(opt => (
                                                    <option key={opt} value={opt}>{opt}%</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="py-3 px-3 border border-neutral-300 text-right text-neutral-800 font-bold bg-neutral-50/50">
                                            {formatCurrency(data.section_data.benchmarks[activeFactorId]?.hasil)}
                                        </td>
                                    </tr>
                                    <tr className="bg-neutral-50/50">
                                        <td colSpan="3" className="py-3 px-3 border border-neutral-300 text-right font-extrabold text-neutral-600 uppercase tracking-wider text-[10px]">Dibulatkan (Overall Materiality)</td>
                                        <td className="py-2 px-3 border border-neutral-300">
                                            <div className="flex items-center gap-1.5 bg-white border border-[#0071e3] rounded-md px-2 py-1 shadow-2xs">
                                                <span className="text-[#0071e3] font-bold text-xs">Rp</span>
                                                <input
                                                    type="text"
                                                    value={Number(data.section_data.overall_materiality || 0).toLocaleString('id-ID')}
                                                    onChange={(e) => handleOverallMaterialityChange(e.target.value)}
                                                    className="w-full border-0 p-0 text-xs font-black text-right border-0 focus:ring-0 text-[#0071e3]"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* SECTION B */}
                <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-5">
                    <h3 className="text-base font-black text-neutral-800 border-b border-neutral-100 pb-2">
                        B. Materialitas Pelaksanaan (Performance Materiality)
                    </h3>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                        Materialitas pelaksanaan adalah suatu jumlah yang ditetapkan oleh auditor, pada tingkat yang lebih rendah daripada materialitas untuk laporan keuangan secara keseluruhan, untuk mengurangi ke tingkat yang lebih rendah yang semestinya kemungkinan salah saji yang tidak dikoreksi dan yang tidak terdeteksi yang secara agregat melebihi materialitas untuk laporan keuangan secara keseluruhan.
                    </p>
                    <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
                        Materialitas pelaksanaan ditetapkan pada jumlah yang lebih rendah daripada materialitas secara keseluruhan pada tingkat laporan keuangan.
                        Sesuai dengan kebijakan Kantor kami, materialitas pelaksanaan ditetapkan sebesar 25% - 80% dari materialitas keseluruhan.
                        Penentuan rentang kisaran prosentase materialitas keseluruhan dan materialitas pelaksanaan memperhitungkan faktor kualitatif, antara lain dapat dipengaruhi oleh:
                    </p>

                    <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider text-[10px] bg-neutral-50">
                                    <th className="py-2.5 px-3 w-12 text-center border-r border-neutral-200">No.</th>
                                    <th className="py-2.5 px-3 border-r border-neutral-200">Deskripsi</th>
                                    <th className="py-2.5 px-3 w-28 text-center border-r border-neutral-200">Y/T</th>
                                    <th className="py-2.5 px-3 w-72">Catatan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 bg-white text-neutral-700">
                                {data.section_data.qualitative_questions.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-neutral-50/20">
                                        <td className="py-2.5 px-3 text-center border-r border-neutral-200 font-semibold text-neutral-400">{item.no}</td>
                                        <td className="py-2.5 px-3 border-r border-neutral-200 font-semibold text-neutral-800">{item.description}</td>
                                        <td className="py-2 px-3 border-r border-neutral-200 text-center">
                                            <select
                                                value={item.value}
                                                onChange={(e) => handleQualitativeChange(idx, 'value', e.target.value)}
                                                className="custom-input py-1 px-2.5 text-xs w-20 text-center font-bold"
                                            >
                                                <option value="Ya">Ya</option>
                                                <option value="Tidak">Tidak</option>
                                            </select>
                                        </td>
                                        <td className="py-2 px-3">
                                            <input
                                                type="text"
                                                value={item.notes || ''}
                                                onChange={(e) => handleQualitativeChange(idx, 'notes', e.target.value)}
                                                placeholder="Catatan..."
                                                className="w-full custom-input py-1 px-2.5 text-xs"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-neutral-50 p-5 rounded-xl border border-neutral-200">
                        <p className="text-xs text-neutral-600 leading-relaxed font-semibold mb-3">
                            Berdasarkan pertimbangan tersebut, materilitas pelaksanaan ditetapkan sebesar ...... Dari materialitas keseluruhan sehingga nilai materialitas pelaksanaan adalah sebagai berikut:
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-neutral-700">
                            <span className="uppercase tracking-wider">Materialitas pelaksanaan</span>
                            <div className="flex items-center border border-neutral-300 bg-white rounded-lg px-2 py-1 shadow-2xs">
                                <input
                                    type="number"
                                    min="25"
                                    max="80"
                                    value={data.section_data.performance_percent}
                                    onChange={(e) => handlePerformancePercentChange(Number(e.target.value))}
                                    className="w-12 border-0 p-0 text-center text-xs font-extrabold focus:ring-0 text-[#0071e3]"
                                />
                                <span className="text-[#0071e3] font-bold">%</span>
                            </div>
                            <span className="text-neutral-400 font-extrabold text-sm mx-1">X</span>
                            <div className="bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-neutral-700 text-xs shadow-2xs font-bold">
                                {formatCurrency(data.section_data.overall_materiality)}
                            </div>
                            <span className="text-neutral-400 font-extrabold text-sm mx-1">=</span>
                            <div className="bg-blue-50 border border-blue-200 text-[#0071e3] rounded-lg px-4 py-2 text-sm font-black shadow-2xs">
                                {formatCurrency(data.section_data.performance_materiality)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION C */}
                <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-5">
                    <h3 className="text-base font-black text-neutral-800 border-b border-neutral-100 pb-2">
                        C. Batas salah saji yang tidak dikoreksi (Unadjusted Error)
                    </h3>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                        Sesuai dengan kebijakan Kantor kami, batas materialitas yang digunakan untuk mengevaluasi dampak salah saji yang teridentifikasi dalam audit dan salah saji yang tidak dikoreksi ditetapkan sebesar 5% dari materialitas keseluruhan, yaitu sebesar:
                    </p>
                    
                    <div className="bg-neutral-50 p-5 rounded-xl border border-neutral-200">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-neutral-700">
                            <span className="uppercase tracking-wider">Salah Saji yang dapat ditoleransi</span>
                            <div className="flex items-center border border-neutral-300 bg-white rounded-lg px-2 py-1 shadow-2xs">
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={data.section_data.tolerable_percent}
                                    onChange={(e) => handleTolerablePercentChange(Number(e.target.value))}
                                    className="w-10 border-0 p-0 text-center text-xs font-extrabold focus:ring-0 text-emerald-600"
                                />
                                <span className="text-emerald-600 font-bold">%</span>
                            </div>
                            <span className="text-neutral-400 font-extrabold text-sm mx-1">X</span>
                            <div className="bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-neutral-700 text-xs shadow-2xs font-bold">
                                {formatCurrency(data.section_data.overall_materiality)}
                            </div>
                            <span className="text-neutral-400 font-extrabold text-sm mx-1">=</span>
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-2 text-sm font-black shadow-2xs">
                                {formatCurrency(data.section_data.tolerable_error)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION D */}
                <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-5">
                    <div className="border-b border-neutral-100 pb-2">
                        <h3 className="text-base font-black text-neutral-800">
                            D. Materialitas Pelaksanaan Pada Tingkat Saldo Akun
                        </h3>
                    </div>

                    <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider text-[9px] text-center divide-x divide-neutral-200">
                                    <th rowSpan="2" className="py-2.5 px-3 text-left">Nama Akun</th>
                                    <th rowSpan="2" className="py-2.5 px-3 text-right">Inhouse</th>
                                    <th colSpan="2" className="py-1 px-3 border-b border-neutral-200">Materialitas Pelaksanaan</th>
                                    <th rowSpan="2" className="py-2.5 px-3 w-36">Material/Tidak</th>
                                    <th rowSpan="2" className="py-2.5 px-2 w-12 bg-neutral-50/50"></th>
                                </tr>
                                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider text-[9px] text-center divide-x divide-neutral-200">
                                    <th className="py-1.5 px-3 w-28">25%-80%</th>
                                    <th className="py-1.5 px-3 w-40 text-right">Nominal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 bg-white text-neutral-700 divide-x divide-neutral-100">
                                {data.section_data.accounts.map((acc, index) => {
                                    const isMaterial = acc.status === 'Material';
                                    const sectionDPercentOptions = [25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
                                    const accOptions = [...sectionDPercentOptions];
                                    if (acc.persen && !accOptions.includes(acc.persen)) {
                                        accOptions.push(acc.persen);
                                        accOptions.sort((a, b) => a - b);
                                    }
                                    return (
                                        <tr key={index} className="hover:bg-neutral-50/20 divide-x divide-neutral-100">
                                            <td className="py-2 px-3">
                                                <input
                                                    id={`acc-nama-${index}`}
                                                    type="text"
                                                    value={acc.nama}
                                                    onChange={(e) => handleAccountChange(index, 'nama', e.target.value)}
                                                    className="w-full border-0 p-0 text-xs font-semibold text-neutral-800 bg-transparent focus:ring-0 focus:bg-neutral-50 rounded"
                                                    placeholder="Nama Akun..."
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input
                                                    id={`acc-inhouse-${index}`}
                                                    type="text"
                                                    value={Number(acc.inhouse || 0).toLocaleString('id-ID')}
                                                    onChange={(e) => handleAccountChange(index, 'inhouse', e.target.value)}
                                                    className="w-full border-0 p-0 text-xs font-bold text-right text-neutral-800 bg-transparent focus:ring-0 focus:bg-neutral-50 rounded"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                                <select
                                                    value={acc.persen}
                                                    onChange={(e) => handleAccountChange(index, 'persen', e.target.value)}
                                                    className="custom-input py-0.5 px-2 text-xs w-20 text-center font-bold"
                                                >
                                                    {accOptions.map(opt => (
                                                        <option key={opt} value={opt}>{opt}%</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="py-2 px-3 text-right font-bold text-neutral-700">
                                                {formatCurrency(acc.nominal)}
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase border ${isMaterial
                                                    ? 'bg-red-50 text-red-600 border-red-200'
                                                    : 'bg-neutral-50 text-neutral-500 border-neutral-200'
                                                }`}>
                                                    {acc.status || 'Tidak'}
                                                </span>
                                            </td>
                                            <td className="py-2 px-2 text-center bg-neutral-50/10">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveAccount(index)}
                                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                                    title="Hapus baris"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={handleAddAccount}
                            className="w-full py-2.5 bg-neutral-50 border border-dashed border-neutral-300 hover:bg-neutral-100 hover:border-neutral-400 text-neutral-600 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Tambah Baris Akun Baru
                        </button>
                    </div>
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
                        {processing ? 'Menyimpan...' : 'Simpan Laporan D10'}
                    </button>
                </div>
            </form>
        </div>
    );
}
