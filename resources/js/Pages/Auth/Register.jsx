import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="mb-6 text-center">
                <h1 className="text-xl font-bold text-[#1d1d1f] tracking-tight">Daftar Akun Baru</h1>
                <p className="text-xs text-neutral-500 mt-1">Buat akun untuk mulai mengelola survei audit Anda</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1.5">NAMA LENGKAP</label>
                    <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                        </div>
                        <TextInput
                            id="name"
                            name="name"
                            value={data.name}
                            placeholder="Nama Lengkap Anda"
                            className="pl-11 block w-full rounded-xl py-3 border-[#d2d2d7] bg-white text-[#1d1d1f] focus:border-[#0071e3] focus:ring-[#0071e3]/20 shadow-sm focus:ring-4 transition-all"
                            autoComplete="name"
                            isFocused={true}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                    </div>
                    <InputError message={errors.name} className="mt-1.5" />
                </div>

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
                            onChange={(e) => setData('email', e.target.value)}
                            required
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
                            placeholder="Buat kata sandi minimal 8 karakter"
                            className="pl-11 block w-full rounded-xl py-3 border-[#d2d2d7] bg-white text-[#1d1d1f] focus:border-[#0071e3] focus:ring-[#0071e3]/20 shadow-sm focus:ring-4 transition-all"
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                    </div>
                    <InputError message={errors.password} className="mt-1.5" />
                </div>

                <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1.5">KONFIRMASI KATA SANDI</label>
                    <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                            </svg>
                        </div>
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            placeholder="Ulangi kata sandi Anda"
                            className="pl-11 block w-full rounded-xl py-3 border-[#d2d2d7] bg-white text-[#1d1d1f] focus:border-[#0071e3] focus:ring-[#0071e3]/20 shadow-sm focus:ring-4 transition-all"
                            autoComplete="new-password"
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            required
                        />
                    </div>
                    <InputError
                        message={errors.password_confirmation}
                        className="mt-1.5"
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3 bg-[#0071e3] text-white rounded-xl text-sm font-semibold hover:bg-[#0077ed] active:scale-[0.98] transition-all duration-200 shadow-md flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {processing ? 'Memproses...' : 'Daftar Akun Baru'}
                    </button>
                </div>

                <div className="text-center text-xs text-neutral-500 mt-6 pt-4 border-t border-neutral-100/80">
                    Sudah memiliki akun?{' '}
                    <Link
                        href={route('login')}
                        className="text-[#0071e3] font-bold hover:underline transition"
                    >
                        Masuk sekarang
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
