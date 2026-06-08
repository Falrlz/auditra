import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <div className="mb-6 text-center">
                <h1 className="text-xl font-bold text-[#1d1d1f] tracking-tight">Lupa Kata Sandi?</h1>
                <p className="text-xs text-neutral-500 mt-1">Masukkan email Anda untuk menerima tautan reset</p>
            </div>

            <div className="mb-4 text-xs text-neutral-500 leading-relaxed bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/60">
                Tidak masalah. Masukkan alamat email Anda di bawah, dan kami akan mengirimkan email berisi tautan reset kata sandi yang memungkinkan Anda membuat kata sandi baru.
            </div>

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <form onSubmit={submit}>
                <TextInput
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    className="mt-1 block w-full"
                    isFocused={true}
                    onChange={(e) => setData('email', e.target.value)}
                />

                <InputError message={errors.email} className="mt-2" />

                <div className="mt-6 flex items-center justify-end">
                    <PrimaryButton className="w-full" disabled={processing}>
                        Email Password Reset Link
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
