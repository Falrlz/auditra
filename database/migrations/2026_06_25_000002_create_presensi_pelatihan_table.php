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
        Schema::create('presensi_pelatihan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('pegawai')->onDelete('cascade');
            $table->foreignId('pelatihan_id')->constrained('pelatihan')->onDelete('cascade');
            $table->date('tanggal');
            $table->datetime('checkin_at')->nullable();
            $table->datetime('checkout_at')->nullable();
            $table->string('status'); // hadir, dinas_luar, izin, sakit, alpha
            $table->timestamps();

            $table->unique(['pegawai_id', 'pelatihan_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('presensi_pelatihan');
    }
};
