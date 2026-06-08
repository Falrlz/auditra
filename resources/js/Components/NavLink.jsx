import { Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none ' +
                (active
                    ? 'border-[#0071e3] text-[#1d1d1f] focus:border-[#0071e3]'
                    : 'border-transparent text-[#86868b] hover:border-neutral-300 hover:text-[#1d1d1f] focus:border-neutral-300 focus:text-[#1d1d1f]') +
                className
            }
        >
            {children}
        </Link>
    );
}
