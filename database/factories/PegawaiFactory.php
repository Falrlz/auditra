<?php

namespace Database\Factories;

use App\Models\Pegawai;
use Illuminate\Database\Eloquent\Factories\Factory;

class PegawaiFactory extends Factory
{
    protected $model = Pegawai::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'jabatan' => 'staff', // default
            'inisial' => strtoupper(fake()->lexify('???')),
            'telp' => fake()->phoneNumber(),
            'alamat' => fake()->address(),
            'status' => 'aktif',
        ];
    }
}
