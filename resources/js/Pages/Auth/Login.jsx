import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            <div className="mb-6 text-center">
                <h1 className="text-xl font-bold text-[#1d1d1f] tracking-tight">Selamat Datang Kembali</h1>
                <p className="text-xs text-neutral-500 mt-1">Masuk untuk melanjutkan ke dashboard Auditra</p>
            </div>

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1.5">ALAMAT EMAIL</label>
                    <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                            </svg>
                        </div>
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            placeholder="nama@perusahaan.com"
                            className="pl-11 block w-full rounded-xl py-3 border-[#d2d2d7] bg-white text-[#1d1d1f] focus:border-[#0071e3] focus:ring-[#0071e3]/20 shadow-sm focus:ring-4 transition-all"
                            autoComplete="username"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                    </div>
                    <InputError message={errors.email} className="mt-1.5" />
                </div>

                <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1.5">KATA SANDI</label>
                    <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                            </svg>
                        </div>
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            placeholder="Masukkan kata sandi Anda"
                            className="pl-11 block w-full rounded-xl py-3 border-[#d2d2d7] bg-white text-[#1d1d1f] focus:border-[#0071e3] focus:ring-[#0071e3]/20 shadow-sm focus:ring-4 transition-all"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                        />
                    </div>
                    <InputError message={errors.password} className="mt-1.5" />
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center cursor-pointer select-none">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                        />
                        <span className="ms-2 text-xs text-neutral-500 font-medium hover:text-[#1d1d1f] transition">
                            Ingat saya
                        </span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-xs text-neutral-500 hover:text-[#0071e3] transition focus:outline-none"
                        >
                            Lupa kata sandi?
                        </Link>
                    )}
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3 bg-[#0071e3] text-white rounded-xl text-sm font-semibold hover:bg-[#0077ed] active:scale-[0.98] transition-all duration-200 shadow-md flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {processing ? 'Memproses...' : 'Masuk'}
                    </button>
                </div>

                <div className="text-center text-xs text-neutral-500 mt-6 pt-4 border-t border-neutral-100/80">
                    Belum memiliki akun?{' '}
                    <Link
                        href={route('register')}
                        className="text-[#0071e3] font-bold hover:underline transition"
                    >
                        Daftar sekarang
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
