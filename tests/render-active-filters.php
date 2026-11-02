<?php
ob_start(); require __DIR__ . '/render-header.php'; $header = ob_get_clean();
ob_start(); codela_sf_catalog_filter_chips(); $chips = ob_get_clean();
echo json_encode( [ 'header' => $header, 'chips' => $chips, 'filters' => codela_sf_catalog_active_filters() ], JSON_THROW_ON_ERROR );
