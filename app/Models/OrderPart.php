<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\Pivot;

class OrderPart extends Pivot
{
    use HasFactory;

    protected $table = 'order_parts';

    public $incrementing = false;

    protected $fillable = ['order_id', 'part_id', 'quantity'];

    protected $casts = [
        'quantity' => 'integer',
    ];
}
