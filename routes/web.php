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

    // Admin routes
    Route::middleware('role:admin')->group(function () {
        Route::post('/users', [\App\Http\Controllers\UserController::class, 'store'])->name('users.store');
        Route::post('/users/{user}', [\App\Http\Controllers\UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [\App\Http\Controllers\UserController::class, 'destroy'])->name('users.destroy');
        Route::post('/clients', [AuditFormController::class, 'storeClient'])->name('clients.store');
        Route::post('/clients/{client}', [AuditFormController::class, 'updateClient'])->name('clients.update');
        Route::delete('/clients/{client}', [AuditFormController::class, 'destroyClient'])->name('clients.destroy');
    });

    // Partner routes
    Route::middleware('role:partner')->group(function () {
        Route::post('/clients/{client}/team', [AuditFormController::class, 'updateTeam'])->name('clients.team.update');
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
