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
            $table->foreignId('tim_perikatan_id')->constrained('tim_perikatan')->onDelete('cascade');
            $table->decimal('overall_materiality', 20, 2)->nullable();
            $table->decimal('performance_materiality', 20, 2)->nullable();
            $table->decimal('tolerable_error', 20, 2)->nullable();
            $table->string('status')->default('draft');
            $table->text('reject_reason')->nullable();
            $table->json('section_data')->nullable();
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
