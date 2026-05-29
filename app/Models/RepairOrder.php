<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class RepairOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'vehicle_id', 'mechanic_id', 'status', 'description',
        'service_price', 'completed_at',
    ];

    protected $casts = [
        'completed_at'  => 'datetime',
        'service_price' => 'decimal:2',
    ];

    public const STATUSES = [
        'Nierozpoczęte',
        'W trakcie',
        'Czeka na części',
        'Gotowe do odbioru',
        'Odebrane',
    ];

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function mechanic(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mechanic_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(RepairTask::class);
    }

    public function parts(): BelongsToMany
    {
        return $this->belongsToMany(Part::class, 'order_parts', 'order_id', 'part_id')
                    ->withPivot('quantity')
                    ->withTimestamps();
    }

    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class);
    }

    /**
     * Suma cen zadań.
     */
    public function getTasksTotalAttribute(): float
    {
        return (float) $this->tasks->sum('price');
    }

    /**
     * Suma wartości części.
     */
    public function getPartsTotalAttribute(): float
    {
        return (float) $this->parts->sum(fn($p) => (float) $p->price * (int) $p->pivot->quantity);
    }

    /**
     * Łączna suma do zapłaty.
     */
    public function getTotalAttribute(): float
    {
        return $this->tasks_total + $this->parts_total;
    }

    /**
     * Przelicz status na podstawie zadań.
     */
    public function recalculateStatus(): string
    {
        $tasks = $this->tasks;
        if ($tasks->isEmpty()) {
            return $this->status ?? 'Nierozpoczęte';
        }

        $anyNeedsParts = $tasks->contains('needs_parts', true);
        $allCompleted  = $tasks->every(fn($t) => $t->is_completed);
        $anyCompleted  = $tasks->contains('is_completed', true);

        if ($anyNeedsParts) {
            $this->status = 'Czeka na części';
            $this->completed_at = null;
        } elseif ($allCompleted) {
            $this->status = 'Gotowe do odbioru';
            $this->completed_at = $this->completed_at ?? now();
        } elseif ($anyCompleted) {
            $this->status = 'W trakcie';
            $this->completed_at = null;
        } else {
            // Żadne zadanie nie wykonane i nie czeka na części
            $this->status = in_array($this->status, ['W trakcie', 'Nierozpoczęte'], true)
                ? ($this->status ?? 'Nierozpoczęte')
                : 'Nierozpoczęte';
            $this->completed_at = null;
        }

        $this->save();
        return $this->status;
    }
}
