-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Maj 29, 2026 at 09:01 AM
-- Wersja serwera: 10.4.32-MariaDB
-- Wersja PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `warsztat_laravel`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `customers`
--

CREATE TABLE `customers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `first_name`, `last_name`, `phone`, `email`, `created_at`, `updated_at`) VALUES
(1, 'Jan', 'Testowy', '500111222', NULL, '2026-05-29 04:18:37', '2026-05-29 04:18:37'),
(2, 'Sebastian', 'Kuzyk', '664063946', 'sebastian.kuzyk@onet.pl', '2026-05-29 04:27:25', '2026-05-29 04:27:25');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` varchar(255) NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `invoices`
--

CREATE TABLE `invoices` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `repair_order_id` bigint(20) UNSIGNED NOT NULL,
  `customer_id` bigint(20) UNSIGNED DEFAULT NULL,
  `issued_by` bigint(20) UNSIGNED DEFAULT NULL,
  `tasks_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `parts_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `paid` tinyint(1) NOT NULL DEFAULT 0,
  `notes` text DEFAULT NULL,
  `document_type` varchar(20) NOT NULL DEFAULT 'invoice',
  `seller_name` varchar(255) DEFAULT NULL,
  `seller_nip` varchar(20) DEFAULT NULL,
  `seller_address` varchar(255) DEFAULT NULL,
  `buyer_name` varchar(255) DEFAULT NULL,
  `buyer_nip` varchar(20) DEFAULT NULL,
  `buyer_address` varchar(255) DEFAULT NULL,
  `buyer_city` varchar(100) DEFAULT NULL,
  `buyer_postcode` varchar(10) DEFAULT NULL,
  `payment_method` varchar(50) NOT NULL DEFAULT 'Gotówka',
  `due_date` date DEFAULT NULL,
  `issued_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` (`id`, `invoice_number`, `repair_order_id`, `customer_id`, `issued_by`, `tasks_total`, `parts_total`, `total`, `paid`, `notes`, `document_type`, `seller_name`, `seller_nip`, `seller_address`, `buyer_name`, `buyer_nip`, `buyer_address`, `buyer_city`, `buyer_postcode`, `payment_method`, `due_date`, `issued_at`, `created_at`, `updated_at`) VALUES
(1, 'FV/2026/05/0001', 2, 2, 3, 270.00, 0.00, 270.00, 1, NULL, 'invoice', 'Warsztat Samochodowy Sp. z o.o.', '5252556677', 'ul. Mechaniczna 12, 00-001 Warszawa', 'Sebastian Kuzyk', '13323323', 'Ruszelczyce 92a', 'Ruszelczyce', '37-755', 'Gotówka', '2026-05-29', '2026-05-29 04:44:48', '2026-05-29 04:44:48', '2026-05-29 04:44:48');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` smallint(5) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2026_05_29_100001_create_customers_table', 1),
(5, '2026_05_29_100002_create_service_types_table', 1),
(6, '2026_05_29_100003_create_vehicles_table', 1),
(7, '2026_05_29_100004_create_parts_table', 1),
(8, '2026_05_29_100005_create_repair_orders_table', 1),
(9, '2026_05_29_100006_create_repair_tasks_table', 1),
(10, '2026_05_29_100007_create_order_parts_table', 1),
(11, '2026_05_29_100008_create_part_requests_table', 1),
(12, '2026_05_29_100009_create_invoices_table', 1);

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `order_parts`
--

CREATE TABLE `order_parts` (
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `part_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `parts`
--

CREATE TABLE `parts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `parts`
--

INSERT INTO `parts` (`id`, `name`, `price`, `quantity`, `created_at`, `updated_at`) VALUES
(1, 'Olej silnikowy 5W30', 45.00, 20, '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(2, 'Filtr oleju', 25.00, 15, '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(3, 'Filtr powietrza', 35.00, 12, '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(4, 'Filtr kabinowy', 40.00, 10, '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(5, 'Klocki hamulcowe przód', 120.00, 8, '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(6, 'Klocki hamulcowe tył', 100.00, 8, '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(7, 'Tarcze hamulcowe przód', 180.00, 6, '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(8, 'Tarcze hamulcowe tył', 150.00, 6, '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(9, 'Świece zapłonowe (komplet)', 80.00, 10, '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(10, 'Akumulator 12V 60Ah', 350.00, 17, '2026-05-29 04:09:40', '2026-05-29 04:40:58'),
(11, 'Pasek rozrządu', 90.00, 4, '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(12, 'Pompa wody', 200.00, 3, '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(13, 'Amortyzator przód', 250.00, 8, '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(14, 'Amortyzator tył', 220.00, 8, '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(15, 'Żarówka H7', 15.00, 30, '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(16, 'Płyn hamulcowy DOT4 1L', 25.00, 15, '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(17, 'Płyn chłodniczy 1L', 20.00, 20, '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(18, 'Wycieraczki (para)', 60.00, 12, '2026-05-29 04:09:40', '2026-05-29 04:09:40');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `part_requests`
--

CREATE TABLE `part_requests` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `mechanic_id` bigint(20) UNSIGNED NOT NULL,
  `repair_task_id` bigint(20) UNSIGNED DEFAULT NULL,
  `part_id` bigint(20) UNSIGNED DEFAULT NULL,
  `custom_part_name` varchar(255) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `status` varchar(50) NOT NULL DEFAULT 'Brak odpowiedzi',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `part_requests`
--

INSERT INTO `part_requests` (`id`, `mechanic_id`, `repair_task_id`, `part_id`, `custom_part_name`, `quantity`, `status`, `created_at`, `updated_at`) VALUES
(1, 2, 1, 1, NULL, 1, 'Gotowa do odbioru', '2026-05-29 04:28:07', '2026-05-29 04:41:26'),
(2, 2, 2, 10, NULL, 1, 'Gotowa do odbioru', '2026-05-29 04:29:56', '2026-05-29 04:41:25'),
(3, 2, 3, 10, NULL, 1, 'Gotowa do odbioru', '2026-05-29 04:39:58', '2026-05-29 04:41:23');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `repair_orders`
--

CREATE TABLE `repair_orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vehicle_id` bigint(20) UNSIGNED NOT NULL,
  `mechanic_id` bigint(20) UNSIGNED DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Nierozpoczęte',
  `description` text DEFAULT NULL,
  `service_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `repair_orders`
--

INSERT INTO `repair_orders` (`id`, `vehicle_id`, `mechanic_id`, `status`, `description`, `service_price`, `completed_at`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 'Czeka na części', '', 0.00, NULL, '2026-05-29 04:18:37', '2026-05-29 04:28:07'),
(2, 2, 2, 'Odebrane', '', 0.00, '2026-05-29 04:44:06', '2026-05-29 04:27:25', '2026-05-29 04:44:48');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `repair_tasks`
--

CREATE TABLE `repair_tasks` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `repair_order_id` bigint(20) UNSIGNED NOT NULL,
  `service_type_id` bigint(20) UNSIGNED DEFAULT NULL,
  `description` text NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `is_completed` tinyint(1) NOT NULL DEFAULT 0,
  `needs_parts` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `repair_tasks`
--

INSERT INTO `repair_tasks` (`id`, `repair_order_id`, `service_type_id`, `description`, `price`, `is_completed`, `needs_parts`, `created_at`, `updated_at`) VALUES
(1, 1, 9, 'Wymiana oleju', 150.00, 0, 1, '2026-05-29 04:18:37', '2026-05-29 04:28:07'),
(2, 2, 5, 'Wymiana świec zapłonowych', 120.00, 1, 0, '2026-05-29 04:27:25', '2026-05-29 04:44:06'),
(3, 2, 1, 'Wymiana oleju i filtra', 150.00, 1, 0, '2026-05-29 04:27:25', '2026-05-29 04:44:06');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `service_types`
--

CREATE TABLE `service_types` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `default_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `service_types`
--

INSERT INTO `service_types` (`id`, `name`, `default_price`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Wymiana oleju i filtra', 150.00, 'Wymiana oleju silnikowego i filtra oleju', '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(2, 'Wymiana klocków hamulcowych', 200.00, 'Wymiana klocków hamulcowych przód lub tył', '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(3, 'Wymiana tarcz hamulcowych', 300.00, 'Wymiana tarcz hamulcowych przód lub tył', '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(4, 'Wymiana rozrządu', 800.00, 'Wymiana paska/łańcucha rozrządu z pompą wody', '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(5, 'Wymiana świec zapłonowych', 120.00, 'Wymiana kompletu świec zapłonowych', '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(6, 'Wymiana akumulatora', 50.00, 'Wymiana akumulatora (bez ceny części)', '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(7, 'Wymiana amortyzatorów', 250.00, 'Wymiana amortyzatorów przód lub tył', '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(8, 'Wymiana filtrów', 80.00, 'Wymiana filtra powietrza i kabinowego', '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(9, 'Diagnostyka komputerowa', 100.00, 'Diagnostyka komputerowa pojazdu', '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(10, 'Przegląd okresowy', 200.00, 'Przegląd okresowy pojazdu', '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(11, 'Naprawa układu wydechowego', 300.00, 'Naprawa lub wymiana elementów układu wydechowego', '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(12, 'Naprawa zawieszenia', 400.00, 'Naprawa elementów zawieszenia', '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(13, 'Wymiana sprzęgła', 900.00, 'Wymiana kompletu sprzęgła', '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(14, 'Naprawa klimatyzacji', 250.00, 'Serwis i naprawa klimatyzacji', '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(15, 'Geometria kół', 150.00, 'Ustawienie geometrii kół', '2026-05-29 04:09:40', '2026-05-29 04:09:40');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `login` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `login`, `password`, `role`, `first_name`, `last_name`, `phone`, `email`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'admin', '$2y$12$a9tsMXjawnfWjBnKELv9duoRwG.qeYogLzSt.PKltw99kxTNElXZC', 'admin', 'Tomasz', 'Nowak', '234567890', 'admin@warsztat.pl', NULL, '2026-05-29 04:09:39', '2026-05-29 04:09:39'),
(2, 'mechanik', '$2y$12$K3Ba5toY.ZwonJAa9N1ufOVeFg/BbaYaruOKgThDG9duscLSJg9nK', 'mechanic', 'Jan', 'Kowalski', '111222333', 'mechanik@warsztat.pl', NULL, '2026-05-29 04:09:39', '2026-05-29 04:09:39'),
(3, 'recepcja', '$2y$12$AH5j1TVKAIFkb9rPDeUFbuBv5uaq5mV49Dt6OBoPYgpIxFli4mWfa', 'recepcja', 'Anna', 'Nowak', '444555666', 'recepcja@warsztat.pl', NULL, '2026-05-29 04:09:40', '2026-05-29 04:09:40'),
(4, 'magazynier', '$2y$12$VVd/ccXIdRYPRBsa7rqPWuwb2qp.gGb1ATFVtzYP1nQ5AciUSUxtG', 'magazynier', 'Piotr', 'Wiśniewski', '777888999', 'magazynier@warsztat.pl', NULL, '2026-05-29 04:09:40', '2026-05-29 04:09:40');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `vehicles`
--

CREATE TABLE `vehicles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `customer_id` bigint(20) UNSIGNED NOT NULL,
  `make` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `license_plate` varchar(20) DEFAULT NULL,
  `vin` varchar(17) DEFAULT NULL,
  `access_code` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vehicles`
--

INSERT INTO `vehicles` (`id`, `customer_id`, `make`, `model`, `year`, `license_plate`, `vin`, `access_code`, `created_at`, `updated_at`) VALUES
(1, 1, 'Toyota', 'Corolla', 2018, 'WX12345', NULL, '095B03', '2026-05-29 04:18:37', '2026-05-29 04:18:37'),
(2, 2, 'Opel', 'Astra', 2000, 'RPR11111', '12131231231232', '9A71C4', '2026-05-29 04:27:25', '2026-05-29 04:27:25');

--
-- Indeksy dla zrzutów tabel
--

--
-- Indeksy dla tabeli `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indeksy dla tabeli `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indeksy dla tabeli `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`);

--
-- Indeksy dla tabeli `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  ADD KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`);

--
-- Indeksy dla tabeli `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoices_invoice_number_unique` (`invoice_number`),
  ADD KEY `invoices_repair_order_id_foreign` (`repair_order_id`),
  ADD KEY `invoices_customer_id_foreign` (`customer_id`),
  ADD KEY `invoices_issued_by_foreign` (`issued_by`);

--
-- Indeksy dla tabeli `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indeksy dla tabeli `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indeksy dla tabeli `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indeksy dla tabeli `order_parts`
--
ALTER TABLE `order_parts`
  ADD PRIMARY KEY (`order_id`,`part_id`),
  ADD KEY `order_parts_part_id_foreign` (`part_id`);

--
-- Indeksy dla tabeli `parts`
--
ALTER TABLE `parts`
  ADD PRIMARY KEY (`id`);

--
-- Indeksy dla tabeli `part_requests`
--
ALTER TABLE `part_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `part_requests_mechanic_id_foreign` (`mechanic_id`),
  ADD KEY `part_requests_repair_task_id_foreign` (`repair_task_id`),
  ADD KEY `part_requests_part_id_foreign` (`part_id`);

--
-- Indeksy dla tabeli `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indeksy dla tabeli `repair_orders`
--
ALTER TABLE `repair_orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `repair_orders_vehicle_id_foreign` (`vehicle_id`),
  ADD KEY `repair_orders_mechanic_id_foreign` (`mechanic_id`);

--
-- Indeksy dla tabeli `repair_tasks`
--
ALTER TABLE `repair_tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `repair_tasks_repair_order_id_foreign` (`repair_order_id`),
  ADD KEY `repair_tasks_service_type_id_foreign` (`service_type_id`);

--
-- Indeksy dla tabeli `service_types`
--
ALTER TABLE `service_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `service_types_name_unique` (`name`);

--
-- Indeksy dla tabeli `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indeksy dla tabeli `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_login_unique` (`login`);

--
-- Indeksy dla tabeli `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vehicles_customer_id_foreign` (`customer_id`),
  ADD KEY `vehicles_license_plate_index` (`license_plate`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `parts`
--
ALTER TABLE `parts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `part_requests`
--
ALTER TABLE `part_requests`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `repair_orders`
--
ALTER TABLE `repair_orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `repair_tasks`
--
ALTER TABLE `repair_tasks`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `service_types`
--
ALTER TABLE `service_types`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `invoices_issued_by_foreign` FOREIGN KEY (`issued_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `invoices_repair_order_id_foreign` FOREIGN KEY (`repair_order_id`) REFERENCES `repair_orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_parts`
--
ALTER TABLE `order_parts`
  ADD CONSTRAINT `order_parts_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `repair_orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_parts_part_id_foreign` FOREIGN KEY (`part_id`) REFERENCES `parts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `part_requests`
--
ALTER TABLE `part_requests`
  ADD CONSTRAINT `part_requests_mechanic_id_foreign` FOREIGN KEY (`mechanic_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `part_requests_part_id_foreign` FOREIGN KEY (`part_id`) REFERENCES `parts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `part_requests_repair_task_id_foreign` FOREIGN KEY (`repair_task_id`) REFERENCES `repair_tasks` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `repair_orders`
--
ALTER TABLE `repair_orders`
  ADD CONSTRAINT `repair_orders_mechanic_id_foreign` FOREIGN KEY (`mechanic_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `repair_orders_vehicle_id_foreign` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `repair_tasks`
--
ALTER TABLE `repair_tasks`
  ADD CONSTRAINT `repair_tasks_repair_order_id_foreign` FOREIGN KEY (`repair_order_id`) REFERENCES `repair_orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `repair_tasks_service_type_id_foreign` FOREIGN KEY (`service_type_id`) REFERENCES `service_types` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD CONSTRAINT `vehicles_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
