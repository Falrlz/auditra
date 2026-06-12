import React, { useEffect, useRef, useState } from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link } from '@inertiajs/react';

// Reusable Scroll-Triggered Reveal Wrapper
function RevealOnScroll({ children, delay = '0ms', duration = '700ms', className = '' }) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            {
                threshold: 0.1, // Triggers when 10% of the element is visible
                rootMargin: '0px 0px -40px 0px' // Adjusts triggering threshold
            }
        );

        const currentRef = ref.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, []);

    return (
        <div
            ref={ref}
            className={`transition-all ease-out ${className}`}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                transitionDuration: duration,
                transitionDelay: delay,
                pointerEvents: isVisible ? 'auto' : 'none'
            }}
        >
            {children}
        </div>
    );
}

export default function Welcome({ auth, laravelVersion, phpVersion }) {
    return (
        <>
            <Head title="Auditra" />

            <div className="min-h-screen app-bg-gradient text-neutral-800 font-sans selection:bg-[#0071e3] selection:text-white flex flex-col justify-between overflow-x-hidden">
                {/* Header */}
                <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200/60 transition-all">
                    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-[#0071e3] flex items-center justify-center shadow-md">
                                <ApplicationLogo className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Auditra
                            </span>
                        </div>

                        <nav className="flex items-center gap-4">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="px-4 py-2 bg-[#0071e3] text-white hover:bg-[#0077ed] text-sm font-semibold rounded-lg shadow-sm hover:scale-[1.02] active:scale-[0.98] transition"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:text-[#1d1d1f] hover:bg-neutral-100/60 rounded-lg transition"
                                    >
                                        Masuk
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col lg:flex-row items-center gap-12">
                    {/* Left text side with slower, premium Apple animations */}
                    <div className="flex-1 space-y-8 text-center lg:text-left">
                        <RevealOnScroll delay="150ms" duration="1000ms">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#1d1d1f] tracking-tight leading-tight">
                                Audit Pra-Perikatan <br />
                                <span className="text-[#0071e3]">Lebih Sederhana & Otomatis.</span>
                            </h1>
                        </RevealOnScroll>

                        <RevealOnScroll delay="300ms" duration="1000ms">
                            <div className="space-y-8">
                                <p className="text-lg text-[#86868b] max-w-xl mx-auto lg:mx-0">
                                    Berdayakan tim audit Anda dengan alur kerja yang bersih dan terstruktur. Kelola daftar periksa SA 210, evaluasi latar belakang, kelangsungan usaha (going concern), dan alur persetujuan bertingkat dalam satu tempat.
                                </p>

                                <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                                    {auth.user ? (
                                        <Link
                                            href={route('dashboard')}
                                            className="px-8 py-3.5 bg-[#0071e3] text-white hover:bg-[#0077ed] text-base font-semibold rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2"
                                        >
                                            Buka Dashboard
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                            </svg>
                                        </Link>
                                    ) : (
                                        <>
                                            <Link
                                                href={route('login')}
                                                className="px-8 py-3.5 bg-[#0071e3] text-white hover:bg-[#0077ed] text-base font-semibold rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center"
                                            >
                                                Mulai Sekarang
                                            </Link>
                                            <a
                                                href="#features"
                                                className="px-8 py-3.5 border border-neutral-200 bg-white text-neutral-600 hover:text-[#1d1d1f] hover:bg-neutral-50 text-base font-semibold rounded-xl transition flex items-center justify-center"
                                            >
                                                Pelajari Selengkapnya
                                            </a>
                                        </>
                                    )}
                                </div>
                            </div>
                        </RevealOnScroll>
                    </div>

                    {/* Dashboard Preview Card Mockup */}
                    <div className="flex-1 w-full max-w-lg lg:max-w-none">
                        <RevealOnScroll delay="600ms" duration="1200ms">
                            <div className="glass-panel p-6 rounded-2xl relative shadow-2xl border border-white/60">
                                {/* Window buttons */}
                                <div className="flex gap-1.5 mb-6">
                                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                                    <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                                </div>

                                {/* Mock Layout */}
                                <div className="space-y-6">
                                    {/* Header Info */}
                                    <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
                                        <div>
                                            <div className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Survei Aktif</div>
                                            <div className="text-base font-bold text-neutral-800">PT Eastparc Hotel Tbk</div>
                                        </div>
                                        <div className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-100 capitalize">
                                            Ditinjau
                                        </div>
                                    </div>

                                    {/* Stepper Mockup */}
                                    <div className="flex items-center gap-1.5 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 overflow-x-auto">
                                        {[
                                            { id: 1, label: 'SA 210', active: false, done: true },
                                            { id: 2, label: 'Info Bisnis', active: true, done: false },
                                            { id: 3, label: 'Risiko', active: false, done: false },
                                        ].map((s) => (
                                            <div key={s.id} className="flex items-center gap-1 text-[10px] font-semibold">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] ${s.active ? 'bg-[#0071e3] text-white' : s.done ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-neutral-200 text-neutral-500'
                                                    }`}>
                                                    {s.done ? '✓' : s.id}
                                                </div>
                                                <span className={s.active ? 'text-[#0071e3]' : 'text-neutral-500'}>{s.label}</span>
                                                {s.id < 3 && <div className="w-4 h-[1px] bg-neutral-200" />}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Form Group Mockup */}
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <div className="text-[10px] text-neutral-400 font-bold uppercase mb-1">Tahun Buku</div>
                                                <div className="bg-white border border-neutral-200 rounded-lg p-2 text-xs text-neutral-700 font-medium">31 Des 2024</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-neutral-400 font-bold uppercase mb-1">Tingkat Risiko</div>
                                                <div className="bg-white border border-neutral-200 rounded-lg p-2 text-xs text-neutral-700 font-medium flex items-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                                    Tinggi
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-neutral-400 font-bold uppercase mb-1">Rekomendasi Penugasan</div>
                                            <div className="bg-[#34c759]/10 border border-[#34c759]/20 rounded-lg p-2.5 text-xs text-green-700 font-semibold flex items-center justify-between">
                                                <span>Klien Diterima</span>
                                                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white text-green-600 border border-[#34c759]/20">Disetujui</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </RevealOnScroll>
                    </div>
                </main>

                {/* Features Section */}
                <section id="features" className="bg-[#ececf1] border-t border-b border-neutral-300/60 py-20">
                    <div className="max-w-7xl mx-auto px-6">
                        <RevealOnScroll duration="800ms">
                            <div className="text-center max-w-2xl mx-auto mb-16">
                                <h2 className="text-3xl font-bold text-[#1d1d1f] tracking-tight">
                                    Disesuaikan dengan standar audit profesional.
                                </h2>
                                <p className="mt-4 text-[#86868b] text-base">
                                    Nikmati alur kerja persetujuan yang terstruktur dari awal hingga akhir, dirancang khusus untuk memenuhi kebutuhan audit formal.
                                </p>
                            </div>
                        </RevealOnScroll>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                            <RevealOnScroll delay="100ms" duration="800ms" className="h-full flex flex-col">
                                <div className="bg-white p-8 rounded-3xl border border-neutral-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:border-[#0071e3]/30 transition-all hover:scale-[1.01] hover:-translate-y-1 duration-300 flex-1 flex flex-col justify-start">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0071e3] border border-blue-100 flex items-center justify-center mb-6">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-[#1d1d1f] mb-2">Dokumentasi SA 210</h3>
                                    <p className="text-sm text-[#86868b] leading-relaxed">
                                        Isi dan tinjau parameter perikatan audit dengan cepat sesuai dengan ketentuan Standar Auditing 210.
                                    </p>
                                </div>
                            </RevealOnScroll>

                            <RevealOnScroll delay="250ms" duration="800ms" className="h-full flex flex-col">
                                <div className="bg-white p-8 rounded-3xl border border-neutral-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:border-[#0071e3]/30 transition-all hover:scale-[1.01] hover:-translate-y-1 duration-300 flex-1 flex flex-col justify-start">
                                    <div className="w-12 h-12 rounded-xl bg-green-50 text-[#34c759] border border-green-100 flex items-center justify-center mb-6">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296a3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-[#1d1d1f] mb-2">Persetujuan Bertingkat</h3>
                                    <p className="text-sm text-[#86868b] leading-relaxed">
                                        Alur kerja bertahap yang mengalirkan draf survei dari Anggota (pembuat) ke Ketua Tim (pemeriksa) hingga Supervisor (penyetuju).
                                    </p>
                                </div>
                            </RevealOnScroll>

                            <RevealOnScroll delay="400ms" duration="800ms" className="h-full flex flex-col">
                                <div className="bg-white p-8 rounded-3xl border border-neutral-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:border-[#0071e3]/30 transition-all hover:scale-[1.01] hover:-translate-y-1 duration-300 flex-1 flex flex-col justify-start">
                                    <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center mb-6">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-[#1d1d1f] mb-2">Parsing Lembar Kerja ODS</h3>
                                    <p className="text-sm text-[#86868b] leading-relaxed">
                                        Isi otomatis kuesioner audit secara instan langsung dari berkas spreadsheet `.ods` (a10.ods) standar.
                                    </p>
                                </div>
                            </RevealOnScroll>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-[#f5f5f7] border-t border-neutral-200 py-16 text-xs text-[#86868b] w-full">
                    <div className="max-w-7xl mx-auto px-6">
                        {/* Footer Links Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12">
                            {/* Col 1: Brand Info */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-neutral-800">
                                    <ApplicationLogo className="w-5 h-5 text-[#0071e3]" />
                                    <span className="font-bold text-sm">Auditra</span>
                                </div>
                                <p className="leading-relaxed">
                                    Sistem informasi terpadu untuk menyederhanakan alur persetujuan formulir perikatan dan survei audit sesuai dengan standar profesional.
                                </p>
                            </div>

                            {/* Col 2: Navigasi */}
                            <div>
                                <h4 className="font-semibold text-neutral-800 uppercase tracking-wider mb-4 text-[10px]">Navigasi Halaman</h4>
                                <ul className="space-y-2.5">
                                    <li>
                                        <Link href={route('login')} className="hover:underline hover:text-neutral-700 transition">Masuk ke Sistem</Link>
                                    </li>
                                    <li>
                                        <a href="#features" className="hover:underline hover:text-neutral-700 transition">Fitur Utama</a>
                                    </li>
                                </ul>
                            </div>

                            {/* Col 3: Referensi Standar */}
                            <div>
                                <h4 className="font-semibold text-neutral-800 uppercase tracking-wider mb-4 text-[10px]">Ketentuan & Standar</h4>
                                <ul className="space-y-2.5">
                                    <li><span className="cursor-default">Standar Auditing (SA 210)</span></li>
                                    <li><span className="cursor-default">Survei Penerimaan Klien (A10)</span></li>
                                    <li><span className="cursor-default">Evaluasi Independensi KAP</span></li>
                                </ul>
                            </div>

                            {/* Col 4: Dukungan & Bantuan */}
                            <div>
                                <h4 className="font-semibold text-neutral-800 uppercase tracking-wider mb-4 text-[10px]">Kontak KAP</h4>
                                <p className="leading-relaxed mb-2">Jika Anda mengalami kendala teknis atau membutuhkan bantuan akses, hubungi Administrator sistem.</p>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
