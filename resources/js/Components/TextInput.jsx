import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, ...props },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={
                'rounded-lg border-[#d2d2d7] bg-white text-[#1d1d1f] shadow-sm focus:border-[#0071e3] focus:ring-[#0071e3] focus:ring-4 focus:ring-opacity-15 transition-all ' +
                className
            }
            ref={localRef}
        />
    );
});
