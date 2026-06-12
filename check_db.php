<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$f = \App\Models\AuditForm::find(1);
file_put_contents('a10_db_dump.json', json_encode($f->section_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
echo "Dumped section_data of ID 1 to a10_db_dump.json\n";
