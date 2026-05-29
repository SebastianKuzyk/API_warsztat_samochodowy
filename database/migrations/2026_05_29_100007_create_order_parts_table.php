<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('order_parts', function (Blueprint $table) {
            $table->foreignId('order_id')->constrained('repair_orders')->cascadeOnDelete();
            $table->foreignId('part_id')->constrained('parts')->cascadeOnDelete();
            $table->integer('quantity')->default(1);
            $table->timestamps();

            $table->primary(['order_id', 'part_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_parts');
    }
};
