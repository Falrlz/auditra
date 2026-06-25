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
        Schema::create('pelatihan', function (Blueprint $table) {
            $table->id();
            $table->string('kegiatan');
            $table->text('deskripsi')->nullable();
            $table->integer('skp');
            $table->datetime('mulai');
            $table->datetime('akhir');
            $table->string('status')->default('draft'); // draft, menunggu_persetujuan, disetujui, ditolak, selesai
            $table->foreignId('created_by')->constrained('pegawai')->onDelete('cascade');
            $table->foreignId('approved_by')->nullable()->constrained('pegawai')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pelatihan');
    }
};
