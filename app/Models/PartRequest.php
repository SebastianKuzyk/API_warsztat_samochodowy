<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'mechanic_id', 'repair_task_id', 'part_id',
        'custom_part_name', 'quantity', 'status',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function mechanic(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mechanic_id');
    }

    public function part(): BelongsTo
    {
        return $this->belongsTo(Part::class);
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(RepairTask::class, 'repair_task_id');
    }

    public function getDisplayNameAttribute(): string
    {
        return $this->part?->name ?? $this->custom_part_name ?? 'Nieznana';
    }

    public function getTypeAttribute(): string
    {
        return $this->part_id ? 'W magazynie' : 'Do zamówienia';
    }
}
