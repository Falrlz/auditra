<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\AuditFormController;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', [AuditFormController::class, 'index'])
    ->middleware(['auth'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Presensi routes
    Route::get('/presensi', [\App\Http\Controllers\PresensiController::class, 'index'])->name('presensi.index');
    Route::post('/presensi/checkin', [\App\Http\Controllers\PresensiController::class, 'checkIn'])->name('presensi.checkin');
    Route::post('/presensi/checkout', [\App\Http\Controllers\PresensiController::class, 'checkOut'])->name('presensi.checkout');
    Route::post('/presensi/izin-sakit', [\App\Http\Controllers\PresensiController::class, 'submitIzinSakit'])->name('presensi.izin-sakit');

    // Admin & Partner Presensi routes
    Route::middleware('role:admin,partner')->group(function () {
        Route::post('/presensi/assign-dinas-luar', [\App\Http\Controllers\PresensiController::class, 'assignDinasLuar'])->name('presensi.assign-dinas-luar');
        Route::post('/presensi/izin-sakit/{pengajuan}/approve', [\App\Http\Controllers\PresensiController::class, 'approveIzinSakit'])->name('presensi.izin-sakit.approve');
        Route::post('/presensi/izin-sakit/{pengajuan}/reject', [\App\Http\Controllers\PresensiController::class, 'rejectIzinSakit'])->name('presensi.izin-sakit.reject');
    });

    // Pelatihan routes
    Route::get('/pelatihan', [\App\Http\Controllers\PelatihanController::class, 'index'])->name('pelatihan.index');
    Route::get('/pelatihan/scan', [\App\Http\Controllers\PelatihanController::class, 'showScanPage'])->name('pelatihan.scan');
    Route::get('/pelatihan/presensi/{token}', [\App\Http\Controllers\PelatihanController::class, 'showPresensiByToken'])->name('pelatihan.presensi');
    Route::post('/pelatihan/presensi/{token}', [\App\Http\Controllers\PelatihanController::class, 'recordPresensiByToken'])->name('pelatihan.record-presensi');

    Route::middleware('role:admin')->group(function () {
        Route::post('/pelatihan', [\App\Http\Controllers\PelatihanController::class, 'store'])->name('pelatihan.store');
        Route::put('/pelatihan/{pelatihan}', [\App\Http\Controllers\PelatihanController::class, 'update'])->name('pelatihan.update');
        Route::delete('/pelatihan/{pelatihan}', [\App\Http\Controllers\PelatihanController::class, 'destroy'])->name('pelatihan.destroy');
        Route::post('/pelatihan/{pelatihan}/submit', [\App\Http\Controllers\PelatihanController::class, 'submit'])->name('pelatihan.submit');
        Route::post('/pelatihan/{pelatihan}/finish', [\App\Http\Controllers\PelatihanController::class, 'finish'])->name('pelatihan.finish');
    });

    Route::middleware('role:partner')->group(function () {
        Route::post('/pelatihan/{pelatihan}/approve', [\App\Http\Controllers\PelatihanController::class, 'approve'])->name('pelatihan.approve');
        Route::post('/pelatihan/{pelatihan}/reject', [\App\Http\Controllers\PelatihanController::class, 'reject'])->name('pelatihan.reject');
    });

    // Admin routes
    Route::middleware('role:admin')->group(function () {
        Route::post('/users', [\App\Http\Controllers\UserController::class, 'store'])->name('users.store');
        Route::post('/users/{user}', [\App\Http\Controllers\UserController::class, 'update'])->name('users.update');
        Route::post('/users/{user}/toggle-status', [\App\Http\Controllers\UserController::class, 'toggleStatus'])->name('users.toggle-status');
        Route::delete('/users/{user}', [\App\Http\Controllers\UserController::class, 'destroy'])->name('users.destroy');

        Route::post('/pegawai', [\App\Http\Controllers\PegawaiController::class, 'store'])->name('pegawai.store');
        Route::post('/pegawai/{pegawai}', [\App\Http\Controllers\PegawaiController::class, 'update'])->name('pegawai.update');
        Route::delete('/pegawai/{pegawai}', [\App\Http\Controllers\PegawaiController::class, 'destroy'])->name('pegawai.destroy');

        Route::post('/clients', [AuditFormController::class, 'storeClient'])->name('clients.store');
        Route::post('/clients/{client}', [AuditFormController::class, 'updateClient'])->name('clients.update');
        Route::delete('/clients/{client}', [AuditFormController::class, 'destroyClient'])->name('clients.destroy');
    });

    // Partner routes
    Route::middleware('role:partner')->group(function () {
        Route::post('/clients/{client}/team', [AuditFormController::class, 'updateTeam'])->name('clients.team.update');
        Route::post('/pegawai/{pegawai}/approve', [\App\Http\Controllers\PegawaiController::class, 'approve'])->name('pegawai.approve');
        Route::post('/pegawai/{pegawai}/reject', [\App\Http\Controllers\PegawaiController::class, 'reject'])->name('pegawai.reject');
    });

    // Forms and detail routes
    Route::get('/a10/create', [AuditFormController::class, 'createA10'])->name('a10.create');
    Route::get('/a10/{auditForm}/edit', [AuditFormController::class, 'editA10'])->name('a10.edit');
    Route::get('/d10/create', [AuditFormController::class, 'createD10'])->name('d10.create');
    Route::get('/d10/{auditForm}/edit', [AuditFormController::class, 'editD10'])->name('d10.edit');
    Route::get('/c10/create', [AuditFormController::class, 'createC10'])->name('c10.create');
    Route::get('/c10/{auditForm}/edit', [AuditFormController::class, 'editC10'])->name('c10.edit');

    Route::get('/audit-forms/{auditForm}', [AuditFormController::class, 'show'])->name('audit-forms.show');
    Route::post('/audit-forms', [AuditFormController::class, 'store'])->name('audit-forms.store');
    Route::post('/audit-forms/{auditForm}', [AuditFormController::class, 'update'])->name('audit-forms.update');
    Route::post('/audit-forms/{auditForm}/submit', [AuditFormController::class, 'submit'])->name('audit-forms.submit');
    Route::post('/audit-forms/{auditForm}/review', [AuditFormController::class, 'review'])->name('audit-forms.review');
    Route::post('/audit-forms/parse/ods', [AuditFormController::class, 'parseOds'])->name('audit-forms.parse');
});

require __DIR__.'/auth.php';
