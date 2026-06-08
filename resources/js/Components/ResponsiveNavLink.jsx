import { Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={`flex w-full items-start border-l-4 py-2 pe-4 ps-3 ${
                active
                    ? 'border-[#0071e3] bg-[#0071e3]/5 text-[#0071e3] focus:border-[#0071e3] focus:bg-[#0071e3]/10 focus:text-blue-800'
                    : 'border-transparent text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 hover:text-[#1d1d1f] focus:border-neutral-300 focus:bg-neutral-50 focus:text-[#1d1d1f]'
            } text-base font-medium transition duration-150 ease-in-out focus:outline-none ${className}`}
        >
            {children}
        </Link>
    );
}
