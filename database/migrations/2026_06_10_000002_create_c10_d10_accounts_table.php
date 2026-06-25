<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('c10_d10_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('c10_d10_id')->constrained('c10_d10')->onDelete('cascade');
            $table->string('kode_induk');
            $table->string('nama_induk');
            $table->string('saldo_normal');
            $table->string('suffix');
            $table->string('kode_lengkap');
            $table->string('nama');
            $table->decimal('saldo_unaudited', 20, 2);
            $table->string('tcm_unaudited', 3)->nullable();
            $table->decimal('penyesuaian_debit', 20, 2)->default(0);
            $table->decimal('penyesuaian_kredit', 20, 2)->default(0);
            $table->string('reff')->nullable();
            $table->decimal('saldo_audited', 20, 2);
            $table->string('tcm_audited', 3)->nullable();
            $table->decimal('saldo_audited_prev', 20, 2);
            $table->decimal('saldo_audited_prev2', 20, 2)->nullable();
            $table->decimal('persen_materialitas', 5, 2)->default(50.00);
            $table->string('status_materialitas');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('c10_d10_accounts');
    }
};
