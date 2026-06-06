<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RepairTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'repair_order_id', 'service_type_id', 'description',
        'price', 'is_completed', 'needs_parts',
    ];

    protected $casts = [
        'price'        => 'float',
        'is_completed' => 'boolean',
        'needs_parts'  => 'boolean',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(RepairOrder::class, 'repair_order_id');
    }

    public function serviceType(): BelongsTo
    {
        return $this->belongsTo(ServiceType::class);
    }
}
