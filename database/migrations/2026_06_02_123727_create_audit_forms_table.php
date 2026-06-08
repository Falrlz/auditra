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
        Schema::create('audit_forms', function (Blueprint $table) {
            $table->id();
            $table->string('client_name');
            $table->string('book_year');
            $table->string('schedule');
            $table->string('status')->default('draft'); // 'draft', 'pending_approval', 'approved_by_leader', 'approved', 'rejected'
            $table->text('reject_reason')->nullable();
            $table->longText('section_data')->nullable(); // JSON containing all questionnaire sections
            $table->foreignId('preparer_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('reviewer_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('approver_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_forms');
    }
};
