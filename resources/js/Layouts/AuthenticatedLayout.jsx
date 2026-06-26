import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [showingMobileSidebar, setShowingMobileSidebar] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sidebar-collapsed') === 'true';
        }
        return false;
    });

    const pageUrl = usePage().url;
    const hasUsersQuery = pageUrl.includes('tab=users');

    const toggleSidebar = () => {
        setIsSidebarCollapsed((prev) => {
            const newState = !prev;
            localStorage.setItem('sidebar-collapsed', String(newState));
            return newState;
        });
    };

    // Set groups open states. By default, open them if active child is present
    const [openGroups, setOpenGroups] = useState(() => {
        return {
            sdm: hasUsersQuery,
            pegawai: hasUsersQuery,
            pelatihan: false
        };
    });

    const [toastMessage, setToastMessage] = useState(null);

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => {
            setToastMessage(null);
        }, 3000);
    };

    const toggleGroup = (groupKey) => {
        setOpenGroups(prev => ({
            ...prev,
            [groupKey]: !prev[groupKey]
        }));
    };

    const handleGroupClick = (groupKey) => {
        if (isSidebarCollapsed) {
            setIsSidebarCollapsed(false);
            localStorage.setItem('sidebar-collapsed', 'false');
            setOpenGroups(prev => ({
                ...prev,
                [groupKey]: true
            }));
        } else {
            toggleGroup(groupKey);
        }
    };

    const hasAccess = (item) => {
        if (!item.roles) return true;
        return item.roles.includes(user?.role);
    };

    const isGroupVisible = (group) => {
        if (!hasAccess(group)) return false;
        if (group.children) {
            return group.children.some(child => {
                if (child.type === 'subgroup') {
                    return isGroupVisible(child);
                }
                return hasAccess(child);
            });
        }
        return true;
    };

    const menuStructure = [
        {
            type: 'placeholder',
            name: 'Dashboard',
            featureName: 'Dashboard Utama',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25v2.25a2.25 2.25 0 0 1-2.25 2.25h-2.25A2.25 2.25 0 0 1 13.5 6v-2.25ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
            )
        },
        {
            type: 'item',
            name: 'Perikatan',
            href: route('dashboard'),
            active: route().current('dashboard') && !hasUsersQuery,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.375M9 18h3.375m-6.75 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3H5.25A3 3 0 0 0 2.25 6v12a3 3 0 0 0 3 3Z" />
                </svg>
            )
        },
        {
            type: 'group',
            id: 'sdm',
            name: 'SDM',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0 1 10.089 21c-2.243 0-4.34-.647-6.11-1.758a4.125 4.125 0 0 1-1.506-3.528 10.455 10.455 0 0 1 1.905-5.13m2.106-2.722a5.976 5.976 0 0 1 5.549-3.36 5.976 5.976 0 0 1 5.549 3.36M15 8.25a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
            ),
            children: [
                {
                    type: 'placeholder',
                    name: 'Presensi',
                    featureName: 'Presensi Harian',
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                    )
                },
                {
                    type: 'placeholder',
                    name: 'KPI',
                    featureName: 'KPI Pegawai',
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v5.75c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 0 1 3 18.875v-5.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v10.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v14.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                        </svg>
                    )
                },
                {
                    type: 'subgroup',
                    id: 'pegawai',
                    name: 'Pegawai',
                    roles: ['admin', 'partner'],
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                        </svg>
                    ),
                    children: [
                        {
                            type: 'item',
                            name: 'Data Pegawai',
                            href: route('dashboard') + '?tab=users',
                            active: route().current('dashboard') && hasUsersQuery,
                            icon: (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75c.9 0 1.625.725 1.625 1.625v1.75c0 .9-.725 1.625-1.625 1.625H5.625C4.725 9.5 4 8.775 4 7.875v-1.75c0-.9.725-1.625 1.625-1.625Z" />
                                </svg>
                            )
                        }
                    ]
                },
                {
                    type: 'placeholder',
                    name: 'Data Diri',
                    featureName: 'Informasi Profil Pegawai',
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                    )
                }
            ]
        },
        {
            type: 'group',
            id: 'pelatihan',
            name: 'Pelatihan',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.902 59.902 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7 1.182-.015-.2m0 0a.75.75 0 0 1 .154-.438c.174-.236.438-.364.717-.364h.027M12 8.443c1.783.513 3.484 1.258 5 2.215v3.675a.75.75 0 1 1-1.5 0V12m-9.5-3.557v.003h-.002" />
                </svg>
            ),
            children: [
                {
                    type: 'placeholder',
                    name: 'Presensi',
                    featureName: 'Presensi Pelatihan',
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h3.75a.75.75 0 0 1 .75.75v18.75a.75.75 0 0 1-.75.75h-3.75a.75.75 0 0 1-.75-.75V3a.75.75 0 0 1 .75-.75Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.125 6.75H21a.75.75 0 0 1 .75.75v14.25a.75.75 0 0 1-.75.75h-1.875a.75.75 0 0 1-.75-.75V7.5a.75.75 0 0 1 .75-.75Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 11.25h1.875a.75.75 0 0 1 .75.75v9.75A.75.75 0 0 1 4.875 22.5H3a.75.75 0 0 1-.75-.75V12a.75.75 0 0 1 .75-.75Z" />
                        </svg>
                    )
                }
            ]
        },
        {
            type: 'item',
            name: 'Profil Saya',
            href: route('profile.edit'),
            active: route().current('profile.edit'),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
            )
        }
    ];

    const renderMenuItem = (item, level = 0) => {
        if (item.type === 'item') {
            if (!hasAccess(item)) return null;
            const isActive = item.active;
            return (
                <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center rounded-xl text-sm font-semibold transition-all duration-300 relative group/item ${
                        isSidebarCollapsed ? 'px-3 py-3 justify-center' : 'py-2.5'
                    } ${
                        level === 0 ? (isSidebarCollapsed ? '' : 'px-4') : (level === 1 ? 'pl-9 pr-4' : 'pl-14 pr-4')
                    } ${
                        isActive
                            ? 'bg-[#0071e3] text-white shadow-md shadow-[#0071e3]/10'
                            : 'text-neutral-600 hover:text-[#1d1d1f] hover:bg-neutral-100'
                    }`}
                >
                    <span className={`transition-colors duration-300 shrink-0 ${
                        isActive ? 'text-white' : 'text-neutral-400 group-hover/item:text-[#0071e3]'
                    }`}>
                        {item.icon}
                    </span>
                    <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                        isSidebarCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-xs opacity-100 ml-3'
                    }`}>
                        {item.name}
                    </span>

                    {isSidebarCollapsed && (
                        <div className="absolute left-full ml-4 px-3 py-2 bg-neutral-900 text-white text-xs rounded-lg opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200 delay-75 whitespace-nowrap z-50 shadow-md pointer-events-none">
                            {item.name}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900"></div>
                        </div>
                    )}
                </Link>
            );
        }

        if (item.type === 'placeholder') {
            if (!hasAccess(item)) return null;
            return (
                <button
                    key={item.name}
                    onClick={() => showToast(`Fitur ${item.featureName} sedang dalam pengembangan.`)}
                    className={`w-full flex items-center rounded-xl text-sm font-semibold transition-all duration-300 relative group/item py-2.5 ${
                        isSidebarCollapsed ? 'px-3 justify-center' : ''
                    } ${
                        level === 0 ? (isSidebarCollapsed ? '' : 'px-4') : (level === 1 ? 'pl-9 pr-4' : 'pl-14 pr-4')
                    } text-neutral-600 hover:text-[#1d1d1f] hover:bg-neutral-100`}
                >
                    <span className="transition-colors duration-300 shrink-0 text-neutral-400 group-hover/item:text-[#0071e3]">
                        {item.icon}
                    </span>
                    <span className={`transition-all duration-300 overflow-hidden text-left whitespace-nowrap ${
                        isSidebarCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-xs opacity-100 ml-3'
                    }`}>
                        {item.name}
                    </span>

                    {isSidebarCollapsed && (
                        <div className="absolute left-full ml-4 px-3 py-2 bg-neutral-900 text-white text-xs rounded-lg opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200 delay-75 whitespace-nowrap z-50 shadow-md pointer-events-none">
                            {item.name}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900"></div>
                        </div>
                    )}
                </button>
            );
        }

        if (item.type === 'group' || item.type === 'subgroup') {
            if (item.type === 'subgroup' && !hasAccess(item)) return null;
            const isVisible = item.type === 'group' ? isGroupVisible(item) : true;
            if (!isVisible) return null;

            const isOpen = openGroups[item.id];
            
            const hasActiveChild = (group) => {
                return group.children?.some(child => {
                    if (child.type === 'item') return child.active;
                    if (child.type === 'subgroup') return hasActiveChild(child);
                    return false;
                });
            };
            const isHighlighted = hasActiveChild(item);

            return (
                <div key={item.id} className="space-y-1">
                    <button
                        onClick={() => handleGroupClick(item.id)}
                        className={`w-full flex items-center justify-between rounded-xl text-sm font-semibold transition-all duration-300 relative group/item py-2.5 ${
                            isSidebarCollapsed ? 'px-3 justify-center' : 'px-4'
                        } ${
                            level === 0 ? '' : (level === 1 ? 'pl-9' : 'pl-14')
                        } ${
                            isHighlighted 
                                ? 'text-[#0071e3] bg-blue-50/40' 
                                : 'text-neutral-600 hover:text-[#1d1d1f] hover:bg-neutral-100'
                        }`}
                    >
                        <div className="flex items-center">
                            <span className={`transition-colors duration-300 shrink-0 ${
                                isHighlighted ? 'text-[#0071e3]' : 'text-neutral-400 group-hover/item:text-[#0071e3]'
                            }`}>
                                {item.icon}
                            </span>
                            <span className={`transition-all duration-300 overflow-hidden text-left whitespace-nowrap ${
                                isSidebarCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-xs opacity-100 ml-3'
                            }`}>
                                {item.name}
                            </span>
                        </div>

                        {!isSidebarCollapsed && (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2.5}
                                stroke="currentColor"
                                className={`w-3 h-3 text-neutral-400 group-hover/item:text-neutral-600 transition-transform duration-300 ${
                                    isOpen ? 'rotate-90' : ''
                                }`}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        )}

                        {isSidebarCollapsed && (
                            <div className="absolute left-full ml-4 px-3 py-2 bg-neutral-900 text-white text-xs rounded-lg opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200 delay-75 whitespace-nowrap z-50 shadow-md pointer-events-none">
                                {item.name}
                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900"></div>
                            </div>
                        )}
                    </button>

                    {!isSidebarCollapsed && isOpen && (
                        <div className="space-y-1 mt-1 transition-all duration-300 ease-in-out">
                            {item.children.map(child => renderMenuItem(child, level + 1))}
                        </div>
                    )}
                </div>
            );
        }

        return null;
    };

    const renderSidebarContent = (isCollapsed) => (
        <div className="flex flex-col h-full bg-white/95 backdrop-blur-xl border-r border-neutral-200/80 relative">
            {/* Logo */}
            <div className="h-16 border-b border-neutral-100 flex items-center px-[22px] gap-2.5 transition-all duration-300 ease-in-out">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-[#0071e3] flex items-center justify-center shadow-md shrink-0">
                    <ApplicationLogo className="w-5 h-5 text-white" />
                </div>
                <span className={`text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent transition-all duration-300 overflow-hidden whitespace-nowrap ${
                    isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-xs opacity-100 ml-2.5'
                }`}>
                    Auditra
                </span>
            </div>

            {/* Nav Links */}
            <nav className={`flex-1 py-6 space-y-1.5 transition-all duration-300 ${
                isCollapsed ? 'px-3 overflow-visible' : 'px-4 overflow-y-auto'
            }`}>
                {menuStructure.map((item) => renderMenuItem(item))}
            </nav>

            {/* Bottom Profile card */}
            <div className={`border-t border-neutral-100 bg-neutral-50/50 transition-all duration-300 ${
                isCollapsed ? 'p-3 flex flex-col items-center justify-center gap-3' : 'p-4'
            }`}>
                <div className={`flex items-center transition-all duration-300 ${
                    isCollapsed ? 'justify-center relative group/avatar cursor-help' : 'gap-3 mb-4 px-2'
                }`}>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                        {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className={`text-left overflow-hidden transition-all duration-300 ${
                        isCollapsed ? 'max-w-0 opacity-0 ml-0 h-0 pointer-events-none' : 'max-w-xs opacity-100 ml-3'
                    }`}>
                        <span className="block text-xs font-bold text-neutral-800 truncate">{user?.name || user?.email || '-'}</span>
                        <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-[#0071e3] border border-blue-100 capitalize font-bold mt-0.5">
                            {(user?.role || '').replace('_', ' ')}
                        </span>
                    </div>

                    {/* Tooltip for User Profile when collapsed */}
                    {isCollapsed && (
                        <div className="absolute left-full ml-4 px-3 py-2 bg-neutral-900 text-white text-xs rounded-lg opacity-0 invisible group-hover/avatar:opacity-100 group-hover/avatar:visible transition-all duration-200 delay-75 whitespace-nowrap z-50 shadow-md pointer-events-none">
                            <span className="block font-bold">{user?.name || user?.email || '-'}</span>
                            <span className="block text-[10px] text-neutral-400 capitalize mt-0.5">{(user?.role || '').replace('_', ' ')}</span>
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900"></div>
                        </div>
                    )}
                </div>

                {!isCollapsed && (
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-red-50 text-neutral-600 hover:text-red-600 border border-neutral-200/60 hover:border-red-100 rounded-xl text-xs font-bold transition duration-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                        </svg>
                        Keluar Sistem
                    </Link>
                )}
                {isCollapsed && (
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="w-10 h-10 flex items-center justify-center bg-neutral-100 hover:bg-red-50 text-neutral-600 hover:text-red-600 border border-neutral-200/60 hover:border-red-100 rounded-xl transition duration-200 group/logout relative"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                        </svg>
                        {/* Tooltip for Logout when collapsed */}
                        <div className="absolute left-full ml-4 px-3 py-2 bg-red-600 text-white text-xs rounded-lg opacity-0 invisible group-hover/logout:opacity-100 group-hover/logout:visible transition-all duration-200 delay-75 whitespace-nowrap z-50 shadow-md pointer-events-none">
                            Keluar Sistem
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-red-600"></div>
                        </div>
                    </Link>
                )}
            </div>

            {/* Collapse/Expand Toggle Button (Desktop only) */}
            <button
                onClick={toggleSidebar}
                className="hidden md:flex absolute top-[18px] -right-3.5 w-7 h-7 bg-white hover:bg-neutral-50 border border-neutral-200/80 hover:border-neutral-300 rounded-full items-center justify-center text-neutral-500 hover:text-neutral-700 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer z-50 group"
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className={`w-3.5 h-3.5 transition-transform duration-300 ease-in-out ${
                        isCollapsed ? 'rotate-180 group-hover:translate-x-0.5' : 'group-hover:-translate-x-0.5'
                    }`}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>
        </div>
    );

    return (
        <div className="min-h-screen app-bg-gradient text-neutral-800 selection:bg-[#0071e3] selection:text-white flex">
            {/* Desktop Sidebar (Left-only) */}
            <aside className={`hidden md:block h-screen sticky top-0 shrink-0 z-40 transition-all duration-300 ease-in-out ${
                isSidebarCollapsed ? 'w-20' : 'w-64'
            }`}>
                {renderSidebarContent(isSidebarCollapsed)}
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
                        {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
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
                                {renderSidebarContent(false)}
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

            {/* Premium Toast Alert for Placeholders */}
            {toastMessage && (
                <div className="fixed bottom-5 right-5 z-[999] flex items-center gap-3 px-4 py-3 bg-neutral-900/90 text-white rounded-xl shadow-xl backdrop-blur-md border border-white/10 animate-fade-in-up">
                    <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        i
                    </div>
                    <div className="text-xs font-semibold">{toastMessage}</div>
                </div>
            )}
        </div>
    );
}
