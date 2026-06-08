import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import axios from 'axios';

export default function AuditFormWizard({ formToEdit, onClose, onSaveSuccess }) {
    // Default initial data for A10 questionnaire sections
    const defaultSection1 = Array.from({ length: 10 }, (_, i) => ({
        no: i + 1,
        description: [
            "Tujuan audit adalah untuk menyatakan suatu pendapat atas laporan keuangan.",
            "Tanggung jawab manajemen adalah untuk: (1) Membangun dan mempertahankan pengendalian intern yang efektif untuk memastikan kehandalan laporan keuangan; Mengidentifikasi  dan  menjamin  bahwa  entitas  telah  mematuhi  peraturan perundangan yang berlaku dalam setiap aktivitasnya; (3) Membuat semua catatan keuangan dan informasi yang berkaitan tersedia bagi auditor; (4) Menyediakan  suatu  surat  bagi  auditor  yang  menegaskan  representasi tertentu yang dibuat selama audit berlangsung.",
            "Tanggung   jawab   auditor   untuk   melaksanakan   audit   berdasarkan   standar auditing yang ditetapkan IAPI",
            "Pengaturan mengenai pelaksanaan perikatan (sebagai contoh, waktu, bantuan klien berkaitan dengan pembuatan skedul dan penyediaan dokumen).",
            "Pengaturan tentang keikutsertaan spesialis atau auditor intern, jika diperlukan.",
            "Pengaturan tentang keikutsertaan auditor pendahulu.",
            "Pengaturan tentang fee dan penagihan.",
            "Adanya pembatasan atau pengaturan lain tentang kewajiban auditor atau klien, seperti ganti rugi kepada auditor untuk kewajiban yang timbul dari representasi salah yang dilakukan dengan sepengetahuan manajemen kepada auditor.",
            "Kondisi yang memungkinkan pihak lain diperbolehkan untuk melakukan akses ke kertas kerja auditor.",
            "Jasa  tambahan  yang  disediakan  oleh  auditor  berkaitan  dengan  pemenuhan persyaratan badan pengatur.",
            "Pengaturan  tentang  jasa  lain  yang  harus  disediakan  oleh  auditor  dalam hubungannya dengan perikatan.",
            "Pengaturan tentang koordinasi dengan auditor lain dalam hal KAP melakukan audit terhadap laporan keuangan Group",
            "Penegasan bahwa pemeriksaan oleh KAP tidak meliputi pemeriksaan sebagaimana yang akan dilakukan oleh Direktorat Jenderal Pajak, sehingga pemeriksaan tersebut sebaiknya tidak dijadikan dasar untuk mendeteksi seluruh penyimpangan yang mungkin akan diketemukan oleh pemeriksa dari Direktur Jenderal Pajak.",
            "Penegasan  bahwa  klien  tidak  menugaskan  auditor  independen  lain  untuk melaksanakan audit untuk tahun buku yang sama.",
            "Penagasan bahwa klien bersedia untuk melaksanakan prosedur PMPJ yang akan dilakukan oleh KAP Sesuai Ketentuan"
        ][i],
        date: '',
        initial: ''
    }));

    const defaultPemilik = Array.from({ length: 5 }, (_, i) => ({
        no: i + 1,
        nama: '',
        saham_saham: '',
        saham_persen: '',
        jabatan: 'Tidak Menjabat'
    }));

    const defaultKomisaris = [
        { jabatan: 'Komisaris Utama', nama_2024: '', nama_2023: '' },
        { jabatan: 'Komisaris Independen', nama_2024: '', nama_2023: '' }
    ];

    const defaultDireksi = [
        { jabatan: 'Direktur Utama', nama_2024: '', nama_2023: '' },
        { jabatan: 'Direktur', nama_2024: '', nama_2023: '' },
        { jabatan: 'Direktur', nama_2024: '', nama_2023: '' }
    ];

    const defaultGoingConcern = Array.from({ length: 6 }, (_, i) => ({
        no: `${i + 1})`,
        description: [
            "Apakah aliran kas (cash flow) tidak cukup untuk memenuhi kewajiban saat ini?",
            "Apakah penjualan, laba kotor dan laba bersih menunjukkan penurunan yang tajam pada tahun-tahun belakangan?",
            "Apakah terdapat hutang yang besar yang mengindikasikan kemungkinan adanya ketidakmampuan membayar dikemudian hari?",
            "Apakah ada penghapusan atau ketidakmampuan membayar hutang?",
            "Apakah terdapat perubahan dalam kondisi ekonomi yang dapat merugikan atau mempengaruhi industri klien?",
            "Apakah terdapat kasus hukum yang sedang dihadapi klien yang berdampak material terhadap keuangan klien?"
        ][i],
        value: 'Tidak',
        notes: ''
    }));

    const defaultAuditable = Array.from({ length: 4 }, (_, i) => ({
        no: `${i + 1})`,
        description: [
            "Apakah klien mampu menyusun neraca dan laporan laba/rugi secara periodic?",
            "Apakah neraca selalu menunjukkan saldo yang seimbang (balance)?",
            "Apakah bukti disimpan secara memadai (rapi) dan lengkap?",
            "Apakah ada rincian untuk setiap akun?"
        ][i],
        value: 'Ya'
    }));

    const defaultJadwalFee = [
        { no: 1, tanggal: '', keterangan: 'Pembayaran termin I', persen: '50%', nominal: '' },
        { no: 2, tanggal: '', keterangan: 'Pembayaran termin II', persen: '50%', nominal: '' }
    ];

    const defaultIntegritas = Array.from({ length: 13 }, (_, i) => ({
        no: i + 1,
        description: [
            "Apakah klien mempunyai kebijakan tentang standar etika dan \"codes of conduct\", baik yang tertulis maupun yang dikomunikasikan?",
            "Apakah standar etika dan \"codes of conduct\" telah dikomunikasikan dan dipraktikkan?",
            "Apakah pengetahuan dan pengalaman manajemen memadai untuk menjalankan usaha?",
            "Apakah pengendalian manajemen dan administratif cukup kuat?",
            "Apakah sistem informasi manajemen yang ada telah memadai dan diterapkan?",
            "Apakah terdapat perputaran (turn over) yang tinggi pada posisi-posisi kunci terutama pada fungsi keuangan dan akuntansi?",
            "Apakah perputaran tersebut mempunyai pengaruh negatif terhadap operasi klien?",
            "Apakah ada kondisi yang memungkinkan manajemen dalam posisi dapat melangkahi pengendalian yang ada?",
            "Apakah ada tekanan terhadap manajemen untuk memanipulasi hasil operasi?",
            "Apakah ada potensi risiko terhadap penyajian laporan keuangan yang mungkin timbul karena usaha manajemen untuk merespon expektasi yang tidak realistik?",
            "Apakah pernah terjadi kesalahan dan kekeliruan yang material dalam laporan keuangan?",
            "Apakah pernah terjadi pelanggaran hukum dan peraturan yang dilakukan klien atau pejabat klien?",
            "Apakah ada transaksi material dengan pihak yang terkait yang belum diungkapkan dalam laporan keuangan?"
        ][i],
        value: 'Tidak',
        notes: ''
    }));

    const defaultIndependensi = Array.from({ length: 12 }, (_, i) => ({
        no: i + 1,
        description: [
            "Apakah KAP mempunyai utang yang signifikan kepada klien dengan persyaratan kredit yang melampaui batas-batas kenormalan?",
            "Apakah ada partner atau staf KAP yang mempunyai piutang atau utang kepada/dari klien?",
            "Apakah ada karyawan klien yang menjadi pegawai atau partner pada KAP?",
            "Apakah ada partner atau staf KAP yang mempunyai saham atau investasi lainnya pada klien?",
            "Apakah ada partner KAP yang pada saat ini bertindak sebagai penasihat klien?",
            "Apakah ada jasa lainnya yang dilaksanakan oleh KAP terhadap klien yang berpotensi konflik (misalnya sebagai penasihat keuangan)?",
            "Apakah ada penilaian unsur laporan keuangan yang dilakukan oleh spesialis yang merupakan perusahaan \"asosiasi\" KAP yang berpotensi konflik?",
            "Apakah engagement partner atau staf KAP mempunyai hubungan famili (secara garis lurus satu tingkat) atau personal dengan klien?",
            "Apakah fee profesional untuk jasa audit dan jasa lainnya yang dibayar oleh klien melampaui 10% total pendapatan kantor?",
            "Apakah fee profesional untuk jasa audit ini tergantung dari hasil penugasan?",
            "Apakah ada partner atau staf KAP menerima barang atau jasa dalam nilai yang relatif tinggi dari klien?",
            "Apakah partner atau staf KAP memberikan barang atau jasa dalam nilai yang relatif tinggi kepada klien?"
        ][i],
        value: 'Tidak',
        notes: ''
    }));

    const defaultBantuanKlien = Array.from({ length: 21 }, (_, i) => ({
        no: i + 1,
        description: [
            "Neraca percobaan (trial balance)", "General Ledger", "Laporan Keuangan Lengkap", "Akta Pendirian", "SOP dan Peraturan Internal Perusahaan",
            "Rincian kas dan Perusahaan", "Rekonsiliasi setiap rekening Perusahaan", "Daftar Piutang", "Daftar Investasi", "Daftar saldo uang muka & biaya dibayar di muka",
            "Daftar saldo persediaan, termasuk nilainya", "Daftar saldo surat-surat berharga", "Daftar saldo investasi", "Daftar saldo aset tetap",
            "Daftar saldo utang usaha", "Daftar saldo utang bank, dan dokumen perjanjian utang", "Daftar Deposit Tamu", "Laporan Aktuaris Independen",
            "Daftar pemegang saham perubahannya dan Pembagian Dividen", "Dokumen transaksi hubungan istimewa", "Rincian Beban Administrasi dan Umum"
        ][i],
        value: 'Ya',
        notes: 'Data sumber'
    }));

    const defaultSmallBusiness = Array.from({ length: 14 }, (_, i) => ({
        no: i + 1,
        description: [
            "Apakah pemilik dan anggota manajemen hanya terdiri dari beberapa orang?",
            "Apakah terdapat perangkapan beberapa fungsi pengendalian utama?",
            "Apakah perangkat lunak yang digunakan untuk pembukuan masih sederhana?",
            "Apakah jenis produk/jasa yang dihasilkan perusahaan sedikit?",
            "Apakah volume transaksi penjualan sedikit?",
            "Apakah lokasi penjualan tidak di banyak tempat?",
            "Apakah perusahaan tidak dibawah regulasi peraturan tertentu?",
            "Apakah pertumbuhan usaha perusahaan stabil?",
            "Apakah tidak terdapat ekspansi yang besar-besaran?",
            "Apakah ekspektasi terhadap jasa auditor hanya terbatas pada laporan auditor independen?",
            "Apakah prakiraan jam kerja audit tidak melebihi 200 jam?",
            "Apakah total aset perusahaan dibawah Rp25 Milyar?",
            "Apakah total pendapatan lebih kecil dari Rp50 Milyar?",
            "Apakah jumlah pegawai tidak melebihi 50 orang?"
        ][i],
        value: 'T',
        notes: ''
    }));

    // Form settings using Inertia helper
    const { data, setData, post, processing, errors } = useForm({
        client_name: formToEdit ? formToEdit.client_name : '',
        book_year: formToEdit ? formToEdit.book_year : '',
        schedule: formToEdit ? formToEdit.schedule : 'Pre-Engagement (Analisi Penerimaan Dan Keberlanjutan Hubungan Dengan Klien)',
        section_data: formToEdit ? formToEdit.section_data : {
            section_1: defaultSection1,
            section_2_a: {
                description: '',
                pemilik: defaultPemilik,
                dewan_komisaris: defaultKomisaris,
                dewan_direksi: defaultDireksi,
                address: '',
                revenue_sources: '',
                funding_sources: '',
            },
            section_2_b: {
                has_subsidiary: 'Tidak',
                subsidiary_detail: [],
                related_parties: [],
            },
            section_2_c: 'Jasa Audit Laporan keuangan tahun buku 2024',
            section_2_d: {
                nama_kap: '',
                nama_ap: '',
                alamat: '',
                alasan_penggantian: '',
                bantuan_pendahulu: '',
            },
            section_2_e: {
                tujuan_audit: '',
                has_internal_audit: 'Tidak',
                kedudukan_internal_audit: '',
                going_concern: defaultGoingConcern,
                going_concern_conclusion: '',
            },
            section_2_f: {
                buku_pedoman: '',
                cara_mengolah_data: '',
                auditable: defaultAuditable,
                cycles: '',
            },
            section_2_g: 'Tidak ada',
            section_2_h: {
                nilai_kontrak: '',
                tahap_pembayaran: '',
                jadwal_pelunasan: defaultJadwalFee,
            },
            section_3: {
                questions: defaultIntegritas,
                conclusion: '',
            },
            section_4: {
                questions: defaultIndependensi,
                conclusion: '',
            },
            section_5: {
                staf_introduksi: '',
                referensi: ['', ''],
                prosedur_lain: ['', '', ''],
                bantuan_klien: defaultBantuanKlien,
            },
            section_6: {
                questions: defaultSmallBusiness,
                conclusion: 'Tidak termasuk Kategori entitas dengan bisnis kecil untuk tujuan audit',
            },
            section_b: {
                integritas: '',
                independensi: '',
                auditable: '',
                risiko: '',
                kesimpulan: 'Diterima',
                level_risiko: 'Tinggi',
            }
        }
    });

    const [activeStep, setActiveStep] = useState(1);
    const [parsingOds, setParsingOds] = useState(false);
    const [parseError, setParseError] = useState('');

    const steps = [
        { id: 1, title: 'SA 210 & Klien Info' },
        { id: 2, title: 'Latar Belakang & Bisnis' },
        { id: 3, title: 'Risiko & Going Concern' },
        { id: 4, title: 'Integritas Manajemen' },
        { id: 5, title: 'Independensi KAP' },
        { id: 6, title: 'Evaluasi & Kesimpulan' }
    ];

    // Handles uploading ODS to parse the file and pre-populate forms
    const handleOdsUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setParsingOds(true);
        setParseError('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('/audit-forms/parse/ods', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const parsed = response.data;
            setData({
                client_name: parsed.client_name,
                book_year: parsed.book_year,
                schedule: parsed.schedule,
                section_data: parsed.section_data
            });
            alert('File ODS berhasil diparsing! Form telah diisi secara otomatis.');
        } catch (err) {
            console.error(err);
            setParseError(err.response?.data?.error || 'Gagal memparsing file ODS. Pastikan file valid.');
        } finally {
            setParsingOds(false);
        }
    };

    const nextStep = () => {
        if (activeStep < 6) setActiveStep(activeStep + 1);
    };

    const prevStep = () => {
        if (activeStep > 1) setActiveStep(activeStep - 1);
    };

    const updateSectionData = (path, value) => {
        const keys = path.split('.');
        const newData = { ...data.section_data };

        let current = newData;
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        setData('section_data', newData);
    };

    const handleSubmitForm = (e) => {
        e.preventDefault();

        if (formToEdit) {
            post(route('audit-forms.update', formToEdit.id), {
                onSuccess: () => onSaveSuccess(),
            });
        } else {
            post(route('audit-forms.store'), {
                onSuccess: () => onSaveSuccess(),
            });
        }
    };

    return (
        <div className="glass-panel p-6 rounded-2xl max-w-6xl mx-auto my-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-neutral-200 pb-4 mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {formToEdit ? 'Edit Form (A10)' : 'Buat Form (A10) Baru'}
                    </h2>
                    <p className="text-neutral-500 text-xs mt-1">Formulir alur penerimaan dan keberlanjutan hubungan dengan klien</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    {!formToEdit && (
                        <div className="relative">
                            <label className="btn-glow-indigo text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {parsingOds ? 'Memproses ODS...' : 'Prefill dari a10.ods'}
                                <input type="file" accept=".ods" onChange={handleOdsUpload} className="hidden" />
                            </label>
                        </div>
                    )}
                    <button onClick={onClose} className="px-4 py-2.5 border border-neutral-200 text-neutral-600 hover:text-[#1d1d1f] rounded-xl hover:bg-neutral-50 transition text-xs font-semibold">
                        Tutup
                    </button>
                </div>
            </div>

            {parseError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm mb-4">
                    {parseError}
                </div>
            )}

            {/* Stepper Header */}
            <div className="flex justify-between items-center mb-8 bg-neutral-100/60 p-4 rounded-xl border border-neutral-200/60 overflow-x-auto whitespace-nowrap">
                {steps.map((step) => (
                    <div key={step.id} className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveStep(step.id)}>
                        <div className={`stepper-circle ${activeStep === step.id ? 'active' : activeStep > step.id ? 'completed' : 'upcoming'}`}>
                            {activeStep > step.id ? '✓' : step.id}
                        </div>
                        <span className={`text-xs font-semibold ${activeStep === step.id ? 'text-[#0071e3]' : 'text-neutral-500'}`}>
                            {step.title}
                        </span>
                        {step.id < 6 && <div className="w-8 h-[1px] bg-neutral-200 hidden md:block" />}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-6">
                {/* Step 1: Info Klien & SA 210 */}
                {activeStep === 1 && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-neutral-800">Informasi Klien</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs text-neutral-500 font-semibold mb-1">NAMA KLIEN</label>
                                <input
                                    type="text"
                                    value={data.client_name}
                                    onChange={(e) => setData('client_name', e.target.value)}
                                    className="w-full custom-input p-3 text-sm"
                                    placeholder="Contoh: PT EASTPARC HOTEL TBK"
                                    required
                                />
                                {errors.client_name && <span className="text-red-500 text-xs font-semibold">{errors.client_name}</span>}
                            </div>
                            <div>
                                <label className="block text-xs text-neutral-500 font-semibold mb-1">TAHUN BUKU</label>
                                <input
                                    type="text"
                                    value={data.book_year}
                                    onChange={(e) => setData('book_year', e.target.value)}
                                    className="w-full custom-input p-3 text-sm"
                                    placeholder="Contoh: 31 Desember 2024"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-neutral-500 font-semibold mb-1">SKEDUL</label>
                                <input
                                    type="text"
                                    value={data.schedule}
                                    onChange={(e) => setData('schedule', e.target.value)}
                                    className="w-full custom-input p-3 text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="border-t border-neutral-200 pt-6">
                            <h3 className="text-lg font-semibold text-[#0071e3] mb-4">I. CAKUPAN PEMAHAMAN STANDAR AUDITING (SA 210)</h3>

                            {/* Desktop Table - Hidden on Mobile */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-200 text-xs text-neutral-500">
                                            <th className="py-3 px-2 w-12">NO</th>
                                            <th className="py-3 px-2">CAKUPAN PEMAHAMAN</th>
                                            <th className="py-3 px-2 w-40">TANGGAL PEMBAHASAN</th>
                                            <th className="py-3 px-2 w-28">INISIAL</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 text-sm text-neutral-700">
                                        {data.section_data.section_1.map((item, index) => (
                                            <tr key={index} className="hover:bg-neutral-50">
                                                <td className="py-3 px-2 text-neutral-400">{item.no}</td>
                                                <td className="py-3 px-2 text-neutral-800">{item.description}</td>
                                                <td className="py-2 px-2">
                                                    <input
                                                        type="text"
                                                        value={item.date || ''}
                                                        onChange={(e) => {
                                                            const newSec1 = [...data.section_data.section_1];
                                                            newSec1[index].date = e.target.value;
                                                            updateSectionData('section_1', newSec1);
                                                        }}
                                                        className="w-full custom-input py-1 px-2 text-xs"
                                                        placeholder="YYYY-MM-DD"
                                                    />
                                                </td>
                                                <td className="py-2 px-2">
                                                    <input
                                                        type="text"
                                                        value={item.initial || ''}
                                                        onChange={(e) => {
                                                            const newSec1 = [...data.section_data.section_1];
                                                            newSec1[index].initial = e.target.value;
                                                            updateSectionData('section_1', newSec1);
                                                        }}
                                                        className="w-full custom-input py-1 px-2 text-xs uppercase"
                                                        placeholder="Initials"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card List - Hidden on Desktop */}
                            <div className="block md:hidden space-y-4">
                                {data.section_data.section_1.map((item, index) => (
                                    <div key={index} className="bg-white p-4 rounded-xl border border-neutral-200/80 space-y-3 shadow-sm">
                                        <div className="flex items-start gap-2">
                                            <span className="text-xs text-neutral-400 font-semibold bg-neutral-100 w-5 h-5 rounded-full flex items-center justify-center shrink-0">{item.no}</span>
                                            <p className="text-xs text-neutral-700 font-medium leading-relaxed">{item.description}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
                                            <div>
                                                <label className="block text-[10px] text-neutral-400 font-semibold uppercase mb-1">Tanggal</label>
                                                <input
                                                    type="text"
                                                    value={item.date || ''}
                                                    onChange={(e) => {
                                                        const newSec1 = [...data.section_data.section_1];
                                                        newSec1[index].date = e.target.value;
                                                        updateSectionData('section_1', newSec1);
                                                    }}
                                                    className="w-full custom-input py-2 px-2.5 text-xs"
                                                    placeholder="YYYY-MM-DD"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-neutral-400 font-semibold uppercase mb-1">Inisial</label>
                                                <input
                                                    type="text"
                                                    value={item.initial || ''}
                                                    onChange={(e) => {
                                                        const newSec1 = [...data.section_data.section_1];
                                                        newSec1[index].initial = e.target.value;
                                                        updateSectionData('section_1', newSec1);
                                                    }}
                                                    className="w-full custom-input py-2 px-2.5 text-xs uppercase"
                                                    placeholder="Initials"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Latar Belakang & Bisnis */}
                {activeStep === 2 && (() => {
                    const relatedParties = data.section_data.section_2_b?.related_parties || [];
                    const filledRelatedParties = [...relatedParties];
                    while (filledRelatedParties.length < 5) {
                        filledRelatedParties.push({ no: filledRelatedParties.length + 1, nama: '', hubungan: '', sifat_transaksi: '' });
                    }
                    return (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-[#1d1d1f] mb-2">1. Latar Belakang dan Bisnis Klien</h3>
                                <label className="block text-xs text-neutral-500 font-semibold mb-1">Ringkasan Bisnis Klien</label>
                                <textarea
                                    value={data.section_data.section_2_a.description}
                                    onChange={(e) => updateSectionData('section_2_a.description', e.target.value)}
                                    className="w-full custom-input p-3 text-sm h-32"
                                    placeholder="Jelaskan secara singkat bisnis klien (bidang usaha, tahun berdiri, entitas anak, total aset, dll)..."
                                />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-[#1d1d1f] mb-2">2. Jumlah pemilik (perkiraan):</h3>
                                <label className="block text-xs text-neutral-500 font-semibold mb-1">Ringkasan Bisnis Klien</label>
                                <textarea
                                    value={data.section_data.section_2_a.description}
                                    onChange={(e) => updateSectionData('section_2_a.description', e.target.value)}
                                    className="w-full custom-input p-3 text-sm h-32"
                                    placeholder="Jelaskan secara singkat bisnis klien (bidang usaha, tahun berdiri, entitas anak, total aset, dll)..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">Alamat Kantor / Operasional</label>
                                    <input
                                        type="text"
                                        value={data.section_data.section_2_a.address}
                                        onChange={(e) => updateSectionData('section_2_a.address', e.target.value)}
                                        className="w-full custom-input p-3 text-sm"
                                        placeholder="Contoh: Laksda Adisucipto KM. 6.5 Yogyakarta"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">Sumber Pendapatan & Metode Pemasaran</label>
                                    <input
                                        type="text"
                                        value={data.section_data.section_2_a.revenue_sources}
                                        onChange={(e) => updateSectionData('section_2_a.revenue_sources', e.target.value)}
                                        className="w-full custom-input p-3 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-neutral-200 pt-6">
                                <div>
                                    <h4 className="text-sm font-semibold text-[#0071e3] mb-2">Dewan Komisaris</h4>
                                    {data.section_data.section_2_a.dewan_komisaris.map((kom, i) => (
                                        <div key={i} className="flex flex-col sm:flex-row gap-1 sm:gap-2 mb-3 sm:mb-2 sm:items-center">
                                            <span className="text-xs text-neutral-500 sm:w-32">{kom.jabatan}</span>
                                            <input
                                                type="text"
                                                value={kom.nama_2024}
                                                onChange={(e) => {
                                                    const list = [...data.section_data.section_2_a.dewan_komisaris];
                                                    list[i].nama_2024 = e.target.value;
                                                    updateSectionData('section_2_a.dewan_komisaris', list);
                                                }}
                                                className="custom-input p-2 text-xs flex-1 w-full"
                                                placeholder="Nama (Tahun 2024)"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-[#0071e3] mb-2">Dewan Direksi</h4>
                                    {data.section_data.section_2_a.dewan_direksi.map((dir, i) => (
                                        <div key={i} className="flex flex-col sm:flex-row gap-1 sm:gap-2 mb-3 sm:mb-2 sm:items-center">
                                            <span className="text-xs text-neutral-500 sm:w-32">{dir.jabatan}</span>
                                            <input
                                                type="text"
                                                value={dir.nama_2024}
                                                onChange={(e) => {
                                                    const list = [...data.section_data.section_2_a.dewan_direksi];
                                                    list[i].nama_2024 = e.target.value;
                                                    updateSectionData('section_2_a.dewan_direksi', list);
                                                }}
                                                className="custom-input p-2 text-xs flex-1 w-full"
                                                placeholder="Nama (Tahun 2024)"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-neutral-200 pt-6">
                                <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">II. d. Auditor Pendahulu</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs text-neutral-500 font-semibold mb-1">Nama KAP</label>
                                        <input
                                            type="text"
                                            value={data.section_data.section_2_d.nama_kap}
                                            onChange={(e) => updateSectionData('section_2_d.nama_kap', e.target.value)}
                                            className="w-full custom-input p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-500 font-semibold mb-1">Nama AP</label>
                                        <input
                                            type="text"
                                            value={data.section_data.section_2_d.nama_ap}
                                            onChange={(e) => updateSectionData('section_2_d.nama_ap', e.target.value)}
                                            className="w-full custom-input p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-500 font-semibold mb-1">Alamat KAP</label>
                                        <input
                                            type="text"
                                            value={data.section_data.section_2_d.alamat}
                                            onChange={(e) => updateSectionData('section_2_d.alamat', e.target.value)}
                                            className="w-full custom-input p-2 text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="block text-xs text-neutral-500 font-semibold mb-1">Alasan Penggantian</label>
                                        <input
                                            type="text"
                                            value={data.section_data.section_2_d.alasan_penggantian}
                                            onChange={(e) => updateSectionData('section_2_d.alasan_penggantian', e.target.value)}
                                            className="w-full custom-input p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-500 font-semibold mb-1">Kemungkinan Bantuan</label>
                                        <input
                                            type="text"
                                            value={data.section_data.section_2_d.bantuan_pendahulu}
                                            onChange={(e) => updateSectionData('section_2_d.bantuan_pendahulu', e.target.value)}
                                            className="w-full custom-input p-2 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2.b: Hubungan Istimewa dan Anak Perusahaan */}
                            <div className="border-t border-neutral-200 pt-6">
                                <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">II. b. Hubungan Istimewa dan Anak Perusahaan</h3>
                                <div className="mb-4">
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">Apakah Klien Memiliki Anak Perusahaan / Hubungan Istimewa?</label>
                                    <select
                                        value={data.section_data.section_2_b?.has_subsidiary || 'Tidak'}
                                        onChange={(e) => updateSectionData('section_2_b.has_subsidiary', e.target.value)}
                                        className="custom-input p-2.5 text-xs w-full sm:w-48"
                                    >
                                        <option value="Ya">Ya</option>
                                        <option value="Tidak">Tidak</option>
                                    </select>
                                </div>

                                {data.section_data.section_2_b?.has_subsidiary === 'Ya' && (
                                    <div className="space-y-3 animate-fade-in-up">
                                        <label className="block text-xs text-neutral-500 font-semibold">Daftar Pihak yang Mempunyai Hubungan Istimewa (Maksimal 5)</label>
                                        <div className="overflow-x-auto border border-neutral-200 rounded-xl bg-neutral-50/50 p-2">
                                            <table className="w-full text-left text-xs border-collapse">
                                                <thead>
                                                    <tr className="border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                                                        <th className="py-2 px-3 w-12 text-center">No</th>
                                                        <th className="py-2 px-3">Nama Pihak</th>
                                                        <th className="py-2 px-3">Hubungan</th>
                                                        <th className="py-2 px-3">Sifat Transaksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-neutral-100 bg-white">
                                                    {filledRelatedParties.map((party, idx) => (
                                                        <tr key={idx} className="hover:bg-neutral-50/50">
                                                            <td className="py-2 px-3 text-center text-neutral-500 font-bold">{party.no}</td>
                                                            <td className="py-2 px-3">
                                                                <input
                                                                    type="text"
                                                                    value={party.nama || ''}
                                                                    onChange={(e) => {
                                                                        const newList = [...filledRelatedParties];
                                                                        newList[idx] = { ...newList[idx], nama: e.target.value };
                                                                        updateSectionData('section_2_b.related_parties', newList);
                                                                    }}
                                                                    className="w-full custom-input p-1.5 text-xs"
                                                                    placeholder="Nama Afiliasi / Pihak"
                                                                />
                                                            </td>
                                                            <td className="py-2 px-3">
                                                                <input
                                                                    type="text"
                                                                    value={party.hubungan || ''}
                                                                    onChange={(e) => {
                                                                        const newList = [...filledRelatedParties];
                                                                        newList[idx] = { ...newList[idx], hubungan: e.target.value };
                                                                        updateSectionData('section_2_b.related_parties', newList);
                                                                    }}
                                                                    className="w-full custom-input p-1.5 text-xs"
                                                                    placeholder="Misal: Induk Perusahaan, Afiliasi"
                                                                />
                                                            </td>
                                                            <td className="py-2 px-3">
                                                                <input
                                                                    type="text"
                                                                    value={party.sifat_transaksi || ''}
                                                                    onChange={(e) => {
                                                                        const newList = [...filledRelatedParties];
                                                                        newList[idx] = { ...newList[idx], sifat_transaksi: e.target.value };
                                                                        updateSectionData('section_2_b.related_parties', newList);
                                                                    }}
                                                                    className="w-full custom-input p-1.5 text-xs"
                                                                    placeholder="Misal: Jual Beli Jasa, Sewa"
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Section 2.g: Penggunaan Spesialis */}
                            <div className="border-t border-neutral-200 pt-6">
                                <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">II. g. Penggunaan Spesialis</h3>
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">Apakah KAP menggunakan spesialis independen dalam audit ini?</label>
                                    <textarea
                                        value={data.section_data.section_2_g || ''}
                                        onChange={(e) => updateSectionData('section_2_g', e.target.value)}
                                        className="w-full custom-input p-3 text-sm h-20"
                                        placeholder="Jelaskan penggunaan spesialis (misalnya: penilai independen untuk properti, aktuaris, dll). Tulis 'Tidak ada' jika tidak menggunakan."
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Step 3: Risiko & Going Concern */}
                {activeStep === 3 && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">II. e. Risiko Penugasan & Kelangsungan Hidup Klien</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">Tujuan Klien Membutuhkan Jasa Audit</label>
                                    <input
                                        type="text"
                                        value={data.section_data.section_2_e.tujuan_audit}
                                        onChange={(e) => updateSectionData('section_2_e.tujuan_audit', e.target.value)}
                                        className="w-full custom-input p-3 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">Memiliki Satuan Pengawas Intern (SPI)?</label>
                                    <select
                                        value={data.section_data.section_2_e.has_internal_audit}
                                        onChange={(e) => updateSectionData('section_2_e.has_internal_audit', e.target.value)}
                                        className="w-full custom-input p-3 text-sm"
                                    >
                                        <option value="Ya">Ya</option>
                                        <option value="Tidak">Tidak</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-neutral-200 pt-6">
                            <h4 className="text-md font-semibold text-[#1d1d1f] mb-3">Indikator Going Concern (Kelangsungan Hidup)</h4>
                            <div className="space-y-4">
                                {data.section_data.section_2_e.going_concern.map((item, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-col md:flex-row gap-4 items-start shadow-sm">
                                        <div className="text-xs text-neutral-400 w-8 shrink-0">{item.no}</div>
                                        <div className="text-sm text-neutral-800 flex-1 leading-relaxed">{item.description}</div>
                                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                                            <select
                                                value={item.value}
                                                onChange={(e) => {
                                                    const list = [...data.section_data.section_2_e.going_concern];
                                                    list[idx].value = e.target.value;
                                                    updateSectionData('section_2_e.going_concern', list);
                                                }}
                                                className="custom-input p-2 text-xs w-full sm:w-28 shrink-0"
                                            >
                                                <option value="Ya">Ya</option>
                                                <option value="Tidak">Tidak</option>
                                            </select>
                                            <input
                                                type="text"
                                                value={item.notes}
                                                onChange={(e) => {
                                                    const list = [...data.section_data.section_2_e.going_concern];
                                                    list[idx].notes = e.target.value;
                                                    updateSectionData('section_2_e.going_concern', list);
                                                }}
                                                className="custom-input p-2 text-xs w-full sm:w-64 flex-1"
                                                placeholder="Catatan / Penjelasan"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4">
                                <label className="block text-xs text-neutral-500 font-semibold mb-1">Kesimpulan Kelangsungan Hidup</label>
                                <input
                                    type="text"
                                    value={data.section_data.section_2_e.going_concern_conclusion}
                                    onChange={(e) => updateSectionData('section_2_e.going_concern_conclusion', e.target.value)}
                                    className="w-full custom-input p-3 text-sm"
                                    placeholder="Contoh: Kelangsungan hidup perusahaan minimal 12 bulan kedepan masih akan terjaga dengan baik."
                                />
                            </div>
                        </div>

                        {/* Section 2.f: Akuntansi & Pelaporan Keuangan */}
                        <div className="border-t border-neutral-200 pt-6">
                            <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">II. f. Akuntansi & Pelaporan Keuangan</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">Buku Pedoman Akuntansi / SOP</label>
                                    <textarea
                                        value={data.section_data.section_2_f?.buku_pedoman || ''}
                                        onChange={(e) => updateSectionData('section_2_f.buku_pedoman', e.target.value)}
                                        className="w-full custom-input p-3 text-sm h-20"
                                        placeholder="Uraikan ketersediaan buku pedoman atau SOP keuangan..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">Cara Pengolahan Data Akuntansi</label>
                                    <textarea
                                        value={data.section_data.section_2_f?.cara_mengolah_data || ''}
                                        onChange={(e) => updateSectionData('section_2_f.cara_mengolah_data', e.target.value)}
                                        className="w-full custom-input p-3 text-sm h-20"
                                        placeholder="Uraikan bagaimana data keuangan diolah (e.g. Accurate, Excel, Manual)..."
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-xs text-neutral-500 font-semibold mb-1">Siklus / Cycles Penjualan & Pembelian (cycles)</label>
                                <input
                                    type="text"
                                    value={data.section_data.section_2_f?.cycles || ''}
                                    onChange={(e) => updateSectionData('section_2_f.cycles', e.target.value)}
                                    className="w-full custom-input p-3 text-sm"
                                    placeholder="Contoh: Siklus Penjualan, Pembelian, Penggajian..."
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="block text-xs text-neutral-500 font-semibold">Kelayakan Audit (Auditable Questions)</label>
                                {(data.section_data.section_2_f?.auditable || []).map((item, idx) => (
                                    <div key={idx} className="bg-white p-3.5 rounded-xl border border-neutral-200 flex flex-col sm:flex-row gap-3 justify-between sm:items-center shadow-sm">
                                        <span className="text-xs text-neutral-700 font-semibold flex-1 leading-relaxed">{item.no} {item.description}</span>
                                        <select
                                            value={item.value || 'Ya'}
                                            onChange={(e) => {
                                                const list = [...data.section_data.section_2_f.auditable];
                                                list[idx].value = e.target.value;
                                                updateSectionData('section_2_f.auditable', list);
                                            }}
                                            className="custom-input p-2 text-xs w-full sm:w-28 shrink-0"
                                        >
                                            <option value="Ya">Ya</option>
                                            <option value="Tidak">Tidak</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Integritas Manajemen */}
                {activeStep === 4 && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-[#1d1d1f]">III. EVALUASI INTEGRITAS MANAJEMEN</h3>
                            <span className="text-xs text-neutral-600 bg-neutral-100 border border-neutral-200 px-3 py-1 rounded-full font-semibold">Evaluasi Kejujuran & Kompetensi</span>
                        </div>
                        <div className="space-y-4">
                            {data.section_data.section_3.questions.map((item, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-col md:flex-row gap-4 items-start shadow-sm">
                                    <div className="text-xs text-neutral-400 w-8 shrink-0">{item.no}</div>
                                    <div className="text-sm text-neutral-800 flex-1 leading-relaxed">{item.description}</div>
                                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                                        <select
                                            value={item.value}
                                            onChange={(e) => {
                                                const list = [...data.section_data.section_3.questions];
                                                list[idx].value = e.target.value;
                                                updateSectionData('section_3.questions', list);
                                            }}
                                            className="custom-input p-2 text-xs w-full sm:w-28 shrink-0"
                                        >
                                            <option value="Ya">Ya</option>
                                            <option value="Tidak">Tidak</option>
                                            <option value="N/A">N/A</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={item.notes}
                                            onChange={(e) => {
                                                const list = [...data.section_data.section_3.questions];
                                                list[idx].notes = e.target.value;
                                                updateSectionData('section_3.questions', list);
                                            }}
                                            className="custom-input p-2 text-xs w-full sm:w-64 flex-1"
                                            placeholder="Catatan / Penjelasan"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4">
                            <label className="block text-xs text-neutral-500 font-semibold mb-1">Kesimpulan Penilaian Integritas</label>
                            <input
                                type="text"
                                value={data.section_data.section_3.conclusion}
                                onChange={(e) => updateSectionData('section_3.conclusion', e.target.value)}
                                className="w-full custom-input p-3 text-sm"
                                placeholder="Contoh: Integritas manajemen sudah cukup memadai dalam menjalankan kegiatan usahanya."
                            />
                        </div>
                    </div>
                )}

                {/* Step 5: Independensi KAP */}
                {activeStep === 5 && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-[#1d1d1f]">IV. EVALUASI INDEPENDENSI KAP</h3>
                            <span className="text-xs text-neutral-600 bg-neutral-100 border border-neutral-200 px-3 py-1 rounded-full font-semibold">Kepatuhan Terhadap Kode Etik</span>
                        </div>
                        <div className="space-y-4">
                            {data.section_data.section_4.questions.map((item, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-col md:flex-row gap-4 items-start shadow-sm">
                                    <div className="text-xs text-neutral-400 w-8 shrink-0">{item.no}</div>
                                    <div className="text-sm text-neutral-800 flex-1 leading-relaxed">{item.description}</div>
                                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                                        <select
                                            value={item.value}
                                            onChange={(e) => {
                                                const list = [...data.section_data.section_4.questions];
                                                list[idx].value = e.target.value;
                                                updateSectionData('section_4.questions', list);
                                            }}
                                            className="custom-input p-2 text-xs w-full sm:w-28 shrink-0"
                                        >
                                            <option value="Ya">Ya</option>
                                            <option value="Tidak">Tidak</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={item.notes}
                                            onChange={(e) => {
                                                const list = [...data.section_data.section_4.questions];
                                                list[idx].notes = e.target.value;
                                                updateSectionData('section_4.questions', list);
                                            }}
                                            className="custom-input p-2 text-xs w-full sm:w-64 flex-1"
                                            placeholder="Catatan / Penjelasan"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4">
                            <label className="block text-xs text-neutral-500 font-semibold mb-1">Kesimpulan Penilaian Independensi</label>
                            <input
                                type="text"
                                value={data.section_data.section_4.conclusion}
                                onChange={(e) => updateSectionData('section_4.conclusion', e.target.value)}
                                className="w-full custom-input p-3 text-sm"
                            />
                        </div>
                    </div>
                )}

                {/* Step 6: Evaluasi Akhir & Kesimpulan */}
                {activeStep === 6 && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-[#1d1d1f]">KESIMPULAN EVALUASI PENERIMAAN / KEBERLANJUTAN KLIEN</h3>

                        {/* Section 2.h: Prakiraan Kontrak & Jadwal Pembayaran */}
                        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-[#0071e3] uppercase tracking-wider">II. h. Prakiraan Kontrak dan Jadwal Pembayaran</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">Prakiraan Nilai Kontrak</label>
                                    <input
                                        type="text"
                                        value={data.section_data.section_2_h?.nilai_kontrak || ''}
                                        onChange={(e) => updateSectionData('section_2_h.nilai_kontrak', e.target.value)}
                                        className="w-full custom-input p-3 text-sm"
                                        placeholder="Contoh: Rp90.000.000,00 (termasuk PPN)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">Tahap Pembayaran</label>
                                    <textarea
                                        value={data.section_data.section_2_h?.tahap_pembayaran || ''}
                                        onChange={(e) => updateSectionData('section_2_h.tahap_pembayaran', e.target.value)}
                                        className="w-full custom-input p-2.5 text-xs h-20"
                                        placeholder="Uraikan tahapan termin..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-xs text-neutral-500 font-semibold">Jadwal Pelunasan Fee Penugasan</label>
                                {(data.section_data.section_2_h?.jadwal_pelunasan || []).map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-neutral-50/50 p-3.5 rounded-xl border border-neutral-100">
                                        <div>
                                            <span className="text-[10px] text-neutral-400 block font-bold">TERMIN {item.no}</span>
                                            <span className="text-xs text-neutral-600 block mt-1 font-semibold">{item.keterangan}</span>
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-neutral-400 font-bold uppercase block mb-1">Bulan/Tanggal</label>
                                            <input
                                                type="text"
                                                value={item.tanggal || ''}
                                                onChange={(e) => {
                                                    const list = [...data.section_data.section_2_h.jadwal_pelunasan];
                                                    list[idx].tanggal = e.target.value;
                                                    updateSectionData('section_2_h.jadwal_pelunasan', list);
                                                }}
                                                className="w-full custom-input p-2 text-xs"
                                                placeholder="Misal: April"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-neutral-400 font-bold uppercase block mb-1">Persentase (%)</label>
                                            <input
                                                type="text"
                                                value={item.persen || ''}
                                                onChange={(e) => {
                                                    const list = [...data.section_data.section_2_h.jadwal_pelunasan];
                                                    list[idx].persen = e.target.value;
                                                    updateSectionData('section_2_h.jadwal_pelunasan', list);
                                                }}
                                                className="w-full custom-input p-2 text-xs"
                                                placeholder="Misal: 50%"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-neutral-400 font-bold uppercase block mb-1">Nominal Fee</label>
                                            <input
                                                type="text"
                                                value={item.nominal || ''}
                                                onChange={(e) => {
                                                    const list = [...data.section_data.section_2_h.jadwal_pelunasan];
                                                    list[idx].nominal = e.target.value;
                                                    updateSectionData('section_2_h.jadwal_pelunasan', list);
                                                }}
                                                className="w-full custom-input p-2 text-xs"
                                                placeholder="Misal: 45,000,000"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section 5: Bantuan Klien & Evaluasi Lain */}
                        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-[#0071e3] uppercase tracking-wider">V. Bantuan Klien & Evaluasi Lain</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">Staf Introduksi / Referensi Pihak Lain</label>
                                    <input
                                        type="text"
                                        value={data.section_data.section_5?.staf_introduksi || ''}
                                        onChange={(e) => updateSectionData('section_5.staf_introduksi', e.target.value)}
                                        className="w-full custom-input p-3 text-sm"
                                        placeholder="Nama staf introduksi..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs text-neutral-500 font-semibold">Referensi Klien (2 Referensi)</label>
                                    {[0, 1].map((idx) => (
                                        <input
                                            key={idx}
                                            type="text"
                                            value={data.section_data.section_5?.referensi[idx] || ''}
                                            onChange={(e) => {
                                                const list = [...data.section_data.section_5.referensi];
                                                list[idx] = e.target.value;
                                                updateSectionData('section_5.referensi', list);
                                            }}
                                            className="w-full custom-input p-2.5 text-xs"
                                            placeholder={`Referensi ${idx + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs text-neutral-500 font-semibold">Prosedur Evaluasi Tambahan (3 Prosedur)</label>
                                {[0, 1, 2].map((idx) => (
                                    <input
                                        key={idx}
                                        type="text"
                                        value={data.section_data.section_5?.prosedur_lain[idx] || ''}
                                        onChange={(e) => {
                                            const list = [...data.section_data.section_5.prosedur_lain];
                                            list[idx] = e.target.value;
                                            updateSectionData('section_5.prosedur_lain', list);
                                        }}
                                        className="w-full custom-input p-2.5 text-xs"
                                        placeholder={`Prosedur evaluasi tambahan ${idx + 1}`}
                                    />
                                ))}
                            </div>

                            <div className="space-y-3">
                                <label className="block text-xs text-neutral-500 font-semibold">Daftar Dokumen Bantuan Klien (Checklist)</label>
                                <div className="max-h-60 overflow-y-auto border border-neutral-200 rounded-xl divide-y divide-neutral-100 p-2 bg-neutral-50/50 space-y-2.5">
                                    {(data.section_data.section_5?.bantuan_klien || []).map((item, idx) => (
                                        <div key={idx} className="p-3 bg-white rounded-lg border border-neutral-100 flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
                                            <div className="flex-1 text-xs">
                                                <span className="text-[9px] text-neutral-400 font-bold block">DOKUMEN {item.no}</span>
                                                <span className="text-neutral-700 font-semibold leading-relaxed block mt-0.5">{item.description}</span>
                                            </div>
                                            <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                                                <select
                                                    value={item.value || 'Ya'}
                                                    onChange={(e) => {
                                                        const list = [...data.section_data.section_5.bantuan_klien];
                                                        list[idx].value = e.target.value;
                                                        updateSectionData('section_5.bantuan_klien', list);
                                                    }}
                                                    className="custom-input p-1.5 text-xs w-24 shrink-0"
                                                >
                                                    <option value="Ya">Ya</option>
                                                    <option value="Tidak">Tidak</option>
                                                </select>
                                                <input
                                                    type="text"
                                                    value={item.notes || ''}
                                                    onChange={(e) => {
                                                        const list = [...data.section_data.section_5.bantuan_klien];
                                                        list[idx].notes = e.target.value;
                                                        updateSectionData('section_5.bantuan_klien', list);
                                                    }}
                                                    className="custom-input p-1.5 text-xs flex-grow sm:w-40"
                                                    placeholder="Catatan sumber"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Section 6: Entitas Bisnis Kecil */}
                        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-[#0071e3] uppercase tracking-wider">VI. Kriteria Entitas Bisnis Kecil</h3>
                            <div className="space-y-3">
                                {(data.section_data.section_6?.questions || []).map((item, idx) => (
                                    <div key={idx} className="bg-neutral-50/50 p-3.5 rounded-xl border border-neutral-100 flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
                                        <span className="text-xs text-neutral-700 font-semibold flex-1 leading-relaxed">{item.no}. {item.description}</span>
                                        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                                            <select
                                                value={item.value || 'T'}
                                                onChange={(e) => {
                                                    const list = [...data.section_data.section_6.questions];
                                                    list[idx].value = e.target.value;
                                                    updateSectionData('section_6.questions', list);
                                                }}
                                                className="custom-input p-1.5 text-xs w-24"
                                            >
                                                <option value="Y">Ya (Y)</option>
                                                <option value="T">Tidak (T)</option>
                                                <option value="N/A">N/A</option>
                                            </select>
                                            <input
                                                type="text"
                                                value={item.notes || ''}
                                                onChange={(e) => {
                                                    const list = [...data.section_data.section_6.questions];
                                                    list[idx].notes = e.target.value;
                                                    updateSectionData('section_6.questions', list);
                                                }}
                                                className="custom-input p-1.5 text-xs flex-grow sm:w-40"
                                                placeholder="Catatan"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label className="block text-xs text-neutral-500 font-semibold mb-1">Kesimpulan Kriteria Bisnis Kecil</label>
                                <input
                                    type="text"
                                    value={data.section_data.section_6?.conclusion || ''}
                                    onChange={(e) => updateSectionData('section_6.conclusion', e.target.value)}
                                    className="w-full custom-input p-3 text-sm"
                                    placeholder="Uraikan kesimpulan kriteria bisnis kecil..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-50 p-6 rounded-xl border border-neutral-200">
                            <div>
                                <label className="block text-xs text-neutral-500 font-semibold mb-1">Integritas Manajemen</label>
                                <input
                                    type="text"
                                    value={data.section_data.section_b.integritas}
                                    onChange={(e) => updateSectionData('section_b.integritas', e.target.value)}
                                    className="w-full custom-input p-3 text-sm mb-4"
                                    placeholder="Contoh: Manajemen masih memiliki integritas yang tinggi..."
                                />

                                <label className="block text-xs text-neutral-500 font-semibold mb-1">Dapat Atau Tidaknya Calon Klien Diaudit</label>
                                <input
                                    type="text"
                                    value={data.section_data.section_b.auditable}
                                    onChange={(e) => updateSectionData('section_b.auditable', e.target.value)}
                                    className="w-full custom-input p-3 text-sm"
                                    placeholder="Contoh: Klien bisa di audit karena semua informasi..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-neutral-500 font-semibold mb-1">Independensi Kantor</label>
                                <input
                                    type="text"
                                    value={data.section_data.section_b.independensi}
                                    onChange={(e) => updateSectionData('section_b.independensi', e.target.value)}
                                    className="w-full custom-input p-3 text-sm mb-4"
                                    placeholder="Contoh: Kami yakin independensi dalam sikap dapat dilakukan..."
                                />

                                <label className="block text-xs text-neutral-500 font-semibold mb-1">Risiko Penugasan</label>
                                <input
                                    type="text"
                                    value={data.section_data.section_b.risiko}
                                    onChange={(e) => updateSectionData('section_b.risiko', e.target.value)}
                                    className="w-full custom-input p-3 text-sm"
                                    placeholder="Contoh: Risiko penugasan relatif tinggi..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            <div>
                                <label className="block text-xs text-neutral-500 font-semibold mb-2">TINGKAT RISIKO PENUGASAN</label>
                                <div className="flex gap-4">
                                    {['Tinggi', 'Sedang', 'Rendah'].map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => updateSectionData('section_b.level_risiko', r)}
                                            className={`px-4 py-2 rounded-lg text-xs font-semibold border flex-1 transition ${data.section_data.section_b.level_risiko === r
                                                ? 'bg-red-50 border-red-500 text-red-600 font-semibold'
                                                : 'border-neutral-200 bg-white text-neutral-600 hover:text-neutral-800'
                                                }`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-neutral-500 font-semibold mb-2">KEPUTUSAN PENERIMAAN PENUGASAN</label>
                                <div className="flex gap-4">
                                    {['Diterima', 'Tidak Diterima'].map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => updateSectionData('section_b.kesimpulan', c)}
                                            className={`px-4 py-2 rounded-lg text-xs font-semibold border flex-1 transition ${data.section_data.section_b.kesimpulan === c
                                                ? c === 'Diterima'
                                                    ? 'bg-green-50 border-green-500 text-green-600 font-semibold'
                                                    : 'bg-red-50 border-red-500 text-red-600 font-semibold'
                                                : 'border-neutral-200 bg-white text-neutral-600 hover:text-neutral-800'
                                                }`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-neutral-200 pt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="btn-glow-emerald text-sm font-semibold px-6 py-3 rounded-lg flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {processing ? 'Menyimpan...' : formToEdit ? 'Simpan Perubahan' : 'Simpan Draf Formulir'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer buttons */}
                <div className="flex justify-between border-t border-neutral-200 pt-4 mt-8">
                    <button
                        type="button"
                        onClick={prevStep}
                        disabled={activeStep === 1}
                        className="px-4 py-2 border border-neutral-200 bg-white text-xs text-neutral-600 rounded-lg hover:text-neutral-900 disabled:opacity-40 transition"
                    >
                        Sebelumnya
                    </button>
                    {activeStep < 6 && (
                        <button
                            type="button"
                            onClick={nextStep}
                            className="btn-glow-indigo text-xs font-semibold px-4 py-2 rounded-lg"
                        >
                            Berikutnya
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
