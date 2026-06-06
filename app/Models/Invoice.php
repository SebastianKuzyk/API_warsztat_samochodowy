<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number', 'repair_order_id', 'customer_id', 'issued_by',
        'tasks_total', 'parts_total', 'total', 'paid', 'notes',
        'document_type',
        'seller_name', 'seller_nip', 'seller_address',
        'buyer_name', 'buyer_nip', 'buyer_address', 'buyer_city', 'buyer_postcode',
        'payment_method', 'due_date', 'issued_at',
    ];

    protected $casts = [
        'tasks_total' => 'float',
        'parts_total' => 'float',
        'total'       => 'float',
        'paid'        => 'boolean',
        'due_date'    => 'date',
        'issued_at'   => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(RepairOrder::class, 'repair_order_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function issuer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    /**
     * Wygeneruj kolejny numer dokumentu w formacie: PREFIKS/RRRR/MM/NNNN
     */
    public static function nextNumber(string $type = 'invoice'): string
    {
        $prefix = $type === 'receipt' ? 'PG' : 'FV';
        $year   = now()->year;
        $month  = now()->format('m');

        $count = static::query()
            ->whereYear('issued_at', $year)
            ->whereMonth('issued_at', $month)
            ->where('invoice_number', 'LIKE', "$prefix/%")
            ->count();

        return sprintf('%s/%s/%s/%04d', $prefix, $year, $month, $count + 1);
    }
}
