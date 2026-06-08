export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center rounded-lg border border-transparent bg-[#0071e3] px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-[#0077ed] focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:ring-offset-2 active:bg-[#0062c3] ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
