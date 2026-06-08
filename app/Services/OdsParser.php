<?php

namespace App\Services;

use ZipArchive;
use DOMDocument;
use DOMXPath;

class OdsParser
{
    /**
     * Parse ODS file and return array of sheets with absolute row index as keys.
     */
    public function parse($filePath)
    {
        $zip = new ZipArchive();
        if ($zip->open($filePath) !== true) {
            throw new \Exception("Cannot open ODS file: " . $filePath);
        }

        $contentXml = $zip->getFromName('content.xml');
        $zip->close();

        if (!$contentXml) {
            throw new \Exception("content.xml not found in ODS file.");
        }

        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        if (!$dom->loadXML($contentXml)) {
            libxml_clear_errors();
            throw new \Exception("Failed to load content.xml as XML.");
        }
        libxml_clear_errors();

        $xpath = new DOMXPath($dom);
        $xpath->registerNamespace('office', 'urn:oasis:names:tc:opendocument:xmlns:office:1.0');
        $xpath->registerNamespace('table', 'urn:oasis:names:tc:opendocument:xmlns:table:1.0');
        $xpath->registerNamespace('text', 'urn:oasis:names:tc:opendocument:xmlns:text:1.0');

        $tables = $xpath->query('//table:table');
        $result = [];

        foreach ($tables as $table) {
            $tableName = $table->getAttribute('table:name');
            if (empty($tableName)) {
                $tableName = 'Sheet';
            }

            $sheetData = [];
            $rows = $xpath->query('.//table:table-row', $table);
            
            $rowIdx = 0;
            foreach ($rows as $row) {
                $repeatRow = 1;
                if ($row->hasAttribute('table:number-rows-repeated')) {
                    $repeatRow = (int)$row->getAttribute('table:number-rows-repeated');
                }
                if ($repeatRow <= 0) {
                    $repeatRow = 1;
                }

                // Parse cell contents
                $rowData = [];
                $cells = $xpath->query('.//table:table-cell', $row);
                
                foreach ($cells as $cell) {
                    $repeatCol = 1;
                    if ($cell->hasAttribute('table:number-columns-repeated')) {
                        $repeatCol = (int)$cell->getAttribute('table:number-columns-repeated');
                    }
                    if ($repeatCol <= 0) {
                        $repeatCol = 1;
                    }
                    
                    $paragraphs = $xpath->query('.//text:p', $cell);
                    $cellText = [];
                    foreach ($paragraphs as $p) {
                        $cellText[] = $p->textContent;
                    }
                    $text = implode("\n", $cellText);
                    
                    for ($i = 0; $i < $repeatCol; $i++) {
                        $rowData[] = $text;
                    }
                }
                
                // Check if row has content
                $hasContent = false;
                foreach ($rowData as $val) {
                    if (trim($val) !== '') {
                        $hasContent = true;
                        break;
                    }
                }
                
                for ($r = 0; $r < $repeatRow; $r++) {
                    if ($hasContent) {
                        // Trim trailing empty cells
                        $trimmedRow = $rowData;
                        while (count($trimmedRow) > 0 && trim($trimmedRow[count($trimmedRow) - 1]) === '') {
                            array_pop($trimmedRow);
                        }
                        $sheetData[$rowIdx] = $trimmedRow;
                    }
                    $rowIdx++;
                }
            }
            $result[$tableName] = $sheetData;
        }

        return $result;
    }
}
