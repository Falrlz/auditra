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

    // Common Auth routes
    Route::get('/audit-forms/{auditForm}', [AuditFormController::class, 'show'])->name('audit-forms.show');

    // Anggota routes
    Route::middleware('role:anggota')->group(function () {
        Route::post('/audit-forms', [AuditFormController::class, 'store'])->name('audit-forms.store');
        Route::post('/audit-forms/{auditForm}', [AuditFormController::class, 'update'])->name('audit-forms.update');
        Route::post('/audit-forms/{auditForm}/submit', [AuditFormController::class, 'submit'])->name('audit-forms.submit');
        Route::post('/audit-forms/parse/ods', [AuditFormController::class, 'parseOds'])->name('audit-forms.parse');
    });

    // Ketua Tim routes
    Route::middleware('role:ketua_tim')->group(function () {
        Route::post('/audit-forms/{auditForm}/review', [AuditFormController::class, 'review'])->name('audit-forms.review');
    });

    // Supervisor Route
    Route::middleware('role:supervisor')->group(function () {
        Route::post('/audit-forms/{auditForm}/approve-supervisor', [AuditFormController::class, 'approveSupervisor'])->name('audit-forms.approve-supervisor');
    });
});

require __DIR__.'/auth.php';
