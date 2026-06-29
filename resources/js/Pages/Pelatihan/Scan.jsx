import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

export default function Scan({ auth }) {
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);
    const [pasteValue, setPasteValue] = useState('');
    const [scanError, setScanError] = useState('');
    const [cameraDevices, setCameraDevices] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState('');
    const qrInstanceRef = useRef(null);

    // Load HTML5-QRCode script dynamically from CDN
    useEffect(() => {
        const scriptId = 'html5-qrcode-cdn-script';
        let script = document.getElementById(scriptId);

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = "https://unpkg.com/html5-qrcode";
            script.async = true;
            script.onload = () => setScriptLoaded(true);
            document.body.appendChild(script);
        } else {
            setScriptLoaded(true);
        }

        return () => {
            // Clean up scanner if active on unmount
            if (qrInstanceRef.current && qrInstanceRef.current.isScanning) {
                qrInstanceRef.current.stop().catch(console.error);
            }
        };
    }, []);

    // Get list of cameras when script is loaded
    useEffect(() => {
        if (!scriptLoaded) return;

        window.Html5Qrcode?.getCameras()
            .then(devices => {
                if (devices && devices.length > 0) {
                    setCameraDevices(devices);
                    // Default to first camera or environment back camera
                    const backCamera = devices.find(device => 
                        device.label.toLowerCase().includes('back') || 
                        device.label.toLowerCase().includes('rear') || 
                        device.label.toLowerCase().includes('environment')
                    );
                    setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
                }
            })
            .catch(err => {
                console.error("Gagal mendapatkan perangkat kamera: ", err);
            });
    }, [scriptLoaded]);

    const startScanner = async () => {
        if (!scriptLoaded || !window.Html5Qrcode) {
            setScanError('Gagal memuat pustaka scanner. Silakan coba beberapa saat lagi.');
            return;
        }

        try {
            setScanError('');
            const html5QrCode = new window.Html5Qrcode("qr-reader-container");
            qrInstanceRef.current = html5QrCode;

            const qrCodeSuccessCallback = (decodedText) => {
                // Play audio beep sound
                try {
                    const beep = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAAG");
                    beep.play().catch(() => {});
                } catch (e) {}

                // Stop scanner
                html5QrCode.stop()
                    .then(() => {
                        setScannerActive(false);
                        handleRedirect(decodedText);
                    })
                    .catch(err => {
                        console.error("Gagal mematikan kamera: ", err);
                        handleRedirect(decodedText);
                    });
            };

            const config = { 
                fps: 10, 
                qrbox: (width, height) => {
                    const size = Math.min(width, height) * 0.7;
                    return { width: size, height: size };
                }
            };

            const cameraConstraint = selectedCameraId ? selectedCameraId : { facingMode: "environment" };

            await html5QrCode.start(
                cameraConstraint, 
                config, 
                qrCodeSuccessCallback,
                (errorMessage) => {
                    // Suppress continuous scan noise verbose errors
                }
            );

            setScannerActive(true);
        } catch (err) {
            console.error("Gagal mengaktifkan kamera: ", err);
            setScanError('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.');
            setScannerActive(false);
        }
    };

    const stopScanner = async () => {
        if (qrInstanceRef.current) {
            try {
                await qrInstanceRef.current.stop();
                setScannerActive(false);
            } catch (err) {
                console.error("Gagal mematikan scanner: ", err);
            }
        }
    };

    const handleRedirect = (scannedText) => {
        let targetUrl = scannedText.trim();

        // 1. If scannedText is just a number (ID), redirect to /pelatihan/{id}/presensi
        if (/^\d+$/.test(targetUrl)) {
            router.visit(route('pelatihan.presensi', targetUrl));
            return;
        }

        // 2. If scannedText is a full URL containing the path, check and redirect
        try {
            if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://') || targetUrl.includes('/pelatihan/')) {
                // Visit directly if it is on the same domain or starts with path
                router.visit(targetUrl);
                return;
            }
        } catch (e) {
            console.error(e);
        }

        setScanError('Format QR Code tidak valid. Harap pindai QR Code presensi pelatihan Auditra.');
    };

    const handlePasteSubmit = (e) => {
        e.preventDefault();
        setScanError('');
        const val = pasteValue.trim();

        if (!val) {
            setScanError('Silakan tempel link atau masukkan Kode Pelatihan.');
            return;
        }

        handleRedirect(val);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0071e3] border border-blue-100 flex items-center justify-center shadow-sm shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 14v2m-3-3h2m3-3h2m-3-3h2M14 17v2m3-3h2m-3 3h2" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-[#1d1d1f] tracking-tight">Presensi Kehadiran Pelatihan</h2>
                            <p className="text-xs text-neutral-400 font-medium font-sans">Pindai QR Code atau masukkan tautan presensi pelatihan aktif.</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Pindai QR Code Pelatihan" />

            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
                    
                    {/* Error Banner */}
                    {scanError && (
                        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">!</span>
                                <span className="text-xs font-bold">{scanError}</span>
                            </div>
                            <button onClick={() => setScanError('')} className="text-rose-500 hover:text-rose-800 font-bold">&times;</button>
                        </div>
                    )}

                    {/* Stacked Cards Layout identical style as daily presensi */}
                    <div className="flex flex-col gap-6">
                        
                        {/* Card 1: QR Scanner */}
                        <div className="glass-panel rounded-2xl p-8 flex flex-col justify-between space-y-6">
                            
                            <div className="border-b border-neutral-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-neutral-800">Metode 1: Pindai QR Code</h3>
                                    <p className="text-xs text-neutral-500 mt-1">Gunakan kamera perangkat Anda untuk memindai QR Code pada proyektor atau lembar pelatihan.</p>
                                </div>

                                {/* Camera selection dropdown */}
                                {cameraDevices.length > 1 && !scannerActive && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Kamera:</span>
                                        <select
                                            value={selectedCameraId}
                                            onChange={e => setSelectedCameraId(e.target.value)}
                                            className="text-[10px] font-bold rounded-lg border border-neutral-200 py-1.5 px-3 focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
                                        >
                                            {cameraDevices.map(device => (
                                                <option key={device.id} value={device.id}>
                                                    {device.label || `Kamera ${cameraDevices.indexOf(device) + 1}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Viewfinder container */}
                            <div className="w-full flex justify-center">
                                <div className="w-full aspect-square max-w-[320px] bg-neutral-900 rounded-xl relative overflow-hidden flex items-center justify-center border border-neutral-200 shadow-inner group">
                                    <div id="qr-reader-container" className="w-full h-full object-cover"></div>

                                    {/* Locked View state */}
                                    {!scannerActive && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/85 text-center p-6 space-y-4">
                                            <div className="w-14 h-14 rounded-xl border border-neutral-700 bg-neutral-900/50 flex items-center justify-center text-neutral-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                                                </svg>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs font-bold text-neutral-400">Pindai QR Presensi Pelatihan</span>
                                                <p className="text-[10px] text-neutral-500 max-w-[180px] mx-auto leading-relaxed">Klik tombol di bawah untuk memulai kamera scanner.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* active scanning frame overlays */}
                                    {scannerActive && (
                                        <div className="absolute inset-0 border-2 border-transparent pointer-events-none flex items-center justify-center">
                                            <div className="w-[70%] h-[70%] border-2 border-emerald-500 rounded-xl shadow-[0_0_0_999px_rgba(0,0,0,0.5)] relative">
                                                {/* laser scan animation */}
                                                <div className="absolute top-0 left-0 w-full h-[2.5px] bg-emerald-400 shadow shadow-emerald-400 animate-scan"></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Active toggle buttons */}
                            <div className="w-full flex justify-center pt-2 border-t border-neutral-100">
                                {scannerActive ? (
                                    <button
                                        onClick={stopScanner}
                                        className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white font-extrabold py-3.5 px-8 rounded-xl shadow transition duration-200 text-xs uppercase tracking-wider"
                                    >
                                        Matikan Kamera
                                    </button>
                                ) : (
                                    <button
                                        onClick={startScanner}
                                        className="w-full sm:w-auto bg-[#0071e3] hover:bg-blue-600 text-white font-extrabold py-3.5 px-8 rounded-xl shadow transition duration-200 text-xs uppercase tracking-wider"
                                    >
                                        Mulai Kamera Pindai
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Card 2: Paste Link Form */}
                        <div className="glass-panel rounded-2xl p-8 flex flex-col justify-between space-y-6">
                            <div className="border-b border-neutral-100 pb-4">
                                <h3 className="text-lg font-bold text-neutral-800">Metode 2: Input Tautan</h3>
                                <p className="text-xs text-neutral-500 mt-1">Tempelkan URL presensi pelatihan atau cukup masukkan ID pelatihan untuk memproses.</p>
                            </div>

                            <form onSubmit={handlePasteSubmit} className="space-y-4">
                                <div className="p-4 rounded-xl bg-neutral-50/50 border border-neutral-200/50 flex flex-col gap-4">
                                    <div className="space-y-1.5 w-full">
                                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Tautan Presensi / ID Pelatihan</label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: 1  atau  http://.../pelatihan/1/presensi"
                                            value={pasteValue}
                                            onChange={e => setPasteValue(e.target.value)}
                                            className="w-full rounded-xl border border-neutral-200 text-xs py-3 px-3.5 focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] placeholder-neutral-400"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 flex justify-start">
                                    <button
                                        type="submit"
                                        className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold py-3.5 px-8 rounded-xl shadow transition duration-200 text-xs uppercase tracking-wider"
                                    >
                                        Buka Halaman Presensi
                                    </button>
                                </div>
                            </form>
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
