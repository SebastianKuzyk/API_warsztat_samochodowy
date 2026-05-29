<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Part extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'price', 'quantity'];

    protected $casts = [
        'price'    => 'decimal:2',
        'quantity' => 'integer',
    ];

    public function repairOrders(): BelongsToMany
    {
        return $this->belongsToMany(RepairOrder::class, 'order_parts', 'part_id', 'order_id')
                    ->withPivot('quantity')
                    ->withTimestamps();
    }

    public function partRequests(): HasMany
    {
        return $this->hasMany(PartRequest::class);
    }
}
