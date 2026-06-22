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
        Schema::create('a10', function (Blueprint $table) {
            $table->id();
            $table->foreignId('klien_id')->unique()->constrained('clients')->onDelete('cascade');
            $table->string('status')->default('draft');
            $table->text('alasan_penolakan')->nullable();
            $table->json('form_a10');
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
        Schema::dropIfExists('a10');
    }
};
