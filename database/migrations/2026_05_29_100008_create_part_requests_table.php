<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('part_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mechanic_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('repair_task_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('part_id')->nullable()->constrained()->nullOnDelete();
            $table->string('custom_part_name')->nullable();
            $table->integer('quantity')->default(1);
            $table->string('status', 50)->default('Brak odpowiedzi');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('part_requests');
    }
};
