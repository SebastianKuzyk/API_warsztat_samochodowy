<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number', 50)->unique();
            $table->foreignId('repair_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();

            $table->decimal('tasks_total', 10, 2)->default(0);
            $table->decimal('parts_total', 10, 2)->default(0);
            $table->decimal('total', 10, 2)->default(0);
            $table->boolean('paid')->default(false);
            $table->text('notes')->nullable();

            $table->string('document_type', 20)->default('invoice'); // invoice | receipt

            // Sprzedawca
            $table->string('seller_name')->nullable();
            $table->string('seller_nip', 20)->nullable();
            $table->string('seller_address')->nullable();

            // Nabywca
            $table->string('buyer_name')->nullable();
            $table->string('buyer_nip', 20)->nullable();
            $table->string('buyer_address')->nullable();
            $table->string('buyer_city', 100)->nullable();
            $table->string('buyer_postcode', 10)->nullable();

            $table->string('payment_method', 50)->default('Gotówka');
            $table->date('due_date')->nullable();

            $table->timestamp('issued_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
