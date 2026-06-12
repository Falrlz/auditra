import React, { useState, useEffect } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import axios from 'axios';

export default function AuditFormWizard({ formToEdit, clientId, clientName, bookYear, schedule, materiality, onClose, onSaveSuccess }) {
    const { auth } = usePage().props;
    const user = auth.user;



    // Default initial data for A10 questionnaire sections
    const defaultSection1 = Array.from({ length: 15 }, (_, i) => ({
        no: i + 1,
        description: [
            "Tujuan audit adalah untuk menyatakan suatu pendapat atas laporan keuangan.",
            "Tanggung jawab manajemen adalah untuk: (1) Membangun dan mempertahankan pengendalian intern yang efektif untuk memastikan kehandalan laporan keuangan; (2) Mengidentifikasi dan menjamin bahwa entitas telah mematuhi peraturan perundangan yang berlaku dalam setiap aktivitasnya; (3) Membuat semua catatan keuangan dan informasi yang berkaitan tersedia bagi auditor; (4) Menyediakan suatu surat bagi auditor yang menegaskan representasi tertentu yang dibuat selama audit berlangsung.",
            "Tanggung jawab auditor untuk melaksanakan audit berdasarkan standar auditing yang ditetapkan IAPI",
            "Pengaturan mengenai pelaksanaan perikatan (sebagai contoh, waktu, bantuan klien berkaitan dengan pembuatan skedul dan penyediaan dokumen).",
            "Pengaturan tentang keikutsertaan spesialis atau auditor intern, jika diperlukan.",
            "Pengaturan tentang keikutsertaan auditor pendahulu.",
            "Pengaturan tentang fee dan penagihan.",
            "Adanya pembatasan atau pengaturan lain tentang kewajiban auditor atau klien, seperti ganti rugi kepada auditor untuk kewajiban yang timbul dari representasi salah yang dilakukan dengan sepengetahuan manajemen kepada auditor.",
            "Kondisi yang memungkinkan pihak lain diperbolehkan untuk melakukan akses ke kertas kerja auditor.",
            "Jasa tambahan yang disediakan oleh auditor berkaitan dengan pemenuhan persyaratan badan pengatur.",
            "Pengaturan tentang jasa lain yang harus disediakan oleh auditor dalam hubungannya dengan perikatan.",
            "Pengaturan tentang koordinasi dengan auditor lain dalam hal KAP melakukan audit terhadap laporan keuangan Group",
            "Penegasan bahwa pemeriksaan oleh KAP tidak meliputi pemeriksaan sebagaimana yang akan dilakukan oleh Direktorat Jenderal Pajak, sehingga pemeriksaan tersebut sebaiknya tidak dijadikan dasar untuk mendeteksi seluruh penyimpangan yang mungkin akan diketemukan oleh pemeriksa dari Direktur Jenderal Pajak.",
            "Penegasan bahwa klien tidak menugaskan auditor independen lain untuk melaksanakan audit untuk tahun buku yang sama.",
            "Penegasan bahwa klien bersedia untuk melaksanakan prosedur PMPJ yang akan dilakukan oleh KAP Sesuai Ketentuan"
        ][i],
        date: '',
        initial: ''
    }));

    const defaultPemilik = Array.from({ length: 3 }, (_, i) => ({
        no: i + 1,
        nama: '',
        saham_saham: '',
        saham_persen: '',
        jabatan: i === 0 ? 'Direktur Utama' : 'Tidak Menjabat'
    }));

    const defaultKomisaris = [
        { jabatan: 'Komisaris Utama', nama_2024: '', nama_2023: '' },
        { jabatan: 'Komisaris Independen', nama_2024: '', nama_2023: '' }
    ];

    const defaultDireksi = [
        { jabatan: 'Direktur Utama', nama_2024: '', nama_2023: '' },
        { jabatan: 'Direktur', nama_2024: '', nama_2023: '' },
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
        value: 'Ya',
        notes: ''
    }));

    const defaultJadwalFee = [
        { no: 1, tanggal: '', keterangan: 'Pembayaran termin I', persen: '', nominal: '' },
        { no: 2, tanggal: '', keterangan: 'Pembayaran termin II', persen: '', nominal: '' },
        { no: 3, tanggal: '', keterangan: 'Pembayaran termin III', persen: '', nominal: '' }
    ];


    const defaultIntegritas = Array.from({ length: 13 }, (_, i) => ({
        no: i + 1,
        description: [
            "Apakah klien mempunyai kebijakan tentang standar etika dan \"codes of conduct\", baik yang tertulis maupun yang dikomunikasikan dengan cara lain?",
            "Apakah standar etika dan \"codes of conduct\" telah dikomunikasikan dan dipraktikkan?",
            "Apakah pengetahuan dan pengalaman manajemen memadai untuk menjalankan usaha?",
            "Apakah pengendalian manajemen dan administratif cukup kuat?",
            "Apakah sistem informasi manajemen yang ada telah memadai dan diterapkan?",
            "Apakah terdapat perputaran (turn over) yang tinggi pada posisi-posisi kunci terutama pada fungsi keuangan dan akuntansi?",
            "Apakah perputaran tersebut mempunyai pengaruh negatif terhadap operasi klien?",
            "Apakah ada kondisi yang memungkinkan manajemen dalam posisi dapat melangkahi pengendalian yang ada?",
            "Apakah ada tekanan terhadap manajemen untuk memanipulasi hasil operasi (yaitu mengurangi pajak atau meningkatkan bonus)?",
            "Apakah ada potensi risiko terhadap penyajian laporan keuangan yang mungkin timbul karena usaha manajemen untuk merespon expektasi dan kebutuhan pihak-pihak yang berpengaruh yang tidak realistik, mengandung benturan kepentingan dan tidak sesuai dengan kebijakan perusahaan?",
            "Apakah pernah terjadi kesalahan dan kekeliruan yang material dalam laporan keuangan?",
            "Apakah pernah terjadi pelanggaran hukum and peraturan yang dilakukan klien atau pejabat klien?",
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
            "Apakah engagement partner atau staf KAP mempunyai hubungan famili (secara garis lurus satu tingkat) atau personal dengan klien dan karyawan kunci?",
            "Apakah fee profesional untuk jasa audit dan jasa lainnya yang dibayar oleh klien melampaui 10% total pendapatan kantor?",
            "Apakah fee profesional untuk jasa audit ini tergantung dari hasil penugasan?",
            "Apakah ada partner atau staf KAP menerima barang atau jasa dalam nilai yang relatif tinggi dengan persyaratan yang menguntungkan dari klien?",
            "Apakah partner atau staf KAP memberikan barang atau jasa dalam nilai yang relatif tinggi dengan persyaratan yang menguntungkan kepada klien?"
        ][i],
        value: 'Tidak',
        notes: ''
    }));

    const defaultBantuanKlien = [
        { no: 1, description: "Neraca percobaan (trial balance)", value: 'Ya', notes: 'Data sumber' },
        { no: 2, description: "General Ledger", value: 'Ya', notes: 'Data sumber' },
        { no: 3, description: "Laporan Keuangan Lengkap", value: 'Ya', notes: 'Data sumber' },
        { no: 4, description: "Akta Pendirian", value: 'Ya', notes: 'Data sumber' },
        { no: 5, description: "SOP dan Peraturan Internal Perusahaan", value: 'Ya', notes: 'Kritreia Penilaian' },
        { no: 6, description: "Rincian kas dan Perusahaan", value: 'Ya', notes: 'Data sumber' },
        { no: 7, description: "Rekonsiliasi setiap rekening Perusahaan", value: 'Ya', notes: 'Data sumber' },
        { no: 8, description: "Daftar Piutang", value: 'Ya', notes: 'Data sumber' },
        { no: 9, description: "Daftar Investasi", value: 'Ya', notes: 'Data sumber' },
        { no: 10, description: "Daftar saldo uang muka dan biaya dibayar di muka", value: 'Ya', notes: 'Data sumber' },
        { no: 11, description: "Daftar saldo persediaan, termasuk nilainya", value: 'Ya', notes: 'Data sumber' },
        { no: 12, description: "Daftar saldo surat-surat berharga yang mudah diperda- gangkan termasuk kustodiannya", value: 'Ya', notes: 'Data sumber' },
        { no: 13, description: "Daftar saldo investasi", value: 'Ya', notes: 'Data sumber' },
        { no: 14, description: "Daftar saldo aset tetap termasuk penambahan dan pengurangan pada tahun berjalan dan penyusutannya", value: 'Ya', notes: 'Data sumber' },
        { no: 15, description: "Daftar saldo utang usaha", value: 'Ya', notes: 'Data sumber' },
        { no: 16, description: "Daftar saldo utang bank, dan dokumen perjanjian utang", value: 'Ya', notes: 'Data sumber' },
        { no: 17, description: "Daftar Deposit Tamu", value: 'Ya', notes: 'Data sumber' },
        { no: 18, description: "Laporan Aktuaris Independen", value: 'Ya', notes: 'Data sumber' },
        { no: 21, description: "Daftar pemegang saham perubahannya dan Pembagian Dividen", value: 'Ya', notes: 'Data sumber' }
    ];

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

    const defaultSubsidiaryDetail = [
        { no: 1, nama: '', kepemilikan: '', jenis_usaha: '', alamat: '', total_aset: '', pendapatan: '', auditor: '' },
        { no: 2, nama: '', kepemilikan: '', jenis_usaha: '', alamat: '', total_aset: '', pendapatan: '', auditor: '' },
        { no: 3, nama: '', kepemilikan: '', jenis_usaha: '', alamat: '', total_aset: '', pendapatan: '', auditor: '' }
    ];

    const defaultRelatedParties = Array.from({ length: 3 }, (_, i) => ({
        no: i + 1,
        nama: '',
        hubungan: '',
        sifat_transaksi: ''
    }));

    // Form settings using Inertia helper
    const { data, setData, post, processing, errors } = useForm({
        client_id: formToEdit ? formToEdit.client_id : (clientId || ''),
        form_type: 'A10',
        client_name: formToEdit ? formToEdit.client_name : (clientName || ''),
        book_year: formToEdit ? formToEdit.book_year : (bookYear || ''),
        schedule: formToEdit ? formToEdit.schedule : (schedule || 'Pre-Engagement (Analisi Penerimaan Dan Keberlanjutan Hubungan Dengan Klien)'),
        section_data: formToEdit ? {
            section_1: formToEdit.section_data.section_1 || defaultSection1,
            section_2_a: {
                description: '',
                owner_count: '',
                pemilik: defaultPemilik,
                dewan_komisaris: defaultKomisaris,
                dewan_direksi: defaultDireksi,
                address: '',
                revenue_sources: '',
                economic_dependency: '',
                funding_sources: '',
                ...(formToEdit.section_data.section_2_a || {})
            },
            section_2_b: {
                has_subsidiary: 'Tidak',
                subsidiary_detail: defaultSubsidiaryDetail,
                related_parties: defaultRelatedParties,
                ...(formToEdit.section_data.section_2_b || {})
            },
            section_2_c: formToEdit.section_data.section_2_c || 'Jasa Audit Laporan keuangan tahun buku 2024',
            section_2_d: {
                nama_kap: '',
                nama_ap: '',
                alamat: '',
                alasan_penggantian: '',
                bantuan_pendahulu: '',
                ...(formToEdit.section_data.section_2_d || {})
            },
            section_2_e: {
                tujuan_audit: '',
                has_internal_audit: 'Tidak',
                kedudukan_internal_audit: '',
                peraturan_regulator: '',
                masalah_hukum: '',
                potensi_hukum: '',
                going_concern: defaultGoingConcern,
                going_concern_conclusion: '',
                ...(formToEdit.section_data.section_2_e || {})
            },
            section_2_f: {
                buku_pedoman: '',
                cara_mengolah_data: '',
                auditable: defaultAuditable,
                masalah_kinerja_pajak: '',
                cycles: '',
                ...(formToEdit.section_data.section_2_f || {})
            },
            section_2_g: formToEdit.section_data.section_2_g || 'Tidak ada',
            section_2_h: {
                nilai_kontrak: '',
                alasan_dibawah_standar: '',
                tahap_pembayaran: '',
                jadwal_pelunasan: defaultJadwalFee,
                ...(formToEdit.section_data.section_2_h || {})
            },
            section_3: {
                questions: defaultIntegritas,
                conclusion: '',
                ...(formToEdit.section_data.section_3 || {})
            },
            section_4: {
                questions: defaultIndependensi,
                conclusion: '',
                ...(formToEdit.section_data.section_4 || {})
            },
            section_5: {
                staf_introduksi: '',
                referensi: Array(6).fill(''),
                prosedur_lain: Array(3).fill(''),
                bantuan_klien: defaultBantuanKlien,
                ...(formToEdit.section_data.section_5 || {})
            },
            section_6: {
                questions: defaultSmallBusiness,
                conclusion: 'Tidak termasuk Kategori entitas dengan bisnis kecil untuk tujuan audit',
                ...(formToEdit.section_data.section_6 || {})
            },
            section_b: {
                integritas: '',
                independensi: '',
                auditable: '',
                risiko: '',
                kesimpulan: 'Diterima',
                level_risiko: 'Tinggi',
                ...(formToEdit.section_data.section_b || {})
            }
        } : {
            section_1: defaultSection1,
            section_2_a: {
                description: '',
                owner_count: '',
                pemilik: defaultPemilik,
                dewan_komisaris: defaultKomisaris,
                dewan_direksi: defaultDireksi,
                address: '',
                revenue_sources: '',
                economic_dependency: '',
                funding_sources: '',
            },
            section_2_b: {
                has_subsidiary: 'Tidak',
                subsidiary_detail: defaultSubsidiaryDetail,
                related_parties: defaultRelatedParties,
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
                peraturan_regulator: '',
                masalah_hukum: '',
                potensi_hukum: '',
                going_concern: defaultGoingConcern,
                going_concern_conclusion: '',
            },
            section_2_f: {
                buku_pedoman: '',
                cara_mengolah_data: '',
                auditable: defaultAuditable,
                masalah_kinerja_pajak: '',
                cycles: '',
            },
            section_2_g: 'Tidak ada',
            section_2_h: {
                nilai_kontrak: '',
                alasan_dibawah_standar: '',
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
                referensi: Array(6).fill(''),
                prosedur_lain: Array(3).fill(''),
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



    const [newlyAddedOwnerIdx, setNewlyAddedOwnerIdx] = useState(null);
    const [newlyAddedSubsidiaryIdx, setNewlyAddedSubsidiaryIdx] = useState(null);
    const [newlyAddedPartyIdx, setNewlyAddedPartyIdx] = useState(null);
    const [newlyAddedFeeIdx, setNewlyAddedFeeIdx] = useState(null);

    useEffect(() => {
        if (newlyAddedOwnerIdx !== null) {
            const el = document.getElementById(`owner-nama-${newlyAddedOwnerIdx}`);
            if (el) el.focus();
            setNewlyAddedOwnerIdx(null);
        }
    }, [newlyAddedOwnerIdx]);

    useEffect(() => {
        if (newlyAddedSubsidiaryIdx !== null) {
            const el = document.getElementById(`sub-nama-${newlyAddedSubsidiaryIdx}`);
            if (el) el.focus();
            setNewlyAddedSubsidiaryIdx(null);
        }
    }, [newlyAddedSubsidiaryIdx]);

    useEffect(() => {
        if (newlyAddedPartyIdx !== null) {
            const el = document.getElementById(`party-nama-${newlyAddedPartyIdx}`);
            if (el) el.focus();
            setNewlyAddedPartyIdx(null);
        }
    }, [newlyAddedPartyIdx]);

    useEffect(() => {
        if (newlyAddedFeeIdx !== null) {
            const el = document.getElementById(`fee-tanggal-${newlyAddedFeeIdx}`);
            if (el) el.focus();
            setNewlyAddedFeeIdx(null);
        }
    }, [newlyAddedFeeIdx]);



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

    const handleNilaiKontrakChange = (val) => {
        const contractVal = Number(String(val).replace(/[^0-9]/g, ''));
        const list = (data.section_data.section_2_h.jadwal_pelunasan || defaultJadwalFee).map(item => {
            const percentVal = parseFloat(String(item.persen || '').replace(/[^0-9.]/g, ''));
            let calculatedNominal = item.nominal;
            if (!isNaN(contractVal) && !isNaN(percentVal)) {
                calculatedNominal = Math.round((contractVal * percentVal) / 100);
            }
            return { ...item, nominal: calculatedNominal };
        });

        setData('section_data', {
            ...data.section_data,
            section_2_h: {
                ...data.section_data.section_2_h,
                nilai_kontrak: val,
                jadwal_pelunasan: list
            }
        });
    };

    const handleFeePersenChange = (idx, newPersen) => {
        const list = [...(data.section_data.section_2_h.jadwal_pelunasan || defaultJadwalFee)];
        list[idx].persen = newPersen;

        const contractVal = Number(String(data.section_data.section_2_h?.nilai_kontrak || '').replace(/[^0-9]/g, ''));
        const percentVal = parseFloat(String(newPersen).replace(/[^0-9.]/g, ''));
        if (!isNaN(contractVal) && !isNaN(percentVal)) {
            list[idx].nominal = Math.round((contractVal * percentVal) / 100);
        }
        updateSectionData('section_2_h.jadwal_pelunasan', list);
    };

    const handleAddOwner = () => {
        const owners = [...(data.section_data.section_2_a.pemilik || [])];
        const newIndex = owners.length;
        owners.push({
            no: newIndex + 1,
            nama: '',
            saham_saham: '',
            saham_persen: '',
            jabatan: 'Tidak Menjabat'
        });
        updateSectionData('section_2_a.pemilik', owners);
        setNewlyAddedOwnerIdx(newIndex);
    };

    const handleRemoveOwner = (index) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus baris pemilik ini?")) {
            const owners = (data.section_data.section_2_a.pemilik || [])
                .filter((_, idx) => idx !== index)
                .map((item, idx) => ({ ...item, no: idx + 1 }));
            updateSectionData('section_2_a.pemilik', owners);
        }
    };

    const handleAddSubsidiary = () => {
        const subs = [...(data.section_data.section_2_b.subsidiary_detail || [])];
        const newIndex = subs.length;
        subs.push({
            no: newIndex + 1,
            nama: '',
            kepemilikan: '',
            jenis_usaha: '',
            alamat: '',
            total_aset: '',
            pendapatan: '',
            auditor: ''
        });
        updateSectionData('section_2_b.subsidiary_detail', subs);
        setNewlyAddedSubsidiaryIdx(newIndex);
    };

    const handleRemoveSubsidiary = (index) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus baris anak perusahaan ini?")) {
            const subs = (data.section_data.section_2_b.subsidiary_detail || [])
                .filter((_, idx) => idx !== index)
                .map((item, idx) => ({ ...item, no: idx + 1 }));
            updateSectionData('section_2_b.subsidiary_detail', subs);
        }
    };

    const handleAddRelatedParty = () => {
        const parties = [...(data.section_data.section_2_b.related_parties || [])];
        const newIndex = parties.length;
        parties.push({
            no: newIndex + 1,
            nama: '',
            hubungan: '',
            sifat_transaksi: ''
        });
        updateSectionData('section_2_b.related_parties', parties);
        setNewlyAddedPartyIdx(newIndex);
    };

    const handleRemoveRelatedParty = (index) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus baris hubungan istimewa ini?")) {
            const parties = (data.section_data.section_2_b.related_parties || [])
                .filter((_, idx) => idx !== index)
                .map((item, idx) => ({ ...item, no: idx + 1 }));
            updateSectionData('section_2_b.related_parties', parties);
        }
    };

    const handleAddFeeRow = () => {
        const fees = [...(data.section_data.section_2_h.jadwal_pelunasan || [])];
        const newIndex = fees.length;
        fees.push({
            no: newIndex + 1,
            tanggal: '',
            keterangan: `Pembayaran termin ${newIndex + 1}`,
            persen: '',
            nominal: ''
        });
        updateSectionData('section_2_h.jadwal_pelunasan', fees);
        setNewlyAddedFeeIdx(newIndex);
    };

    const handleRemoveFeeRow = (index) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus baris jadwal pembayaran fee ini?")) {
            const fees = (data.section_data.section_2_h.jadwal_pelunasan || [])
                .filter((_, idx) => idx !== index)
                .map((item, idx) => ({ ...item, no: idx + 1 }));
            updateSectionData('section_2_h.jadwal_pelunasan', fees);
        }
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

    const calculateTotalShares = () => {
        const owners = data.section_data.section_2_a.pemilik || [];
        return owners.reduce((sum, item) => {
            const val = Number(String(item.saham_saham || '').replace(/[^0-9]/g, ''));
            return sum + (isNaN(val) ? 0 : val);
        }, 0);
    };

    const calculateTotalPercent = () => {
        const owners = data.section_data.section_2_a.pemilik || [];
        return owners.reduce((sum, item) => {
            const val = parseFloat(String(item.saham_persen || '').replace(/[^0-9.]/g, ''));
            return sum + (isNaN(val) ? 0 : val);
        }, 0);
    };

    const calculateTotalFeePercent = () => {
        const fees = data.section_data.section_2_h.jadwal_pelunasan || [];
        return fees.reduce((sum, item) => {
            const val = parseFloat(String(item.persen || '').replace(/[^0-9.]/g, ''));
            return sum + (isNaN(val) ? 0 : val);
        }, 0);
    };

    const calculateTotalFeeNominal = () => {
        const fees = data.section_data.section_2_h.jadwal_pelunasan || [];
        return fees.reduce((sum, item) => {
            const val = Number(String(item.nominal || '').replace(/[^0-9]/g, ''));
            return sum + (isNaN(val) ? 0 : val);
        }, 0);
    };

    const formatCurrency = (val) => {
        if (!val && val !== 0) return '-';
        return 'Rp ' + Number(val).toLocaleString('id-ID');
    };

    return (
        <div className="bg-[#f5f5f7] p-6 rounded-2xl max-w-7xl mx-auto my-6 space-y-6 shadow-sm border border-neutral-200">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-neutral-200 pb-4 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-neutral-800">
                        {formToEdit ? 'Edit Laporan (A10)' : 'Isi Laporan (A10) Baru'}
                    </h2>
                    <p className="text-xs text-neutral-400 font-medium">Formulir alur penerimaan dan keberlanjutan hubungan dengan klien</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">

                    <button onClick={onClose} type="button" className="px-4 py-2 border border-neutral-300 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-50 transition-all duration-150 active:scale-[0.98] text-xs font-semibold bg-white shadow-2xs">
                        Tutup
                    </button>
                </div>
            </div>

            {/* HEADER METADATA & OTORISASI */}
            <div className="border border-neutral-300 p-6 bg-white shadow-2xs rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* Client info on left */}
                <div className="space-y-1 text-xs text-neutral-700">
                    <div className="grid grid-cols-[80px_10px_1fr] gap-x-1">
                        <span className="font-semibold text-neutral-500">Nama Klien</span>
                        <span>:</span>
                        <span className="font-bold text-neutral-800">{clientName || data.client_name || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[80px_10px_1fr] gap-x-1">
                        <span className="font-semibold text-neutral-500">Tahun Buku</span>
                        <span>:</span>
                        <span className="font-bold text-neutral-800">{bookYear || data.book_year || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[80px_10px_1fr] gap-x-1">
                        <span className="font-semibold text-neutral-500">Skedul</span>
                        <span>:</span>
                        <span className="font-bold text-neutral-800">{schedule || data.schedule || 'A10'}</span>
                    </div>
                </div>

                {/* Otorisasi on right */}
                <div className="w-full md:w-auto overflow-x-auto">
                    <table className="border-collapse border border-neutral-300 text-xs text-left w-full md:w-80">
                        <thead>
                            <tr className="bg-neutral-50 text-neutral-500 font-bold border-b border-neutral-300">
                                <th className="py-1.5 px-3 border-r border-neutral-300">Deskripsi</th>
                                <th className="py-1.5 px-3 border-r border-neutral-300 w-24">Tanggal</th>
                                <th className="py-1.5 px-3 w-16">Inisial</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 text-neutral-700 bg-white">
                            <tr>
                                <td className="py-1.5 px-3 border-r border-neutral-300 font-semibold">Disiapkan Oleh</td>
                                <td className="py-1.5 px-3 border-r border-neutral-300">{formToEdit?.created_at ? new Date(formToEdit.created_at).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID')}</td>
                                <td className="py-1.5 px-3 uppercase font-bold text-[#0071e3]">{formToEdit?.preparer?.inisial || user?.inisial || '-'}</td>
                            </tr>
                            <tr>
                                <td className="py-1.5 px-3 border-r border-neutral-300 font-semibold">Direview Oleh</td>
                                <td className="py-1.5 px-3 border-r border-neutral-300">{formToEdit?.reviewed_at ? new Date(formToEdit.reviewed_at).toLocaleDateString('id-ID') : '-'}</td>
                                <td className="py-1.5 px-3 uppercase font-bold text-neutral-600">{formToEdit?.reviewer?.inisial || '-'}</td>
                            </tr>
                            <tr>
                                <td className="py-1.5 px-3 border-r border-neutral-300 font-semibold">Disetujui Oleh</td>
                                <td className="py-1.5 px-3 border-r border-neutral-300">{formToEdit?.approved_at ? new Date(formToEdit.approved_at).toLocaleDateString('id-ID') : '-'}</td>
                                <td className="py-1.5 px-3 uppercase font-bold text-neutral-600">{formToEdit?.approver?.inisial || '-'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PETUNJUK BOX */}
            <div className="border border-green-200 bg-green-50/20 p-5 rounded-xl">
                <h4 className="text-xs font-bold text-red-650 mb-2 uppercase tracking-wider">Petunjuk:</h4>
                <ol className="list-decimal pl-5 text-xs text-neutral-600 space-y-1.5 font-medium leading-relaxed">
                    <li>Formulir ini digunakan untuk melaksanakan survei pendahuluan. Ada dua kegiatan utama dalam survei pendahuluan, yaitu melakukan pemahaman dengan calon klien dan mendapatkan data yang berkenaan dengan calon klien.</li>
                    <li>Pemahaman dengan calon klien dilakukan dengan membahas materi yang harus disepahamkan, yaitu yang terdapat pada bagian I formulir ini.</li>
                    <li>Sedangkan pemerolehan data calon klien bisa dilakukan dengan cara wawancara maupun penggunaan sumber-sumber informasi lainnya.</li>
                    <li>Formulir ini harus dilaksanakan oleh staf dengan pangkat Manager atau sesorang yang ditunjuk oleh Partner untuk seluruh prospek pekerjaan. Partner harus me-review data ini sebagai dasar untuk memutuskan menerima atau menolak calon klien. In-charge harus memutakhirkan dan me-review formulir ini setiap tahun selama tahap perencanaan dalam rangka menjaga pemahaman terhadap klien dan untuk mempertahankan atau menolak klien. Manager bertugas untuk mereview keakuratan dan kelengkapan data dalam formulir ini. Formulir ini harus di-review oleh Partner sebelum penugasan dimulai.</li>
                </ol>
            </div>



            <form onSubmit={handleSubmitForm} className="space-y-6">
                {/* Judul Utama */}
                <div className="bg-white p-6 rounded-xl border border-neutral-300 shadow-2xs text-center">
                    <h1 className="text-lg font-black text-neutral-800 uppercase tracking-wider">A. SURVEI PENDAHULUAN</h1>
                </div>

                {/* Section I (SA 210) */}
                <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-5">
                    <h3 className="text-base font-black text-neutral-800 border-b border-neutral-100 pb-2 uppercase tracking-wide">
                        I. Membangun Pemahaman Awal Dengan Calon Klien Atas Jasa Yang Diberikan
                    </h3>
                    <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
                        Standar Auditing (SA210) mewajibkan auditor untuk membangun pemahaman dengan (calon) klien tentang jasa yang akan dilaksanakan untuk setiap perikatan. Pemahaman dilakukan dengan cara berdiskusi dengan (calon) klien mengenai hal-hal tertentu yang nantinya akan dimasukkan ke dalam Surat Perikatan.
                    </p>
                    <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
                        Berikut ini hal-hal yang harus disepahamkan dengan klien:
                    </p>

                    <div className="overflow-x-auto border border-neutral-300 rounded-lg">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-neutral-200 text-neutral-700 font-bold uppercase tracking-wider text-[10px] text-center border-b border-neutral-300">
                                    <th rowSpan="2" className="py-2 px-3 border border-neutral-300 w-12 text-center">No</th>
                                    <th rowSpan="2" className="py-2 px-3 border border-neutral-300">Cakupan Pemahaman</th>
                                    <th colSpan="2" className="py-1 px-3 border border-neutral-300 text-center">Pembahasan</th>
                                </tr>
                                <tr className="bg-neutral-200 text-neutral-700 font-bold uppercase tracking-wider text-[10px] text-center border-b border-neutral-300">
                                    <th className="py-1.5 px-3 border border-neutral-300 w-44">Tanggal</th>
                                    <th className="py-1.5 px-3 border border-neutral-300 w-28">Inisial</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white text-neutral-700">
                                {data.section_data.section_1.map((item, index) => {
                                    // Row 3 to 7 (indexes 2 to 6) have merged Tanggal column vertically
                                    const isMergedRowStart = index === 2;
                                    const isMergedRowChild = index > 2 && index <= 6;

                                    return (
                                        <tr key={index} className="hover:bg-neutral-50/20">
                                            <td className="py-2 px-3 border border-neutral-300 text-center font-bold text-neutral-400">
                                                {item.no}
                                            </td>
                                            <td className="py-2 px-3 border border-neutral-300 leading-relaxed font-medium">
                                                {item.description}
                                            </td>
                                            {isMergedRowStart ? (
                                                <td rowSpan="5" className="py-2 px-3 border border-neutral-300 text-center align-middle bg-neutral-50/30">
                                                    <input
                                                        type="text"
                                                        value={item.date || ''}
                                                        onChange={(e) => {
                                                            const newSec1 = [...data.section_data.section_1];
                                                            // Update value for the merged block (indexes 2 s.d. 6)
                                                            for (let r = 2; r <= 6; r++) {
                                                                newSec1[r].date = e.target.value;
                                                            }
                                                            updateSectionData('section_1', newSec1);
                                                        }}
                                                        className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md py-1 px-2.5 text-xs text-center font-semibold text-neutral-850 bg-white transition-all duration-150"
                                                        placeholder="DD/MM/YYYY"
                                                    />
                                                </td>
                                            ) : isMergedRowChild ? null : (
                                                <td className="py-1.5 px-2 border border-neutral-300 text-center">
                                                    <input
                                                        type="text"
                                                        value={item.date || ''}
                                                        onChange={(e) => {
                                                            const newSec1 = [...data.section_data.section_1];
                                                            newSec1[index].date = e.target.value;
                                                            updateSectionData('section_1', newSec1);
                                                        }}
                                                        className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md py-1 px-2.5 text-xs text-center font-semibold text-neutral-850 bg-white transition-all duration-150"
                                                        placeholder="DD/MM/YYYY"
                                                    />
                                                </td>
                                            )}
                                            <td className="py-1.5 px-2 border border-neutral-300 text-center">
                                                <input
                                                    type="text"
                                                    value={item.initial || ''}
                                                    onChange={(e) => {
                                                        const newSec1 = [...data.section_data.section_1];
                                                        newSec1[index].initial = e.target.value;
                                                        updateSectionData('section_1', newSec1);
                                                    }}
                                                    className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md py-1 px-2.5 text-xs text-center font-bold uppercase bg-white transition-all duration-150"
                                                    placeholder="Inisial"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Section II: Data Klien */}
                <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-5">
                    <h3 className="text-base font-black text-neutral-800 border-b border-neutral-100 pb-2 uppercase tracking-wide">
                        II. Data Klien
                    </h3>

                    {/* Sub-section a */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-neutral-700 uppercase tracking-wide">
                            a. Latar Belakang dan Bisnis Klien
                        </h4>

                        <div className="space-y-2">
                            <label className="block text-xs text-neutral-500 font-semibold uppercase">
                                1. Jelaskan secara singkat bisnis klien (bidang usaha, tahun berdiri, entitas anak, total pendapatan dan aset dua tahun berturut-turut, dsb):
                            </label>
                            <textarea
                                value={data.section_data.section_2_a.description || ''}
                                onChange={(e) => updateSectionData('section_2_a.description', e.target.value)}
                                className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg p-3 text-xs h-28 bg-white transition-all duration-150"
                                placeholder="Tuliskan latar belakang bisnis..."
                            />
                        </div>

                        <div className="text-xs text-neutral-500 font-semibold uppercase">
                            2. Jumlah pemilik (perkiraan):
                        </div>

                        {/* Tabel Pemilik Utama */}
                        <div className="space-y-2 pt-2">
                            <label className="block text-xs text-neutral-500 font-semibold uppercase">
                                Daftar pemilik utama dan keaktifan dalam kepengurusan usaha:
                            </label>
                            <div className="overflow-x-auto border border-neutral-300 rounded-lg">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-neutral-200 text-neutral-700 font-bold uppercase tracking-wider text-[10px] text-center border-b border-neutral-300">
                                            <th rowSpan="2" className="py-2 px-3 border border-neutral-300 w-12 text-center">No</th>
                                            <th rowSpan="2" className="py-2 px-3 border border-neutral-300">Nama</th>
                                            <th colSpan="2" className="py-1 px-3 border border-neutral-300 text-center">Kepemilikan Saham</th>
                                            <th rowSpan="2" className="py-2 px-3 border border-neutral-300 w-56">Jabatan Dalam Perusahaan</th>
                                            <th rowSpan="2" className="py-2 px-2 border border-neutral-300 w-12"></th>
                                        </tr>
                                        <tr className="bg-neutral-200 text-neutral-700 font-bold uppercase tracking-wider text-[10px] text-center border-b border-neutral-300">
                                            <th className="py-1.5 px-3 border border-neutral-300 w-36">Lembar</th>
                                            <th className="py-1.5 px-3 border border-neutral-300 w-24">%</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white text-neutral-700">
                                        {(data.section_data.section_2_a.pemilik || []).map((owner, idx) => (
                                            <tr key={idx} className="hover:bg-neutral-50/20">
                                                <td className="py-1.5 px-3 border border-neutral-300 text-center font-bold text-neutral-400">
                                                    {owner.no}
                                                </td>
                                                <td className="py-1 px-2 border border-neutral-300">
                                                    <input
                                                        id={`owner-nama-${idx}`}
                                                        type="text"
                                                        value={owner.nama || ''}
                                                        onChange={(e) => {
                                                            const list = [...data.section_data.section_2_a.pemilik];
                                                            list[idx].nama = e.target.value;
                                                            updateSectionData('section_2_a.pemilik', list);
                                                        }}
                                                        className="w-full border border-transparent hover:border-neutral-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 p-1.5 text-xs font-semibold bg-transparent rounded transition-all duration-150"
                                                        placeholder="Nama Pemilik"
                                                    />
                                                </td>
                                                <td className="py-1 px-2 border border-neutral-300">
                                                    <input
                                                        type="text"
                                                        value={owner.saham_saham || ''}
                                                        onChange={(e) => {
                                                            const rawVal = e.target.value;
                                                            const list = [...data.section_data.section_2_a.pemilik];
                                                            list[idx].saham_saham = rawVal;

                                                            // Auto calculate percent for all rows based on new total
                                                            const newTotalShares = list.reduce((sum, item) => {
                                                                const val = Number(String(item.saham_saham || '').replace(/[^0-9]/g, ''));
                                                                return sum + (isNaN(val) ? 0 : val);
                                                            }, 0);

                                                            list.forEach((item) => {
                                                                const val = Number(String(item.saham_saham || '').replace(/[^0-9]/g, ''));
                                                                if (newTotalShares > 0 && !isNaN(val)) {
                                                                    item.saham_persen = ((val / newTotalShares) * 100).toFixed(2) + '%';
                                                                } else {
                                                                    item.saham_persen = '#DIV/0!';
                                                                }
                                                            });

                                                            updateSectionData('section_2_a.pemilik', list);
                                                        }}
                                                        className="w-full border border-transparent hover:border-neutral-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 p-1.5 text-xs text-right font-semibold bg-transparent rounded transition-all duration-150"
                                                        placeholder="Masukkan Lembar Saham"
                                                    />
                                                </td>
                                                <td className="py-1 px-2 border border-neutral-300">
                                                    <input
                                                        type="text"
                                                        value={owner.saham_persen || '#DIV/0!'}
                                                        readOnly
                                                        className="w-full border border-transparent p-1.5 text-xs text-center font-semibold bg-transparent text-neutral-500 cursor-not-allowed rounded"
                                                        placeholder="Persentase"
                                                    />
                                                </td>
                                                <td className="py-1 px-2 border border-neutral-300">
                                                    <select
                                                        value={owner.jabatan || 'Tidak Menjabat'}
                                                        onChange={(e) => {
                                                            const list = [...data.section_data.section_2_a.pemilik];
                                                            list[idx].jabatan = e.target.value;
                                                            updateSectionData('section_2_a.pemilik', list);
                                                        }}
                                                        className="w-full border border-transparent hover:border-neutral-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 p-1.5 text-xs font-bold bg-transparent bg-white rounded transition-all duration-150"
                                                    >
                                                        <option value="Direktur Utama">Direktur Utama</option>
                                                        <option value="Direktur">Direktur</option>
                                                        <option value="Komisaris Utama">Komisaris Utama</option>
                                                        <option value="Komisaris">Komisaris</option>
                                                        <option value="Tidak Menjabat">Tidak Menjabat</option>
                                                    </select>
                                                </td>
                                                <td className="py-1 px-1 border border-neutral-300 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveOwner(idx)}
                                                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition active:scale-95 duration-100"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Total Row */}
                                        <tr className="bg-neutral-50/50 font-extrabold border-t border-neutral-300">
                                            <td colSpan="2" className="py-2 px-3 border border-neutral-300 text-right uppercase tracking-wider text-[10px] text-neutral-600">Jumlah</td>
                                            <td className="py-2 px-3 border border-neutral-300 text-right text-neutral-800">
                                                {calculateTotalShares().toLocaleString('id-ID')}
                                            </td>
                                            <td className="py-2 px-3 border border-neutral-300 text-center text-neutral-800">
                                                {calculateTotalShares() > 0 ? '100.00%' : '#DIV/0!'}
                                            </td>
                                            <td colSpan="2" className="py-2 px-3 border border-neutral-300"></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="pt-1">
                                <button
                                    type="button"
                                    onClick={handleAddOwner}
                                    className="w-full py-2 bg-neutral-50 border border-dashed border-neutral-300 hover:bg-neutral-100 hover:border-neutral-400 hover:text-neutral-800 text-neutral-600 rounded-lg text-[11px] font-bold transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-1.5 shadow-2xs"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    Tambah Pemilik
                                </button>
                            </div>
                        </div>

                        {/* Komisaris & Direksi Tables */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-100">
                            <div className="space-y-2">
                                <h5 className="text-xs font-black text-neutral-700 uppercase tracking-wide border-b pb-1">Dewan Komisaris</h5>
                                <div className="overflow-x-auto border border-neutral-300 rounded-lg">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-neutral-200 text-neutral-700 font-bold uppercase tracking-wider text-[10px] text-center border-b border-neutral-300">
                                                <th className="py-1.5 px-2 border border-neutral-300">Jabatan</th>
                                                <th className="py-1.5 px-2 border border-neutral-300 w-36">2024</th>
                                                <th className="py-1.5 px-2 border border-neutral-300 w-36">2023</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white text-neutral-700">
                                            {(data.section_data.section_2_a.dewan_komisaris || defaultKomisaris).map((kom, i) => (
                                                <tr key={i}>
                                                    <td className="py-2 px-3 border border-neutral-300 font-bold text-neutral-600 bg-neutral-50/20">{kom.jabatan}</td>
                                                    <td className="py-1 px-1 border border-neutral-300">
                                                        <input
                                                            type="text"
                                                            value={kom.nama_2024 || ''}
                                                            onChange={(e) => {
                                                                const list = [...(data.section_data.section_2_a.dewan_komisaris || defaultKomisaris)];
                                                                list[i].nama_2024 = e.target.value;
                                                                updateSectionData('section_2_a.dewan_komisaris', list);
                                                            }}
                                                            className="w-full border border-transparent hover:border-neutral-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 p-1.5 text-xs font-semibold bg-transparent rounded transition-all duration-150"
                                                            placeholder="Nama Pejabat"
                                                        />
                                                    </td>
                                                    <td className="py-1 px-1 border border-neutral-300">
                                                        <input
                                                            type="text"
                                                            value={kom.nama_2023 || ''}
                                                            onChange={(e) => {
                                                                const list = [...(data.section_data.section_2_a.dewan_komisaris || defaultKomisaris)];
                                                                list[i].nama_2023 = e.target.value;
                                                                updateSectionData('section_2_a.dewan_komisaris', list);
                                                            }}
                                                            className="w-full border border-transparent hover:border-neutral-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 p-1.5 text-xs font-semibold bg-transparent rounded transition-all duration-150"
                                                            placeholder="Nama Pejabat"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h5 className="text-xs font-black text-neutral-700 uppercase tracking-wide border-b pb-1">Dewan Direksi</h5>
                                <div className="overflow-x-auto border border-neutral-300 rounded-lg">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-neutral-200 text-neutral-700 font-bold uppercase tracking-wider text-[10px] text-center border-b border-neutral-300">
                                                <th className="py-1.5 px-2 border border-neutral-300">Jabatan</th>
                                                <th className="py-1.5 px-2 border border-neutral-300 w-36">2024</th>
                                                <th className="py-1.5 px-2 border border-neutral-300 w-36">2023</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white text-neutral-700">
                                            {(data.section_data.section_2_a.dewan_direksi || defaultDireksi).map((dir, i) => (
                                                <tr key={i}>
                                                    <td className="py-2 px-3 border border-neutral-300 font-bold text-neutral-600 bg-neutral-50/20">{dir.jabatan}</td>
                                                    <td className="py-1 px-1 border border-neutral-300">
                                                        <input
                                                            type="text"
                                                            value={dir.nama_2024 || ''}
                                                            onChange={(e) => {
                                                                const list = [...(data.section_data.section_2_a.dewan_direksi || defaultDireksi)];
                                                                list[i].nama_2024 = e.target.value;
                                                                updateSectionData('section_2_a.dewan_direksi', list);
                                                            }}
                                                            className="w-full border border-transparent hover:border-neutral-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 p-1.5 text-xs font-semibold bg-transparent rounded transition-all duration-150"
                                                            placeholder="Nama Pejabat"
                                                        />
                                                    </td>
                                                    <td className="py-1 px-1 border border-neutral-300">
                                                        <input
                                                            type="text"
                                                            value={dir.nama_2023 || ''}
                                                            onChange={(e) => {
                                                                const list = [...(data.section_data.section_2_a.dewan_direksi || defaultDireksi)];
                                                                list[i].nama_2023 = e.target.value;
                                                                updateSectionData('section_2_a.dewan_direksi', list);
                                                            }}
                                                            className="w-full border-transparent hover:border-neutral-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 p-1.5 text-xs font-semibold bg-transparent rounded transition-all duration-150"
                                                            placeholder="Nama Pejabat"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Fields 4, 5, 6, 7 */}
                        <div className="space-y-4 pt-4 border-t border-neutral-100">
                            <div className="space-y-1">
                                <label className="block text-xs text-neutral-500 font-semibold uppercase">
                                    4. Jelaskan secara ringkas lokasi usaha klien (kantor pusat, pabrik, dan kantor cabang) dan jumlah pegawai pada setiap lokasi:
                                </label>
                                <input
                                    type="text"
                                    value={data.section_data.section_2_a.address || ''}
                                    onChange={(e) => updateSectionData('section_2_a.address', e.target.value)}
                                    className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg p-2.5 text-xs font-semibold text-neutral-850 bg-white transition-all duration-150"
                                    placeholder="Sebutkan lokasi usaha (kantor pusat, cabang, pabrik)..."
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs text-neutral-500 font-semibold uppercase">
                                    5. Jelaskan secara ringkas sumber pendapatan utama perusahaan dan metode pemasarannya:
                                </label>
                                <textarea
                                    value={data.section_data.section_2_a.revenue_sources || ''}
                                    onChange={(e) => updateSectionData('section_2_a.revenue_sources', e.target.value)}
                                    className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg p-2.5 text-xs font-semibold text-neutral-850 bg-white h-20 transition-all duration-150"
                                    placeholder="Sebutkan sumber pendapatan utama..."
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs text-neutral-500 font-semibold uppercase">
                                    6. Untuk setiap Tamu yang menyumbang Pendapatan lebih dari 10% hasil pendapatan hotel tahunan, jelaskan apakah ada ketergantungan ekonomi? Uraikan pelanggan utama dan % pendapatanya.
                                </label>
                                <input
                                    type="text"
                                    value={data.section_data.section_2_a.economic_dependency || ''}
                                    onChange={(e) => updateSectionData('section_2_a.economic_dependency', e.target.value)}
                                    className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg p-2.5 text-xs font-semibold text-neutral-850 bg-white transition-all duration-150"
                                    placeholder="Uraikan jika terdapat ketergantungan ekonomi..."
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs text-neutral-500 font-semibold uppercase">
                                    7. Jelaskan sumber pembiayaan perusahaan:
                                </label>
                                <input
                                    type="text"
                                    value={data.section_data.section_2_a.funding_sources || ''}
                                    onChange={(e) => updateSectionData('section_2_a.funding_sources', e.target.value)}
                                    className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg p-2.5 text-xs font-semibold text-neutral-850 bg-white transition-all duration-150"
                                    placeholder="Masukkan sumber pembiayaan (bank, internal, dll)..."
                                />
                            </div>
                        </div>

                        {/* Section 2.b: Hubungan Istimewa dan Anak Perusahaan */}
                        <div className="pt-4 border-t border-neutral-100 space-y-4">
                            <h4 className="text-sm font-bold text-neutral-700 uppercase tracking-wide">
                                b. Identifikasi Anak Usaha dan pihak yang memiliki Hubungan Istimewa
                            </h4>

                            <div className="space-y-2.5">
                                <label className="block text-xs text-neutral-500 font-bold uppercase">1. Apakah Perusahaan Memiliki Entitas anak, Entitas Asosiasi, entitsas sepengendali dan atau entitas induk?</label>
                                <div className="space-y-2 bg-neutral-50/50 p-4 rounded-xl border border-neutral-200">
                                    <label className="flex items-start gap-3 cursor-pointer text-xs text-neutral-700 hover:text-neutral-900 font-semibold">
                                        <input
                                            type="radio"
                                            name="has_subsidiary"
                                            value="Tidak"
                                            checked={data.section_data.section_2_b?.has_subsidiary === 'Tidak'}
                                            onChange={(e) => {
                                                const newSec2b = { ...data.section_data.section_2_b };
                                                newSec2b.has_subsidiary = 'Tidak';
                                                newSec2b.subsidiary_detail = Array.from({ length: 3 }, (_, i) => ({
                                                    no: i + 1,
                                                    nama: 'Tidak ada',
                                                    kepemilikan: '',
                                                    jenis_usaha: '',
                                                    alamat: '',
                                                    total_aset: '',
                                                    pendapatan: '',
                                                    auditor: ''
                                                }));
                                                updateSectionData('section_2_b', newSec2b);
                                            }}
                                            className="w-4 h-4 text-blue-600 border-neutral-300 focus:ring-blue-500 mt-0.5"
                                        />
                                        <span>Tidak, Perusahaan tidak Memiliki Entitas anak, Entitas Asosiasi, entitsas sepengendali dan atau entitas induk</span>
                                    </label>
                                    <label className="flex items-start gap-3 cursor-pointer text-xs text-neutral-700 hover:text-neutral-900 font-semibold">
                                        <input
                                            type="radio"
                                            name="has_subsidiary"
                                            value="Ya"
                                            checked={data.section_data.section_2_b?.has_subsidiary === 'Ya'}
                                            onChange={(e) => {
                                                const newSec2b = { ...data.section_data.section_2_b };
                                                newSec2b.has_subsidiary = 'Ya';
                                                newSec2b.subsidiary_detail = Array.from({ length: 3 }, (_, i) => ({
                                                    no: i + 1,
                                                    nama: '',
                                                    kepemilikan: '',
                                                    jenis_usaha: '',
                                                    alamat: '',
                                                    total_aset: '',
                                                    pendapatan: '',
                                                    auditor: ''
                                                }));
                                                updateSectionData('section_2_b', newSec2b);
                                            }}
                                            className="w-4 h-4 text-blue-600 border-neutral-300 focus:ring-blue-500 mt-0.5"
                                        />
                                        <span>Ya, Perusahaan Memiliki Entitas anak, Entitas Asosiasi, entitsas sepengendali dan atau entitas induk dengan komposisi ebagai berikut:</span>
                                    </label>
                                </div>
                            </div>

                            {/* II.b.1 Anak Perusahaan Table */}
                            <div className="space-y-2.5">
                                <h5 className="text-xs font-black text-neutral-700 uppercase tracking-wide">II. b. 1. Identifikasi Anak Perusahaan / Entitas Anak</h5>
                                <div className="overflow-x-auto border border-neutral-300 rounded-lg">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-neutral-200 text-neutral-700 font-bold uppercase tracking-wider text-[10px] text-center border-b border-neutral-300">
                                                <th className="py-2 px-3 border border-neutral-300 w-12 text-center">No.</th>
                                                <th className="py-2 px-3 border border-neutral-300">Nama Entitas</th>
                                                <th className="py-2 px-3 border border-neutral-300 w-24">Kepemilikan</th>
                                                <th className="py-2 px-3 border border-neutral-300 w-36">Jenis Usaha</th>
                                                <th className="py-2 px-3 border border-neutral-300">Alamat</th>
                                                <th className="py-2 px-3 border border-neutral-300 w-36">Total Aset</th>
                                                <th className="py-2 px-3 border border-neutral-300 w-36">Pendapatan</th>
                                                <th className="py-2 px-3 border border-neutral-300 w-44">Nama Auditor</th>
                                                <th className="py-2 px-2 border border-neutral-300 w-12 text-center"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white text-neutral-700">
                                            {(data.section_data.section_2_b?.subsidiary_detail || defaultSubsidiaryDetail).map((sub, idx) => (
                                                <tr key={idx} className="hover:bg-neutral-50/20">
                                                    <td className="py-1.5 px-3 border border-neutral-300 text-center font-bold text-neutral-400">
                                                        {sub.no}
                                                    </td>
                                                    <td className="py-1 px-2 border border-neutral-300">
                                                        <input
                                                            id={`sub-nama-${idx}`}
                                                            type="text"
                                                            disabled={data.section_data.section_2_b?.has_subsidiary === 'Tidak'}
                                                            value={sub.nama || ''}
                                                            onChange={(e) => {
                                                                const list = [...(data.section_data.section_2_b.subsidiary_detail || defaultSubsidiaryDetail)];
                                                                list[idx].nama = e.target.value;
                                                                updateSectionData('section_2_b.subsidiary_detail', list);
                                                            }}
                                                            className="w-full border border-transparent hover:border-neutral-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 disabled:hover:border-transparent disabled:bg-neutral-100 disabled:text-neutral-400 p-1.5 text-xs font-semibold bg-transparent rounded transition-all duration-150"
                                                            placeholder="Nama Entitas Anak"
                                                        />
                                                    </td>
                                                    <td className="py-1 px-2 border border-neutral-300">
                                                        <input
                                                            type="text"
                                                            disabled={data.section_data.section_2_b?.has_subsidiary === 'Tidak'}
                                                            value={sub.kepemilikan || ''}
                                                            onChange={(e) => {
                                                                const list = [...(data.section_data.section_2_b.subsidiary_detail || defaultSubsidiaryDetail)];
                                                                list[idx].kepemilikan = e.target.value;
                                                                updateSectionData('section_2_b.subsidiary_detail', list);
                                                            }}
                                                            className="w-full border border-transparent hover:border-neutral-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 disabled:hover:border-transparent disabled:bg-neutral-100 disabled:text-neutral-400 p-1.5 text-xs text-center font-semibold bg-transparent rounded transition-all duration-150"
                                                            placeholder="Persentase Kepemilikan"
                                                        />
                                                    </td>
                                                    <td className="py-1 px-2 border border-neutral-300">
                                                        <input
                                                            type="text"
                                                            disabled={data.section_data.section_2_b?.has_subsidiary === 'Tidak'}
                                                            value={sub.jenis_usaha || ''}
                                                            onChange={(e) => {
                                                                const list = [...(data.section_data.section_2_b.subsidiary_detail || defaultSubsidiaryDetail)];
                                                                list[idx].jenis_usaha = e.target.value;
                                                                updateSectionData('section_2_b.subsidiary_detail', list);
                                                            }}
                                                            className="w-full border border-transparent hover:border-neutral-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 disabled:hover:border-transparent disabled:bg-neutral-100 disabled:text-neutral-400 p-1.5 text-xs font-semibold bg-transparent rounded transition-all duration-150"
                                                            placeholder="Jenis Usaha"
                                                        />
                                                    </td>
                                                    <td className="py-1 px-2 border border-neutral-305 text-left">
                                                        <input
                                                            type="text"
                                                            disabled={data.section_data.section_2_b?.has_subsidiary === 'Tidak'}
                                                            value={sub.alamat || ''}
                                                            onChange={(e) => {
                                                                const list = [...(data.section_data.section_2_b.subsidiary_detail || defaultSubsidiaryDetail)];
                                                                list[idx].alamat = e.target.value;
                                                                updateSectionData('section_2_b.subsidiary_detail', list);
                                                            }}
                                                            className="w-full border border-transparent hover:border-neutral-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 disabled:hover:border-transparent disabled:bg-neutral-100 disabled:text-neutral-400 p-1.5 text-xs font-semibold bg-transparent rounded transition-all duration-150"
                                                            placeholder="Alamat Kantor"
                                                        />
                                                    </td>
                                                    <td className="py-1 px-2 border border-neutral-300">
                                                        <input
                                                            type="text"
                                                            disabled={data.section_data.section_2_b?.has_subsidiary === 'Tidak'}
                                                            value={sub.total_aset || ''}
                                                            onChange={(e) => {
                                                                const list = [...(data.section_data.section_2_b.subsidiary_detail || defaultSubsidiaryDetail)];
                                                                list[idx].total_aset = e.target.value;
                                                                updateSectionData('section_2_b.subsidiary_detail', list);
                                                            }}
                                                            className="w-full border border-transparent hover:border-neutral-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 disabled:hover:border-transparent disabled:bg-neutral-100 disabled:text-neutral-400 p-1.5 text-xs text-right font-semibold bg-transparent rounded transition-all duration-150"
                                                            placeholder="Masukkan Total Aset"
                                                        />
                                                    </td>
                                                    <td className="py-1 px-2 border border-neutral-300">
                                                        <input
                                                            type="text"
                                                            disabled={data.section_data.section_2_b?.has_subsidiary === 'Tidak'}
                                                            value={sub.pendapatan || ''}
                                                            onChange={(e) => {
                                                                const list = [...(data.section_data.section_2_b.subsidiary_detail || defaultSubsidiaryDetail)];
                                                                list[idx].pendapatan = e.target.value;
                                                                updateSectionData('section_2_b.subsidiary_detail', list);
                                                            }}
                                                            className="w-full border border-transparent hover:border-neutral-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 disabled:hover:border-transparent disabled:bg-neutral-100 disabled:text-neutral-400 p-1.5 text-xs text-right font-semibold bg-transparent rounded transition-all duration-150"
                                                            placeholder="Masukkan Pendapatan"
                                                        />
                                                    </td>
                                                    <td className="py-1 px-2 border border-neutral-300">
                                                        <input
                                                            type="text"
                                                            disabled={data.section_data.section_2_b?.has_subsidiary === 'Tidak'}
                                                            value={sub.auditor || ''}
                                                            onChange={(e) => {
                                                                const list = [...(data.section_data.section_2_b.subsidiary_detail || defaultSubsidiaryDetail)];
                                                                list[idx].auditor = e.target.value;
                                                                updateSectionData('section_2_b.subsidiary_detail', list);
                                                            }}
                                                            className="w-full border border-transparent hover:border-neutral-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 disabled:hover:border-transparent disabled:bg-neutral-100 disabled:text-neutral-400 p-1.5 text-xs font-semibold bg-transparent rounded transition-all duration-150"
                                                            placeholder="Masukkan Nama KAP"
                                                        />
                                                    </td>
                                                    <td className="py-1 px-1 border border-neutral-300 text-center">
                                                        <button
                                                            type="button"
                                                            disabled={data.section_data.section_2_b?.has_subsidiary === 'Tidak'}
                                                            onClick={() => handleRemoveSubsidiary(idx)}
                                                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 disabled:text-neutral-300 disabled:hover:bg-transparent rounded transition active:scale-95 duration-100"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="pt-1">
                                    <button
                                        type="button"
                                        disabled={data.section_data.section_2_b?.has_subsidiary === 'Tidak'}
                                        onClick={handleAddSubsidiary}
                                        className="w-full py-2 bg-neutral-50 border border-dashed border-neutral-300 hover:bg-neutral-100 hover:border-neutral-400 hover:text-neutral-800 text-neutral-600 disabled:text-neutral-300 disabled:border-neutral-200 disabled:hover:bg-transparent rounded-lg text-[11px] font-bold transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-1.5 shadow-2xs"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                        Tambah Anak Perusahaan
                                    </button>
                                </div>
                            </div>

                            {/* II.b.2 Hubungan Istimewa Table */}
                            <div className="space-y-2.5 pt-4">
                                <h5 className="text-xs font-black text-neutral-700 uppercase tracking-wide">II. b. 2. Pihak-pihak yang Mempunyai Hubungan Istimewa</h5>
                                <div className="overflow-x-auto border border-neutral-300 rounded-lg">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-neutral-200 text-neutral-700 font-bold uppercase tracking-wider text-[10px] text-center border-b border-neutral-300">
                                                <th className="py-2 px-3 border border-neutral-300 w-12 text-center">No.</th>
                                                <th className="py-2 px-3 border border-neutral-300">Nama</th>
                                                <th className="py-2 px-3 border border-neutral-300 w-64">Jenis Hubungan</th>
                                                <th className="py-2 px-3 border border-neutral-300 w-80">Sifat Transaksi'</th>
                                                <th className="py-2 px-2 border border-neutral-300 w-12 text-center"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white text-neutral-700">
                                            {(data.section_data.section_2_b?.related_parties || defaultRelatedParties).map((party, idx) => (
                                                <tr key={idx} className="hover:bg-neutral-50/20">
                                                    <td className="py-1.5 px-3 border border-neutral-300 text-center font-bold text-neutral-400">
                                                        {party.no}
                                                    </td>
                                                    <td className="py-1 px-2 border border-neutral-300">
                                                        <input
                                                            id={`party-nama-${idx}`}
                                                            type="text"
                                                            value={party.nama || ''}
                                                            onChange={(e) => {
                                                                const list = [...(data.section_data.section_2_b.related_parties || defaultRelatedParties)];
                                                                list[idx].nama = e.target.value;
                                                                updateSectionData('section_2_b.related_parties', list);
                                                            }}
                                                            className="w-full border border-transparent hover:border-neutral-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 p-1.5 text-xs font-semibold bg-transparent rounded transition-all duration-150"
                                                            placeholder="Nama Pihak Afiliasi"
                                                        />
                                                    </td>
                                                    <td className="py-1 px-2 border border-neutral-300">
                                                        <input
                                                            type="text"
                                                            value={party.hubungan || ''}
                                                            onChange={(e) => {
                                                                const list = [...(data.section_data.section_2_b.related_parties || defaultRelatedParties)];
                                                                list[idx].hubungan = e.target.value;
                                                                updateSectionData('section_2_b.related_parties', list);
                                                            }}
                                                            className="w-full border border-transparent hover:border-neutral-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 p-1.5 text-xs font-semibold bg-transparent rounded transition-all duration-150"
                                                            placeholder="Hubungan (Induk, Afiliasi, Pemegang Saham)"
                                                        />
                                                    </td>
                                                    <td className="py-1 px-2 border border-neutral-300">
                                                        <input
                                                            type="text"
                                                            value={party.sifat_transaksi || ''}
                                                            onChange={(e) => {
                                                                const list = [...(data.section_data.section_2_b.related_parties || defaultRelatedParties)];
                                                                list[idx].sifat_transaksi = e.target.value;
                                                                updateSectionData('section_2_b.related_parties', list);
                                                            }}
                                                            className="w-full border border-transparent hover:border-neutral-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 p-1.5 text-xs font-semibold bg-transparent rounded transition-all duration-150"
                                                            placeholder="Sifat transaksi (penjualan, sewa, deviden)"
                                                        />
                                                    </td>
                                                    <td className="py-1 px-1 border border-neutral-300 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveRelatedParty(idx)}
                                                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition active:scale-95 duration-100"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="pt-1">
                                    <button
                                        type="button"
                                        onClick={handleAddRelatedParty}
                                        className="w-full py-2 bg-neutral-50 border border-dashed border-neutral-300 hover:bg-neutral-100 hover:border-neutral-400 hover:text-neutral-800 text-neutral-600 rounded-lg text-[11px] font-bold transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-1.5 shadow-2xs"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                        Tambah Hubungan Istimewa
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Sub-section c. Jasa Yang Akan Diberikan */}
                        <div className="pt-4 border-t border-neutral-100 space-y-2">
                            <h4 className="text-sm font-bold text-neutral-700 uppercase tracking-wide">
                                c. Jasa Yang Akan Diberikan
                            </h4>
                            <input
                                type="text"
                                value={data.section_data.section_2_c || ''}
                                onChange={(e) => setData('section_data', { ...data.section_data, section_2_c: e.target.value })}
                                className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg p-2.5 text-xs font-semibold text-neutral-850 bg-white transition-all duration-150"
                                placeholder="Masukkan jenis jasa yang akan diberikan"
                            />
                        </div>

                        {/* Sub-section d. Auditor Pendahulu */}
                        <div className="pt-4 border-t border-neutral-100 space-y-4">
                            <h4 className="text-sm font-bold text-neutral-700 uppercase tracking-wide">
                                d. Auditor Pendahulu
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-[10px] text-neutral-400 font-bold uppercase">Nama KAP</label>
                                    <input
                                        type="text"
                                        value={data.section_data.section_2_d.nama_kap || ''}
                                        onChange={(e) => updateSectionData('section_2_d.nama_kap', e.target.value)}
                                        className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg p-2.5 text-xs font-semibold bg-white transition-all duration-150"
                                        placeholder="Masukkan Nama KAP Pendahulu"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] text-neutral-400 font-bold uppercase">Nama Akuntan Publik</label>
                                    <input
                                        type="text"
                                        value={data.section_data.section_2_d.nama_ap || ''}
                                        onChange={(e) => updateSectionData('section_2_d.nama_ap', e.target.value)}
                                        className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg p-2.5 text-xs font-semibold bg-white transition-all duration-150"
                                        placeholder="Masukkan Nama Akuntan Publik"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] text-neutral-400 font-bold uppercase">Alamat</label>
                                    <input
                                        type="text"
                                        value={data.section_data.section_2_d.alamat || ''}
                                        onChange={(e) => updateSectionData('section_2_d.alamat', e.target.value)}
                                        className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg p-2.5 text-xs font-semibold bg-white transition-all duration-150"
                                        placeholder="Masukkan Alamat KAP Pendahulu"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-[10px] text-neutral-400 font-bold uppercase">Alasan Penggantian Auditor</label>
                                    <textarea
                                        value={data.section_data.section_2_d.alasan_penggantian || ''}
                                        onChange={(e) => updateSectionData('section_2_d.alasan_penggantian', e.target.value)}
                                        className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg p-2.5 text-xs font-semibold bg-white h-20 transition-all duration-150"
                                        placeholder="Tuliskan alasan penggantian auditor..."
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] text-neutral-400 font-bold uppercase">Kemungkinan Bantuan Auditor Pendahulu</label>
                                    <textarea
                                        value={data.section_data.section_2_d.bantuan_pendahulu || ''}
                                        onChange={(e) => updateSectionData('section_2_d.bantuan_pendahulu', e.target.value)}
                                        className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg p-2.5 text-xs font-semibold bg-white h-20 transition-all duration-150"
                                        placeholder="Tuliskan bantuan yang dapat diberikan auditor pendahulu..."
                                    />
                                </div>
                            </div>
                        </div>


                    </div>
                </div>

                {/* Section II.e: Risiko Penugasan */}
                <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-5">
                    <h3 className="text-base font-black text-neutral-800 border-b border-neutral-100 pb-2 uppercase tracking-wide">
                        II. e. Risiko Penugasan
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs text-neutral-500 font-semibold mb-1">Tujuan Klien Membutuhkan Jasa Audit</label>
                            <input
                                type="text"
                                value={data.section_data.section_2_e.tujuan_audit || ''}
                                onChange={(e) => updateSectionData('section_2_e.tujuan_audit', e.target.value)}
                                className="w-full custom-input p-3 text-sm bg-white"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-neutral-500 font-semibold mb-1">Memiliki Satuan Pengawas Intern (SPI)?</label>
                                <select
                                    value={data.section_data.section_2_e.has_internal_audit || 'Tidak'}
                                    onChange={(e) => updateSectionData('section_2_e.has_internal_audit', e.target.value)}
                                    className="w-full custom-input p-3 text-sm bg-white"
                                >
                                    <option value="Ya">Ya</option>
                                    <option value="Tidak">Tidak</option>
                                </select>
                            </div>
                            {data.section_data.section_2_e.has_internal_audit === 'Ya' && (
                                <div>
                                    <label className="block text-xs text-neutral-500 font-semibold mb-1">Kedudukan internal audit</label>
                                    <input
                                        type="text"
                                        value={data.section_data.section_2_e.kedudukan_internal_audit || ''}
                                        onChange={(e) => updateSectionData('section_2_e.kedudukan_internal_audit', e.target.value)}
                                        className="w-full custom-input p-3 text-sm bg-white"
                                        placeholder="Uraikan kedudukan internal audit (SPI)..."
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                        <div>
                            <label className="block text-xs text-neutral-500 font-semibold mb-1">Peraturan perundangan utama yang relevan dengan klien</label>
                            <textarea
                                value={data.section_data.section_2_e.peraturan_regulator || ''}
                                onChange={(e) => updateSectionData('section_2_e.peraturan_regulator', e.target.value)}
                                className="w-full custom-input p-3 text-xs h-20 bg-white"
                                placeholder="Sebutkan peraturan perundangan utama..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-neutral-500 font-semibold mb-1">Masalah hukum yang sedang dihadapi klien</label>
                            <textarea
                                value={data.section_data.section_2_e.masalah_hukum || ''}
                                onChange={(e) => updateSectionData('section_2_e.masalah_hukum', e.target.value)}
                                className="w-full custom-input p-3 text-xs h-20 bg-white"
                                placeholder="Sebutkan masalah hukum jika ada..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-neutral-500 font-semibold mb-1">Masalah yang berpotensi menjadi masalah hukum</label>
                            <textarea
                                value={data.section_data.section_2_e.potensi_hukum || ''}
                                onChange={(e) => updateSectionData('section_2_e.potensi_hukum', e.target.value)}
                                className="w-full custom-input p-3 text-xs h-20 bg-white"
                                placeholder="Sebutkan masalah berpotensi hukum jika ada..."
                            />
                        </div>
                    </div>

                    <div className="border-t border-neutral-200 pt-6 space-y-3">
                        <h4 className="text-md font-semibold text-[#1d1d1f]">Indikator Going Concern (Kelangsungan Hidup)</h4>
                        <div className="overflow-x-auto border border-neutral-300 rounded-lg">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-neutral-200 text-neutral-700 font-bold uppercase tracking-wider text-[10px] text-center border-b border-neutral-300">
                                        <th className="py-2 px-3 border border-neutral-300 w-12 text-center">No.</th>
                                        <th className="py-2 px-3 border border-neutral-300">Deskripsi</th>
                                        <th className="py-2 px-3 border border-neutral-300 w-28 text-center">Y/T</th>
                                        <th className="py-2 px-3 border border-neutral-300 w-96">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white text-neutral-700">
                                    {(data.section_data.section_2_e.going_concern || defaultGoingConcern).map((item, idx) => (
                                        <tr key={idx} className="hover:bg-neutral-50/20">
                                            <td className="py-2 px-3 border border-neutral-300 text-center font-bold text-neutral-400">
                                                {item.no}
                                            </td>
                                            <td className="py-2 px-3 border border-neutral-300 leading-relaxed font-medium">
                                                {item.description}
                                            </td>
                                            <td className="py-1 px-2 border border-neutral-300 text-center">
                                                <select
                                                    value={item.value || 'Tidak'}
                                                    onChange={(e) => {
                                                        const list = [...(data.section_data.section_2_e.going_concern || defaultGoingConcern)];
                                                        list[idx].value = e.target.value;
                                                        updateSectionData('section_2_e.going_concern', list);
                                                    }}
                                                    className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md py-1 px-2 text-xs text-center font-semibold bg-white text-neutral-850 transition-all duration-150"
                                                >
                                                    <option value="Ya">Ya</option>
                                                    <option value="Tidak">Tidak</option>
                                                </select>
                                            </td>
                                            <td className="py-1 px-2 border border-neutral-300">
                                                <input
                                                    type="text"
                                                    value={item.notes || ''}
                                                    onChange={(e) => {
                                                        const list = [...(data.section_data.section_2_e.going_concern || defaultGoingConcern)];
                                                        list[idx].notes = e.target.value;
                                                        updateSectionData('section_2_e.going_concern', list);
                                                    }}
                                                    className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md py-1 px-2 text-xs bg-white text-neutral-850 transition-all duration-150"
                                                    placeholder="Catatan / Penjelasan"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4">
                            <label className="block text-xs text-neutral-500 font-semibold mb-1">Kesimpulan Kelangsungan Hidup</label>
                            <input
                                type="text"
                                value={data.section_data.section_2_e.going_concern_conclusion || ''}
                                onChange={(e) => updateSectionData('section_2_e.going_concern_conclusion', e.target.value)}
                                className="w-full custom-input p-3 text-sm bg-white"
                                placeholder="Tuliskan kesimpulan kelangsungan hidup..."
                            />
                        </div>
                    </div>
                </div>

                {/* Section II.f: Akuntansi dan Pelaporan Keuangan */}
                <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-5">
                    <h3 className="text-base font-black text-neutral-800 border-b border-neutral-100 pb-2 uppercase tracking-wide">
                        II. f. Akuntansi dan Pelaporan Keuangan
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <label className="block text-xs text-neutral-500 font-semibold mb-1">Buku Pedoman Akuntansi / SOP</label>
                            <textarea
                                value={data.section_data.section_2_f?.buku_pedoman || ''}
                                onChange={(e) => updateSectionData('section_2_f.buku_pedoman', e.target.value)}
                                className="w-full custom-input p-3 text-xs h-20 bg-white"
                                placeholder="Uraikan ketersediaan buku pedoman atau SOP keuangan..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-neutral-500 font-semibold mb-1">Cara Pengolahan Data Akuntansi</label>
                            <textarea
                                value={data.section_data.section_2_f?.cara_mengolah_data || ''}
                                onChange={(e) => updateSectionData('section_2_f.cara_mengolah_data', e.target.value)}
                                className="w-full custom-input p-3 text-xs h-20 bg-white"
                                placeholder="Uraikan cara pengolahan data akuntansi (Accurate, Excel, dll)..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <label className="block text-xs text-neutral-500 font-semibold mb-1">Siklus / Cycles Penjualan & Pembelian (cycles)</label>
                            <input
                                type="text"
                                value={data.section_data.section_2_f?.cycles || ''}
                                onChange={(e) => updateSectionData('section_2_f.cycles', e.target.value)}
                                className="w-full custom-input p-2.5 text-xs font-semibold text-neutral-800 bg-white"
                                placeholder="Masukkan siklus akuntansi yang relevan..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-neutral-500 font-semibold mb-1">Masalah kinerja, akuntansi & pajak yang harus diperhatikan</label>
                            <input
                                type="text"
                                value={data.section_data.section_2_f?.masalah_kinerja_pajak || ''}
                                onChange={(e) => updateSectionData('section_2_f.masalah_kinerja_pajak', e.target.value)}
                                className="w-full custom-input p-2.5 text-xs font-semibold text-neutral-800 bg-white"
                                placeholder="Sebutkan masalah kinerja, akuntansi atau pajak jika ada..."
                            />
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <label className="block text-xs text-neutral-500 font-bold uppercase">3. Apakah calon klien dapat diaudit?</label>
                        <div className="overflow-x-auto border border-neutral-300 rounded-lg">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-neutral-200 text-neutral-700 font-bold uppercase tracking-wider text-[10px] text-center border-b border-neutral-300">
                                        <th className="py-2 px-3 border border-neutral-300 w-12 text-center">No.</th>
                                        <th className="py-2 px-3 border border-neutral-300">Uraian</th>
                                        <th className="py-2 px-3 border border-neutral-300 w-28 text-center">Y/T</th>
                                        <th className="py-2 px-3 border border-neutral-300 w-96">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white text-neutral-700">
                                    {(data.section_data.section_2_f?.auditable || defaultAuditable).map((item, idx) => (
                                        <tr key={idx} className="hover:bg-neutral-50/20">
                                            <td className="py-2 px-3 border border-neutral-300 text-center font-bold text-neutral-400">
                                                {item.no}
                                            </td>
                                            <td className="py-2 px-3 border border-neutral-300 leading-relaxed font-medium">
                                                {item.description}
                                            </td>
                                            <td className="py-1 px-2 border border-neutral-300 text-center">
                                                <select
                                                    value={item.value || 'Ya'}
                                                    onChange={(e) => {
                                                        const list = [...(data.section_data.section_2_f.auditable || defaultAuditable)];
                                                        list[idx].value = e.target.value;
                                                        updateSectionData('section_2_f.auditable', list);
                                                    }}
                                                    className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md py-1 px-2 text-xs text-center font-semibold bg-white text-neutral-850 transition-all duration-150"
                                                >
                                                    <option value="Ya">Ya</option>
                                                    <option value="Tidak">Tidak</option>
                                                </select>
                                            </td>
                                            <td className="py-1 px-2 border border-neutral-300">
                                                <input
                                                    type="text"
                                                    value={item.notes || ''}
                                                    onChange={(e) => {
                                                        const list = [...(data.section_data.section_2_f.auditable || defaultAuditable)];
                                                        list[idx].notes = e.target.value;
                                                        updateSectionData('section_2_f.auditable', list);
                                                    }}
                                                    className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md py-1 px-2 text-xs bg-white text-neutral-850 transition-all duration-150"
                                                    placeholder="Catatan / Penjelasan"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Section II.g: Penggunaan Spesialis */}
                <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-5">
                    <h3 className="text-base font-black text-neutral-800 border-b border-neutral-100 pb-2 uppercase tracking-wide">
                        II. g. Penggunaan Spesialis
                    </h3>
                    <div className="space-y-2">
                        <label className="block text-xs text-neutral-500 font-semibold">Apakah KAP menggunakan spesialis independen dalam audit ini?</label>
                        <textarea
                            value={data.section_data.section_2_g || ''}
                            onChange={(e) => updateSectionData('section_2_g', e.target.value)}
                            className="w-full custom-input p-3 text-xs h-20 bg-white"
                            placeholder="Jelaskan penggunaan spesialis jika ada..."
                        />
                    </div>
                </div>

                {/* Section II.h: Prakiraan Kontrak & Jadwal Pembayaran */}
                <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
                    <h3 className="text-base font-black text-neutral-800 border-b border-neutral-100 pb-2 uppercase tracking-wide">
                        II. h. Prakiraan Kontrak dan Jadwal Pembayaran
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs text-neutral-500 font-semibold mb-1">Prakiraan Nilai Kontrak</label>
                            <input
                                type="text"
                                value={data.section_data.section_2_h?.nilai_kontrak || ''}
                                onChange={(e) => handleNilaiKontrakChange(e.target.value)}
                                className="w-full custom-input p-3 text-sm font-semibold text-neutral-800 bg-white"
                                placeholder="Masukkan prakiraan nilai kontrak"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-neutral-500 font-semibold mb-1">Tahap Pembayaran</label>
                            <textarea
                                value={data.section_data.section_2_h?.tahap_pembayaran || ''}
                                onChange={(e) => updateSectionData('section_2_h.tahap_pembayaran', e.target.value)}
                                className="w-full custom-input p-3 text-xs h-20 bg-white font-semibold text-neutral-800"
                                placeholder="Uraikan tahapan termin..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-neutral-500 font-semibold mb-1">Alasan menerima fee di bawah standar (bila di bawah standar kantor)</label>
                            <input
                                type="text"
                                value={data.section_data.section_2_h?.alasan_dibawah_standar || ''}
                                onChange={(e) => updateSectionData('section_2_h.alasan_dibawah_standar', e.target.value)}
                                className="w-full custom-input p-3 text-sm font-semibold text-neutral-800 bg-white"
                                placeholder="Sebutkan alasannya jika ada..."
                            />
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <label className="block text-xs text-neutral-500 font-semibold">Jadwal Pelunasan Fee Penugasan</label>
                        <div className="overflow-x-auto border border-neutral-300 rounded-lg">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-neutral-200 text-neutral-700 font-bold uppercase tracking-wider text-[10px] text-center border-b border-neutral-300">
                                        <th className="py-2 px-3 border border-neutral-300 w-12 text-center">No</th>
                                        <th className="py-2 px-3 border border-neutral-300 w-44">Bulan/Tanggal</th>
                                        <th className="py-2 px-3 border border-neutral-300">Keterangan</th>
                                        <th className="py-2 px-3 border border-neutral-300 w-28 text-center">Persen (%)</th>
                                        <th className="py-2 px-3 border border-neutral-300 w-48 text-right">Nominal Fee (Rp)</th>
                                        <th className="py-2 px-2 border border-neutral-300 w-12 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white text-neutral-700">
                                    {(data.section_data.section_2_h?.jadwal_pelunasan || defaultJadwalFee).map((item, idx) => (
                                        <tr key={idx} className="hover:bg-neutral-50/20">
                                            <td className="py-2 px-3 border border-neutral-300 text-center font-bold text-neutral-400">
                                                {item.no}
                                            </td>
                                            <td className="py-1 px-2 border border-neutral-300">
                                                <input
                                                    id={`fee-tanggal-${idx}`}
                                                    type="text"
                                                    value={item.tanggal || ''}
                                                    onChange={(e) => {
                                                        const list = [...(data.section_data.section_2_h.jadwal_pelunasan || defaultJadwalFee)];
                                                        list[idx].tanggal = e.target.value;
                                                        updateSectionData('section_2_h.jadwal_pelunasan', list);
                                                    }}
                                                    className="w-full border-0 p-1 text-xs focus:ring-0 text-center font-semibold bg-transparent focus:bg-neutral-50 rounded"
                                                    placeholder="Tanggal/Bulan"
                                                />
                                            </td>
                                            <td className="py-1 px-2 border border-neutral-300">
                                                <input
                                                    type="text"
                                                    value={item.keterangan || ''}
                                                    onChange={(e) => {
                                                        const list = [...(data.section_data.section_2_h.jadwal_pelunasan || defaultJadwalFee)];
                                                        list[idx].keterangan = e.target.value;
                                                        updateSectionData('section_2_h.jadwal_pelunasan', list);
                                                    }}
                                                    className="w-full border-0 p-1 text-xs focus:ring-0 font-semibold bg-transparent focus:bg-neutral-50 rounded"
                                                    placeholder="Pembayaran termin..."
                                                />
                                            </td>
                                            <td className="py-1 px-2 border border-neutral-300">
                                                <input
                                                    type="text"
                                                    value={item.persen || ''}
                                                    onChange={(e) => handleFeePersenChange(idx, e.target.value)}
                                                    className="w-full border-0 p-1 text-xs focus:ring-0 text-center font-semibold bg-transparent focus:bg-neutral-50 rounded"
                                                    placeholder="Persentase termin (%)"
                                                />
                                            </td>
                                            <td className="py-1 px-2 border border-neutral-300 bg-neutral-50/30">
                                                <input
                                                    type="text"
                                                    value={item.nominal ? 'Rp ' + Number(item.nominal).toLocaleString('id-ID') : ''}
                                                    readOnly
                                                    className="w-full border-0 p-1 text-xs focus:ring-0 text-right font-semibold bg-transparent text-neutral-500 cursor-not-allowed rounded"
                                                    placeholder="Nominal termin (Rp)"
                                                />
                                            </td>
                                            <td className="py-1 px-1 border border-neutral-300 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFeeRow(idx)}
                                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Total Row */}
                                    <tr className="bg-neutral-50/50 font-extrabold border-t border-neutral-300">
                                        <td colSpan="3" className="py-2 px-3 border border-neutral-300 text-right uppercase tracking-wider text-[10px] text-neutral-600">Jumlah</td>
                                        <td className="py-2 px-3 border border-neutral-300 text-center text-neutral-800">
                                            {calculateTotalFeePercent()}%
                                        </td>
                                        <td className="py-2 px-3 border border-neutral-300 text-right text-neutral-800">
                                            {formatCurrency(calculateTotalFeeNominal())}
                                        </td>
                                        <td className="py-2 px-3 border border-neutral-300"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="pt-1">
                            <button
                                type="button"
                                onClick={handleAddFeeRow}
                                className="w-full py-2 bg-neutral-50 border border-dashed border-neutral-300 hover:bg-neutral-100 hover:border-neutral-400 hover:text-neutral-800 text-neutral-600 rounded-lg text-[11px] font-bold transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-1.5 shadow-2xs"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Tambah Termin
                            </button>
                        </div>
                    </div>
                </div>

                {/* Section III: PENILAIAN INTEGRITAS MANAJEMEN */}
                <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-5">
                    <h3 className="text-base font-black text-neutral-800 border-b border-neutral-100 pb-2 uppercase tracking-wide">
                        III PENILAIAN INTEGRITAS MANAJEMEN
                    </h3>
                    <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
                        KAP berkepentingan untuk mengevaluasi integritas manajemen, agar KAP mendapatkan keyakinan bahwa manajemen klien dapat dipercaya. Berikut ini hal-hal yang dapat dijadikan tolok ukur untuk menilai integritas manajemen.
                    </p>

                    <div className="overflow-x-auto border border-neutral-300 rounded-lg">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-neutral-200 text-neutral-700 font-bold uppercase tracking-wider text-[10px] text-center border-b border-neutral-300">
                                    <th className="py-2 px-3 border border-neutral-300 w-12 text-center">No.</th>
                                    <th className="py-2 px-3 border border-neutral-300">Deskripsi</th>
                                    <th className="py-2 px-3 border border-neutral-300 w-28 text-center">Y/T</th>
                                    <th className="py-2 px-3 border border-neutral-300 w-96">Catatan</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white text-neutral-700">
                                {(data.section_data.section_3.questions || defaultIntegritas).map((item, idx) => {
                                    const subheaders = {
                                        0: "Standar Etika",
                                        2: "Pengalaman / Kompetensi Manajemen",
                                        5: "Perubahan-perubahan Manajemen",
                                        7: "Pengaruh Manajemen",
                                        10: "Terdapatnya Kesalahan atau Kekeliruan",
                                        11: "Pelanggaran Terhadap Hukum atau Peraturan",
                                        12: "Transaksi Dengan Pihak Yang Terkait Yang Tidak Diungkapkan"
                                    };
                                    const category = subheaders[idx];
                                    return (
                                        <React.Fragment key={idx}>
                                            {category && (
                                                <tr className="bg-neutral-100 font-extrabold border-t border-b border-neutral-300 text-neutral-800 text-[10px] uppercase">
                                                    <td colSpan="4" className="py-2 px-3 tracking-wider text-left bg-neutral-150">
                                                        {category}
                                                    </td>
                                                </tr>
                                            )}
                                            <tr className="hover:bg-neutral-50/20">
                                                <td className="py-2 px-3 border border-neutral-300 text-center font-bold text-neutral-400">
                                                    {item.no}
                                                </td>
                                                <td className="py-2 px-3 border border-neutral-300 leading-relaxed font-medium">
                                                    {defaultIntegritas[idx]?.description || item.description}
                                                </td>
                                                <td className="py-1 px-2 border border-neutral-300 text-center">
                                                    <select
                                                        value={item.value || 'Tidak'}
                                                        onChange={(e) => {
                                                            const list = [...(data.section_data.section_3.questions || defaultIntegritas)];
                                                            list[idx].value = e.target.value;
                                                            updateSectionData('section_3.questions', list);
                                                        }}
                                                        className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md py-1 px-2 text-xs text-center font-semibold bg-white text-neutral-850 transition-all duration-150"
                                                    >
                                                        <option value="Ya">Ya</option>
                                                        <option value="Tidak">Tidak</option>
                                                    </select>
                                                </td>
                                                <td className="py-1 px-2 border border-neutral-300">
                                                    <input
                                                        type="text"
                                                        value={item.notes || ''}
                                                        onChange={(e) => {
                                                            const list = [...(data.section_data.section_3.questions || defaultIntegritas)];
                                                            list[idx].notes = e.target.value;
                                                            updateSectionData('section_3.questions', list);
                                                        }}
                                                        className="w-full border border-transparent hover:border-neutral-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 p-1.5 text-xs font-semibold bg-transparent rounded transition-all duration-150"
                                                        placeholder="Catatan"
                                                    />
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4">
                        <label className="block text-xs text-neutral-500 font-semibold mb-1">Kesimpulan Penilaian Integritas</label>
                        <input
                            type="text"
                            value={data.section_data.section_3.conclusion || ''}
                            onChange={(e) => updateSectionData('section_3.conclusion', e.target.value)}
                            className="w-full custom-input p-3 text-sm bg-white"
                            placeholder="Contoh: Integritas manajemen sudah cukup memadai dalam menjalankan kegiatan usahanya."
                        />
                    </div>
                </div>

                {/* Section IV: PENILAIAN INDEPENDENSI KANTOR */}
                <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-5">
                    <h3 className="text-base font-black text-neutral-800 border-b border-neutral-100 pb-2 uppercase tracking-wide">
                        IV. PENILAIAN INDEPENDENSI KANTOR
                    </h3>
                    <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
                        Sesuai dengan standar umum kedua, auditor harus mempertahankan independensi sikap mental dalam semua hal yang berhubungan dengan perikatan. Berikut ini tolok ukur yang dapat dipakai untuk menilai independensi KAP.
                    </p>

                    <div className="overflow-x-auto border border-neutral-300 rounded-lg">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-neutral-200 text-neutral-700 font-bold uppercase tracking-wider text-[10px] text-center border-b border-neutral-300">
                                    <th className="py-2 px-3 border border-neutral-300 w-12 text-center">No.</th>
                                    <th className="py-2 px-3 border border-neutral-300">Deskripsi</th>
                                    <th className="py-2 px-3 border border-neutral-300 w-28 text-center">Y/T</th>
                                    <th className="py-2 px-3 border border-neutral-300 w-96">Catatan</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white text-neutral-700">
                                {(data.section_data.section_4.questions || defaultIndependensi).map((item, idx) => {
                                    const subheaders = {
                                        0: ["Hubungan keuangan dengan klien"],
                                        2: ["Kedudukan Dalam Entitas Klien"],
                                        5: ["Keterlibatan Dalam Usaha Yang Tidak Sesuai Dan Tidak Konsisten", "Pelaksanaan Jasa Lain Untuk Klien Audit"],
                                        7: ["Hubungan Keluarga Dan Pribadi"],
                                        8: ["Imbalan Atas Jasa Profesional"],
                                        10: ["Penerimaan Barang Atau Jasa Dari Klien"],
                                        11: ["Pemberian Barang Atau Jasa Kepada Klien"]
                                    };
                                    const categories = subheaders[idx];
                                    return (
                                        <React.Fragment key={idx}>
                                            {categories && (Array.isArray(categories) ? categories : [categories]).map((cat, catIdx) => (
                                                <tr key={catIdx} className="bg-neutral-100 font-extrabold border-t border-b border-neutral-300 text-neutral-800 text-[10px] uppercase">
                                                    <td colSpan="4" className="py-2 px-3 tracking-wider text-left bg-neutral-150">
                                                        {cat}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="hover:bg-neutral-50/20">
                                                <td className="py-2 px-3 border border-neutral-300 text-center font-bold text-neutral-400">
                                                    {item.no}
                                                </td>
                                                <td className="py-2 px-3 border border-neutral-300 leading-relaxed font-medium">
                                                    {defaultIndependensi[idx]?.description || item.description}
                                                </td>
                                                <td className="py-1 px-2 border border-neutral-300 text-center">
                                                    <select
                                                        value={item.value || 'Tidak'}
                                                        onChange={(e) => {
                                                            const list = [...(data.section_data.section_4.questions || defaultIndependensi)];
                                                            list[idx].value = e.target.value;
                                                            updateSectionData('section_4.questions', list);
                                                        }}
                                                        className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md py-1 px-2 text-xs text-center font-semibold bg-white text-neutral-850 transition-all duration-150"
                                                    >
                                                        <option value="Ya">Ya</option>
                                                        <option value="Tidak">Tidak</option>
                                                    </select>
                                                </td>
                                                <td className="py-1 px-2 border border-neutral-300">
                                                    <input
                                                        type="text"
                                                        value={item.notes || ''}
                                                        onChange={(e) => {
                                                            const list = [...(data.section_data.section_4.questions || defaultIndependensi)];
                                                            list[idx].notes = e.target.value;
                                                            updateSectionData('section_4.questions', list);
                                                        }}
                                                        className="w-full border border-transparent hover:border-neutral-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 p-1.5 text-xs font-semibold bg-transparent rounded transition-all duration-150"
                                                        placeholder="Catatan"
                                                    />
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4">
                        <label className="block text-xs text-neutral-500 font-semibold mb-1">Kesimpulan Penilaian Independensi</label>
                        <input
                            type="text"
                            value={data.section_data.section_4.conclusion || ''}
                            onChange={(e) => updateSectionData('section_4.conclusion', e.target.value)}
                            className="w-full custom-input p-3 text-sm bg-white"
                        />
                    </div>
                </div>

                {/* Section V: PENILAIAN INDEPENDENSI KANTOR */}
                <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-5">
                    <h3 className="text-base font-black text-neutral-800 border-b border-neutral-100 pb-2 uppercase tracking-wide">
                        V. PENILAIAN INDEPENDENSI KANTOR
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs text-neutral-500 font-semibold mb-1">a. Nama Partner/Staf KAP yang mengintroduksi klien</label>
                            <input
                                type="text"
                                value={data.section_data.section_5?.staf_introduksi || ''}
                                onChange={(e) => updateSectionData('section_5.staf_introduksi', e.target.value)}
                                className="w-full custom-input p-3 text-sm bg-white"
                                placeholder="Masukkan nama partner/staf KAP..."
                            />
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <label className="block text-xs text-neutral-500 font-bold uppercase">b. Sumber referensi:</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                "Pendekatan Pribadi",
                                "Klien lain",
                                "Pengacara/",
                                "Perusahaan",
                                "Agen asura",
                                "Lainnya"
                            ].map((label, idx) => (
                                <div key={idx} className="space-y-1">
                                    <label className="block text-[10px] text-neutral-400 font-bold uppercase">{idx + 1}) {label}</label>
                                    <input
                                        type="text"
                                        value={data.section_data.section_5?.referensi[idx] || ''}
                                        onChange={(e) => {
                                            const list = [...data.section_data.section_5.referensi];
                                            list[idx] = e.target.value;
                                            updateSectionData('section_5.referensi', list);
                                        }}
                                        className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg p-2.5 text-xs bg-white font-semibold transition-all duration-150"
                                        placeholder="Masukkan keterangan referensi..."
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <label className="block text-xs font-bold text-neutral-700 uppercase">c. Prosedur-prosedur lainnya:</label>
                        <textarea
                            value={typeof data.section_data.section_5?.prosedur_lain === 'string' 
                                ? data.section_data.section_5.prosedur_lain 
                                : (Array.isArray(data.section_data.section_5?.prosedur_lain) ? data.section_data.section_5.prosedur_lain.filter(Boolean).join('\n') : '')}
                            onChange={(e) => updateSectionData('section_5.prosedur_lain', e.target.value)}
                            className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg p-2.5 text-xs bg-white font-semibold text-neutral-800 shadow-2xs h-24 transition-all duration-150"
                            placeholder="Masukkan rincian prosedur lainnya..."
                        />
                    </div>

                    <div className="space-y-3 pt-2">
                        <label className="block text-xs font-bold text-neutral-700 uppercase">d. Bantuan Klien</label>
                        <p className="text-xs text-neutral-500 font-semibold">
                            Daftar berikut dapat dipakai untuk mengidentifikasi kemungkinan bantuan yang bisa diberikan klien, terutama dalam penyediaan daftar-daftar.
                        </p>
                        <div className="overflow-x-auto border border-neutral-300 rounded-lg">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-neutral-200 text-neutral-700 font-bold uppercase tracking-wider text-[10px] text-center border-b border-neutral-300">
                                        <th className="py-2 px-3 border border-neutral-300 w-12 text-center">No</th>
                                        <th className="py-2 px-3 border border-neutral-300">Transaksi</th>
                                        <th className="py-2 px-3 border border-neutral-300 w-28 text-center">Y/T</th>
                                        <th className="py-2 px-3 border border-neutral-300 w-96">Catatan Peruntukan</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white text-neutral-700">
                                    {(data.section_data.section_5?.bantuan_klien || defaultBantuanKlien).map((item, idx) => {
                                        const subheaders = {
                                            0: "UMUM",
                                            5: "ASET",
                                            14: "KEWAJIBAN",
                                            18: "EKUITAS"
                                        };
                                        const category = subheaders[idx];
                                        return (
                                            <React.Fragment key={idx}>
                                                {category && (
                                                    <tr className="bg-neutral-100 font-extrabold border-t border-b border-neutral-300 text-neutral-800 text-[10px] uppercase">
                                                        <td colSpan="4" className="py-2 px-3 tracking-wider text-left bg-neutral-150">
                                                            {category}
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr className="hover:bg-neutral-50/20">
                                                    <td className="py-2 px-3 border border-neutral-300 text-center font-bold text-neutral-400">
                                                        {item.no}
                                                    </td>
                                                    <td className="py-2 px-3 border border-neutral-300 leading-relaxed font-medium">
                                                        {defaultBantuanKlien[idx]?.description || item.description}
                                                    </td>
                                                    <td className="py-1 px-2 border border-neutral-300 text-center">
                                                        <select
                                                            value={item.value || 'Ya'}
                                                            onChange={(e) => {
                                                                const list = [...(data.section_data.section_5.bantuan_klien || defaultBantuanKlien)];
                                                                list[idx].value = e.target.value;
                                                                updateSectionData('section_5.bantuan_klien', list);
                                                            }}
                                                            className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md py-1 px-2 text-xs text-center font-semibold bg-white text-neutral-850 transition-all duration-150"
                                                        >
                                                            <option value="Ya">Ya</option>
                                                            <option value="Tidak">Tidak</option>
                                                        </select>
                                                    </td>
                                                    <td className="py-1 px-2 border border-neutral-300">
                                                        <input
                                                            type="text"
                                                            value={item.notes || ''}
                                                            onChange={(e) => {
                                                                const list = [...(data.section_data.section_5.bantuan_klien || defaultBantuanKlien)];
                                                                list[idx].notes = e.target.value;
                                                                updateSectionData('section_5.bantuan_klien', list);
                                                            }}
                                                            className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md py-1 px-2 text-xs bg-white text-neutral-850 transition-all duration-150"
                                                            placeholder="Catatan Peruntukan"
                                                        />
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Section VI: PENENTUAN SEBUAH ENTITAS TERMASUK KATEGORI BISNIS KECIL */}
                <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
                    <h3 className="text-base font-black text-neutral-800 border-b border-neutral-100 pb-2 uppercase tracking-wide">
                        VI. PENENTUAN SEBUAH ENTITAS TERMASUK KATEGORI BISNIS KECIL
                    </h3>
                    <div className="space-y-2 text-xs text-neutral-500 font-semibold leading-relaxed">
                        <p>
                            Tujuan penentuan sebuah entitas sebagai bisnis kecil adalah untuk membantu auditor dalam menilai risiko audit. Bisnis kecil biasanya tidak mempunyai struktur pengendalian intern yang memadai sehingga tidak memungkinkan auditor untuk menilai efektivitas pengendalian intern untuk tujuan audit. Dengan demikian biasanya pendekatan audit untuk bisnis kecil adalah pendekatan substantif. Auditor harus hati-hati dalam melihat risiko audit dengan tidak adanya struktur pengendalian yang memadai.
                        </p>
                        <p>
                            Berikut ini kuesioner untuk menentukan apakah sebuah entitas termasuk dalam kategori bisnis kecil atau tidak.
                        </p>
                    </div>
                    <div className="overflow-x-auto border border-neutral-300 rounded-lg">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-neutral-200 text-neutral-700 font-bold uppercase tracking-wider text-[10px] text-center border-b border-neutral-300">
                                    <th className="py-2 px-3 border border-neutral-300 w-12 text-center">No.</th>
                                    <th className="py-2 px-3 border border-neutral-300">Uraian Pertanyaan</th>
                                    <th className="py-2 px-3 border border-neutral-300 w-28 text-center">Y/T/N</th>
                                    <th className="py-2 px-3 border border-neutral-300 w-96">Komentar</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white text-neutral-700">
                                {(data.section_data.section_6?.questions || defaultSmallBusiness).map((item, idx) => (
                                    <tr key={idx} className="hover:bg-neutral-50/20">
                                        <td className="py-2 px-3 border border-neutral-300 text-center font-bold text-neutral-400">
                                            {item.no}.
                                        </td>
                                        <td className="py-2 px-3 border border-neutral-300 leading-relaxed font-medium">
                                            {defaultSmallBusiness[idx]?.description || item.description}
                                        </td>
                                        <td className="py-1 px-2 border border-neutral-300 text-center">
                                            <select
                                                value={item.value || 'T'}
                                                onChange={(e) => {
                                                    const list = [...(data.section_data.section_6.questions || defaultSmallBusiness)];
                                                    list[idx].value = e.target.value;
                                                    updateSectionData('section_6.questions', list);
                                                }}
                                                className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md py-1 px-2 text-xs text-center font-semibold bg-white text-neutral-855 transition-all duration-150"
                                            >
                                                <option value="Y">Y</option>
                                                <option value="T">T</option>
                                                <option value="N">N</option>
                                            </select>
                                        </td>
                                        <td className="py-1 px-2 border border-neutral-300">
                                            <input
                                                type="text"
                                                value={item.notes || ''}
                                                onChange={(e) => {
                                                    const list = [...(data.section_data.section_6.questions || defaultSmallBusiness)];
                                                    list[idx].notes = e.target.value;
                                                    updateSectionData('section_6.questions', list);
                                                }}
                                                className="w-full border border-transparent hover:border-neutral-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 p-1.5 text-xs font-semibold bg-transparent rounded transition-all duration-150"
                                                placeholder="Komentar"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pt-4 border-t border-neutral-200 space-y-3">
                        <label className="block text-xs text-neutral-500 font-bold uppercase mb-2">Kesimpulan Kriteria Bisnis Kecil</label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-neutral-700 hover:text-neutral-900">
                                <input
                                    type="radio"
                                    name="small_business_conclusion"
                                    value="Tidak termasuk Kategori entitas dengan bisnis kecil untuk tujuan audit"
                                    checked={data.section_data.section_6?.conclusion === 'Tidak termasuk Kategori entitas dengan bisnis kecil untuk tujuan audit'}
                                    onChange={(e) => updateSectionData('section_6.conclusion', e.target.value)}
                                    className="w-4 h-4 text-blue-600 border-neutral-300 focus:ring-blue-500"
                                />
                                <span>Tidak termasuk Kategori entitas dengan bisnis kecil untuk tujuan audit</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-neutral-700 hover:text-neutral-900">
                                <input
                                    type="radio"
                                    name="small_business_conclusion"
                                    value="Kategori entitas dengan bisnis kecil untuk tujuan audit"
                                    checked={data.section_data.section_6?.conclusion === 'Kategori entitas dengan bisnis kecil untuk tujuan audit'}
                                    onChange={(e) => updateSectionData('section_6.conclusion', e.target.value)}
                                    className="w-4 h-4 text-blue-600 border-neutral-300 focus:ring-blue-500"
                                />
                                <span>Kategori entitas dengan bisnis kecil untuk tujuan audit</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Section B: Kesimpulan Evaluasi Penerimaan / Keberlanjutan Hubungan Dengan Klien */}
                <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-5">
                    <h3 className="text-base font-black text-neutral-800 border-b border-neutral-100 pb-2 uppercase tracking-wide">
                        B. Kesimpulan Evaluasi Penerimaan / Keberlanjutan Hubungan Dengan Klien
                    </h3>

                    <div className="overflow-x-auto border border-neutral-300 rounded-lg">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-neutral-200 text-neutral-700 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-300">
                                    <th className="py-2 px-3 border border-neutral-300 w-1/3 text-left">Aspek Evaluasi</th>
                                    <th className="py-2 px-3 border border-neutral-300 text-left">Kesimpulan Evaluasi Aspek</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white text-neutral-700">
                                <tr>
                                    <td className="py-2 px-3 border border-neutral-300 font-bold bg-neutral-50/20 text-neutral-600">Integritas Manajemen</td>
                                    <td className="py-1.5 px-2 border border-neutral-300">
                                        <input
                                            type="text"
                                            value={data.section_data.section_b.integritas || ''}
                                            onChange={(e) => updateSectionData('section_b.integritas', e.target.value)}
                                            className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md py-1 px-2 text-xs text-neutral-850 bg-white transition-all duration-150"
                                            placeholder="Masukkan kesimpulan evaluasi integritas manajemen..."
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-3 border border-neutral-300 font-bold bg-neutral-50/20 text-neutral-600">Independensi Kantor</td>
                                    <td className="py-1.5 px-2 border border-neutral-300">
                                        <input
                                            type="text"
                                            value={data.section_data.section_b.independensi || ''}
                                            onChange={(e) => updateSectionData('section_b.independensi', e.target.value)}
                                            className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md py-1 px-2 text-xs text-neutral-850 bg-white transition-all duration-150"
                                            placeholder="Masukkan kesimpulan evaluasi independensi kantor..."
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-3 border border-neutral-300 font-bold bg-neutral-50/20 text-neutral-600">Dapat Atau Tidaknya Calon Klien Diaudit</td>
                                    <td className="py-1.5 px-2 border border-neutral-300">
                                        <input
                                            type="text"
                                            value={data.section_data.section_b.auditable || ''}
                                            onChange={(e) => updateSectionData('section_b.auditable', e.target.value)}
                                            className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md py-1 px-2 text-xs text-neutral-850 bg-white transition-all duration-150"
                                            placeholder="Masukkan kesimpulan evaluasi kemampuan audit klien..."
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-3 border border-neutral-300 font-bold bg-neutral-50/20 text-neutral-600">Risiko Penugasan</td>
                                    <td className="py-1.5 px-2 border border-neutral-300">
                                        <input
                                            type="text"
                                            value={data.section_data.section_b.risiko || ''}
                                            onChange={(e) => updateSectionData('section_b.risiko', e.target.value)}
                                            className="w-full border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md py-1 px-2 text-xs text-neutral-850 bg-white transition-all duration-150"
                                            placeholder="Masukkan kesimpulan evaluasi risiko penugasan..."
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
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

                    <div className="border-t border-neutral-200 pt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-3 border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl text-xs font-bold transition-all duration-150 active:scale-[0.98]"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="btn-glow-emerald text-sm font-semibold px-6 py-3 rounded-xl flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {processing ? 'Menyimpan...' : formToEdit ? 'Simpan Perubahan' : 'Simpan Draf Laporan'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
