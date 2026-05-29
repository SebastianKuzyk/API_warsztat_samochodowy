<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('make')->nullable();
            $table->string('model')->nullable();
            $table->integer('year')->nullable();
            $table->string('license_plate', 20)->nullable();
            $table->string('vin', 17)->nullable();
            $table->string('access_code', 20)->nullable(); // hasło klienta do panelu
            $table->timestamps();

            $table->index('license_plate');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
