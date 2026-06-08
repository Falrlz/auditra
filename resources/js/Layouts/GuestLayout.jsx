import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#f5f5f7] px-4 py-12 overflow-hidden selection:bg-[#0071e3] selection:text-white">
            {/* Soft fluid Apple-style gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[130px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/15 blur-[140px] pointer-events-none" />
            <div className="absolute top-[40%] right-[10%] w-[40%] h-[40%] rounded-full bg-purple-400/8 blur-[110px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-2xl border border-neutral-200/80 p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.02)] animate-fade-in-up">
                {/* Brand Logo Header */}
                <div className="mb-8 flex flex-col items-center">
                    <Link href="/" className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-[#0071e3] flex items-center justify-center shadow-md hover:scale-[1.04] transition duration-200">
                            <ApplicationLogo className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                            Auditra
                        </span>
                    </Link>
                </div>

                {children}
            </div>
        </div>
    );
}
