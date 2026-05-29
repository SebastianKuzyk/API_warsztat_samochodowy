<?php

namespace Database\Seeders;

use App\Models\Part;
use App\Models\ServiceType;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ----- Użytkownicy -----
        $defaults = [
            ['admin',      'admin123',      'admin',      'Tomasz', 'Nowak',      '234567890', 'admin@warsztat.pl'],
            ['mechanik',   'mechanik123',   'mechanic',   'Jan',    'Kowalski',   '111222333', 'mechanik@warsztat.pl'],
            ['recepcja',   'recepcja123',   'recepcja',   'Anna',   'Nowak',      '444555666', 'recepcja@warsztat.pl'],
            ['magazynier', 'magazynier123', 'magazynier', 'Piotr',  'Wiśniewski', '777888999', 'magazynier@warsztat.pl'],
        ];
        foreach ($defaults as [$login, $password, $role, $first, $last, $phone, $email]) {
            User::firstOrCreate(
                ['login' => $login],
                [
                    'password'   => $password,
                    'role'       => $role,
                    'first_name' => $first,
                    'last_name'  => $last,
                    'phone'      => $phone,
                    'email'      => $email,
                ]
            );
        }

        // ----- Magazyn -----
        $parts = [
            ['Olej silnikowy 5W30',          45.00, 20],
            ['Filtr oleju',                  25.00, 15],
            ['Filtr powietrza',              35.00, 12],
            ['Filtr kabinowy',               40.00, 10],
            ['Klocki hamulcowe przód',      120.00,  8],
            ['Klocki hamulcowe tył',        100.00,  8],
            ['Tarcze hamulcowe przód',      180.00,  6],
            ['Tarcze hamulcowe tył',        150.00,  6],
            ['Świece zapłonowe (komplet)',   80.00, 10],
            ['Akumulator 12V 60Ah',         350.00,  5],
            ['Pasek rozrządu',               90.00,  4],
            ['Pompa wody',                  200.00,  3],
            ['Amortyzator przód',           250.00,  8],
            ['Amortyzator tył',             220.00,  8],
            ['Żarówka H7',                   15.00, 30],
            ['Płyn hamulcowy DOT4 1L',       25.00, 15],
            ['Płyn chłodniczy 1L',           20.00, 20],
            ['Wycieraczki (para)',           60.00, 12],
        ];
        foreach ($parts as [$name, $price, $qty]) {
            Part::firstOrCreate(['name' => $name], ['price' => $price, 'quantity' => $qty]);
        }

        // ----- Typy usług -----
        $services = [
            ['Wymiana oleju i filtra',         150.00, 'Wymiana oleju silnikowego i filtra oleju'],
            ['Wymiana klocków hamulcowych',    200.00, 'Wymiana klocków hamulcowych przód lub tył'],
            ['Wymiana tarcz hamulcowych',      300.00, 'Wymiana tarcz hamulcowych przód lub tył'],
            ['Wymiana rozrządu',               800.00, 'Wymiana paska/łańcucha rozrządu z pompą wody'],
            ['Wymiana świec zapłonowych',      120.00, 'Wymiana kompletu świec zapłonowych'],
            ['Wymiana akumulatora',             50.00, 'Wymiana akumulatora (bez ceny części)'],
            ['Wymiana amortyzatorów',          250.00, 'Wymiana amortyzatorów przód lub tył'],
            ['Wymiana filtrów',                 80.00, 'Wymiana filtra powietrza i kabinowego'],
            ['Diagnostyka komputerowa',        100.00, 'Diagnostyka komputerowa pojazdu'],
            ['Przegląd okresowy',              200.00, 'Przegląd okresowy pojazdu'],
            ['Naprawa układu wydechowego',     300.00, 'Naprawa lub wymiana elementów układu wydechowego'],
            ['Naprawa zawieszenia',            400.00, 'Naprawa elementów zawieszenia'],
            ['Wymiana sprzęgła',               900.00, 'Wymiana kompletu sprzęgła'],
            ['Naprawa klimatyzacji',           250.00, 'Serwis i naprawa klimatyzacji'],
            ['Geometria kół',                  150.00, 'Ustawienie geometrii kół'],
        ];
        foreach ($services as [$name, $price, $desc]) {
            ServiceType::firstOrCreate(['name' => $name], ['default_price' => $price, 'description' => $desc]);
        }
    }
}
