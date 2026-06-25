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
        Schema::create('pegawai', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('jabatan'); // admin, partner, manager, staff
            $table->string('inisial')->nullable();
            $table->string('telp')->nullable();
            $table->text('alamat')->nullable();
            $table->text('cv')->nullable();
            $table->string('status')->default('aktif'); // aktif, cuti, nonaktif
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pegawai');
    }
};
