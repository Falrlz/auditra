import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
                    Profile
                </h2>
            }
        >
            <Head title="Profile" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-8 sm:px-6 lg:px-8">
                    <div className="glass-panel p-6 sm:p-8 rounded-2xl animate-fade-in-up">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="glass-panel p-6 sm:p-8 rounded-2xl animate-fade-in-up">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="glass-panel p-6 sm:p-8 rounded-2xl animate-fade-in-up">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
