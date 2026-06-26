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
        Schema::create('pengajuan_izin', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('pegawai')->onDelete('cascade');
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->string('tipe'); // sakit, izin
            $table->text('keterangan');
            $table->string('dokumen'); // path to uploaded document
            $table->string('status_approval')->default('pending'); // pending, approved, rejected
            $table->foreignId('approved_by')->nullable()->constrained('pegawai')->onDelete('set null'); // Partner
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengajuan_izin');
    }
};
