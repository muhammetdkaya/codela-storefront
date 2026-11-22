<?php
/** Animated Studio monolith and fluted-glass scene, adapted from the approved HTML. */
if ( ! defined( 'ABSPATH' ) ) { exit; }
?>
<div class="codela-monolith" role="group" aria-label="Kadraj dışından çapraz düşen sıcak şampanya ışığı altında mat koyu monolit ve dikey oluklu cam panel">
    <canvas class="codela-monolith__canvas" aria-hidden="true"></canvas>
    <button class="codela-monolith__control" type="button" aria-label="Animasyonu duraklat" aria-pressed="false" title="Duraklat / Sürdür">
      <svg data-pause viewBox="0 0 20 20" aria-hidden="true">
        <rect x="5" y="4" width="3" height="12" rx="1"/>
        <rect x="12" y="4" width="3" height="12" rx="1"/>
      </svg>
      <svg data-play viewBox="0 0 20 20" aria-hidden="true">
        <path d="M6 3L16 10L6 17Z"/>
      </svg>
    </button>
  </div>
