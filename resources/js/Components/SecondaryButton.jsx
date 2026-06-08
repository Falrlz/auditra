export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            type={type}
            className={
                `inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-neutral-700 shadow-sm transition duration-150 ease-in-out hover:bg-neutral-50 hover:text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:ring-offset-2 disabled:opacity-25 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
