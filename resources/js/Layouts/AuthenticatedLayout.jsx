import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [showingMobileSidebar, setShowingMobileSidebar] = useState(false);

    const menuItems = [
        {
            name: 'Dashboard',
            href: route('dashboard'),
            active: route().current('dashboard'),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
            ),
        },
        {
            name: 'Profil Saya',
            href: route('profile.edit'),
            active: route().current('profile.edit'),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
            ),
        },
    ];

    const sidebarContent = (
        <div className="flex flex-col h-full bg-white/95 backdrop-blur-xl border-r border-neutral-200/80">
            {/* Logo */}
            <div className="h-16 px-6 border-b border-neutral-100 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-[#0071e3] flex items-center justify-center shadow-md">
                    <ApplicationLogo className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Auditra
                </span>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                {menuItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition duration-200 ${
                            item.active
                                ? 'bg-[#0071e3] text-white shadow-md shadow-[#0071e3]/10'
                                : 'text-neutral-600 hover:text-[#1d1d1f] hover:bg-neutral-100'
                        }`}
                    >
                        <span className={item.active ? 'text-white' : 'text-neutral-400'}>
                            {item.icon}
                        </span>
                        {item.name}
                    </Link>
                ))}
            </nav>

            {/* Bottom Profile card */}
            <div className="p-4 border-t border-neutral-100 bg-neutral-50/50">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left overflow-hidden">
                        <span className="block text-xs font-bold text-neutral-800 truncate">{user.name}</span>
                        <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-[#0071e3] border border-blue-100 capitalize font-bold mt-0.5">
                            {user.role.replace('_', ' ')}
                        </span>
                    </div>
                </div>

                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-red-50 text-neutral-600 hover:text-red-600 border border-neutral-200/60 hover:border-red-100 rounded-xl text-xs font-bold transition duration-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    Keluar Sistem
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen app-bg-gradient text-neutral-800 selection:bg-[#0071e3] selection:text-white flex">
            {/* Desktop Sidebar (Left-only) */}
            <aside className="hidden md:block w-64 h-screen sticky top-0 shrink-0 z-40">
                {sidebarContent}
            </aside>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="md:hidden h-16 border-b border-neutral-200/60 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
                    <button
                        onClick={() => setShowingMobileSidebar(true)}
                        className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 active:bg-neutral-200/80 transition"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-[#0071e3] flex items-center justify-center shadow-md">
                            <ApplicationLogo className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Auditra
                        </span>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                </header>

                {/* Off-canvas Mobile Sidebar Overlay */}
                {showingMobileSidebar && (
                    <div className="fixed inset-0 z-50 md:hidden flex">
                        {/* Backdrop */}
                        <div
                            onClick={() => setShowingMobileSidebar(false)}
                            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity"
                        />
                        {/* Slide drawer */}
                        <div className="relative w-64 max-w-xs h-full bg-white shadow-xl animate-fade-in-up">
                            {/* Close button inside drawer */}
                            <button
                                onClick={() => setShowingMobileSidebar(false)}
                                className="absolute top-4 right-4 p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <div className="h-full flex flex-col">
                                {sidebarContent}
                            </div>
                        </div>
                    </div>
                )}

                {/* Page Title & Breadcrumb Block */}
                {header && (
                    <div className="pt-8 pb-2 px-6 sm:px-8">
                        <div className="max-w-7xl mx-auto">
                            {header}
                        </div>
                    </div>
                )}

                {/* Content Panel */}
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
