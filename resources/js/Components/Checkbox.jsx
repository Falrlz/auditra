export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-[#d2d2d7] text-[#0071e3] shadow-sm focus:ring-[#0071e3] transition-all ' +
                className
            }
        />
    );
}
