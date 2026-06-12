import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import AuditFormWizard from '@/Components/AuditFormWizard';
import AuditFormD10Wizard from '@/Components/AuditFormD10Wizard';
import React from 'react';

export default function Edit({ client, formType, formToEdit }) {
    const handleClose = () => {
        router.visit(route('dashboard'));
    };

    const handleSaveSuccess = () => {
        router.visit(route('dashboard'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0071e3] border border-blue-100 flex items-center justify-center shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.375M9 18h3.375m-6.75 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3H5.25A3 3 0 0 0 2.25 6v12a3 3 0 0 0 3 3Z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-extrabold text-[#1d1d1f] tracking-tight">
                            {formToEdit ? 'Edit Laporan' : 'Isi Laporan'} {formType}
                        </h2>
                        <p className="text-xs text-neutral-400 font-medium">
                            Klien: {client.name} | Tahun Buku: {client.book_year} | Jadwal: {client.schedule}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`${formToEdit ? 'Edit' : 'Isi'} Laporan ${formType}`} />

            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                    {formType === 'D10' ? (
                        <AuditFormD10Wizard
                            formToEdit={formToEdit}
                            clientId={client.id}
                            clientName={client.name}
                            bookYear={client.book_year}
                            schedule={client.schedule}
                            onClose={handleClose}
                            onSaveSuccess={handleSaveSuccess}
                        />
                    ) : (
                        <AuditFormWizard
                            formToEdit={formToEdit}
                            clientId={client.id}
                            clientName={client.name}
                            bookYear={client.book_year}
                            schedule={client.schedule}
                            materiality={client.materiality}
                            onClose={handleClose}
                            onSaveSuccess={handleSaveSuccess}
                        />
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
