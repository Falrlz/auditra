<?php
require 'vendor/autoload.php';
$parser = new App\Services\OdsParser();
$sheets = $parser->parse('a10.ods');
$sheetA10 = isset($sheets['A10']) ? $sheets['A10'] : array_values($sheets)[0];
$fp = fopen('a10_rows_dump.txt', 'w');
foreach ($sheetA10 as $idx => $row) {
    // Check if the row contains anything non-empty
    $nonEmpty = false;
    foreach ($row as $cell) {
        if (trim((string)$cell) !== '') {
            $nonEmpty = true;
            break;
        }
    }
    if ($nonEmpty) {
        // Strip trailing empty cells
        $cleanRow = $row;
        while (count($cleanRow) > 0 && trim((string)$cleanRow[count($cleanRow) - 1]) === '') {
            array_pop($cleanRow);
        }
        fwrite($fp, sprintf('[Row %d] %s' . PHP_EOL, $idx + 1, json_encode($cleanRow, JSON_UNESCAPED_UNICODE)));
    }
}
fclose($fp);
echo "Dumped successfully to a10_rows_dump.txt\n";
