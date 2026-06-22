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
        Schema::create('c10_d10', function (Blueprint $table) {
            $table->id();
            $table->foreignId('klien_id')->unique()->constrained('clients')->onDelete('cascade');
            $table->decimal('materialitas_keseluruhan', 20, 2)->nullable();
            $table->decimal('materialitas_kinerja', 20, 2)->nullable();
            $table->decimal('kesalahan_ditoleransi', 20, 2)->nullable();
            $table->string('status')->default('draft');
            $table->text('alasan_penolakan')->nullable();
            $table->json('data_bagian')->nullable();
            $table->foreignId('pembuat_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('penelaah_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('penyetuju_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('c10_d10');
    }
};
