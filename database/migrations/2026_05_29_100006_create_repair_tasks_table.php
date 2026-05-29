<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('repair_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('repair_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_type_id')->nullable()->constrained()->nullOnDelete();
            $table->text('description');
            $table->decimal('price', 10, 2)->default(0);
            $table->boolean('is_completed')->default(false);
            $table->boolean('needs_parts')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repair_tasks');
    }
};
