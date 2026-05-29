<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id', 'make', 'model', 'year', 'license_plate', 'vin', 'access_code',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function repairOrders(): HasMany
    {
        return $this->hasMany(RepairOrder::class);
    }

    /**
     * Wygeneruj unikalny 6-znakowy kod dostępu.
     */
    public static function generateAccessCode(): string
    {
        return strtoupper(bin2hex(random_bytes(3)));
    }
}
