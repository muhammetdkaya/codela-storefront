<?php
/** Approved Studio light scene, from the supplied standalone HTML. */
if ( ! defined( 'ABSPATH' ) ) { exit; }
?>
<div class="codela-scene" role="img" aria-label="Sıcak şampanya tepe ışığı altında yumuşakça açılan mat koyu laptop ve oluklu cam kartlar">
    <div class="codela-scene__stage" aria-hidden="true">
      <div class="codela-scene__atmosphere"></div>

      <!-- Volumetric warm champagne spotlight cone -->
      <svg class="codela-scene__beams" viewBox="0 0 1000 1000" preserveAspectRatio="none">
        <defs>
          <linearGradient id="cs-beam-falloff" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#fff4e0" stop-opacity="0.72"/>
            <stop offset="0.14" stop-color="#efd9b8" stop-opacity="0.24"/>
            <stop offset="0.58" stop-color="#d9ba93" stop-opacity="0.08"/>
            <stop offset="1" stop-color="#c9b299" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="cs-beam-core" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#fffaf0" stop-opacity="0.52"/>
            <stop offset="0.28" stop-color="#f3dfc8" stop-opacity="0.14"/>
            <stop offset="1" stop-color="#f3dfc8" stop-opacity="0"/>
          </linearGradient>
          <filter id="cs-soft-beam" x="-60%" y="-20%" width="220%" height="150%">
            <feGaussianBlur stdDeviation="15"/>
          </filter>
          <filter id="cs-soft-core" x="-50%" y="-20%" width="200%" height="150%">
            <feGaussianBlur stdDeviation="6"/>
          </filter>
          <linearGradient id="cs-haze-fade" x1="0" x2="0" y1="0" y2="1">
            <stop stop-color="white" stop-opacity="0"/>
            <stop offset="0.22" stop-color="white" stop-opacity="0.24"/>
            <stop offset="0.68" stop-color="white" stop-opacity="0.09"/>
            <stop offset="1" stop-color="white" stop-opacity="0"/>
          </linearGradient>
          <mask id="cs-haze-mask">
            <path d="M495 75 L220 845 Q500 905 780 845 L505 75Z" fill="url(#cs-haze-fade)" filter="url(#cs-soft-beam)"/>
          </mask>
          <filter id="cs-haze" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.011 0.024" numOctaves="3" seed="16"/>
            <feColorMatrix type="saturate" values="0"/>
            <feComponentTransfer>
              <feFuncR type="linear" slope="0.62" intercept="0.24"/>
              <feFuncG type="linear" slope="0.52" intercept="0.2"/>
              <feFuncB type="linear" slope="0.42" intercept="0.16"/>
              <feFuncA type="linear" slope="0.22"/>
            </feComponentTransfer>
          </filter>
        </defs>
        <g class="codela-scene__beam-drift">
          <path d="M490 72 L155 855 Q500 935 845 855 L510 72Z" fill="url(#cs-beam-falloff)" filter="url(#cs-soft-beam)"/>
          <path d="M495 72 L325 805 Q500 855 675 805 L505 72Z" fill="url(#cs-beam-core)" filter="url(#cs-soft-core)"/>
          <g mask="url(#cs-haze-mask)">
            <rect x="170" y="70" width="660" height="800" filter="url(#cs-haze)" opacity="0.45"/>
          </g>
        </g>
      </svg>

      <div class="codela-scene__source"></div>

      <!-- Quiet studio dust motes inside the spotlight -->
      <div class="codela-scene__motes">
        <span class="codela-scene__mote" style="left:44%;top:24%;--dur:8.5s;--delay:0.4s"></span>
        <span class="codela-scene__mote" style="left:55%;top:19%;--dur:10.2s;--delay:1.8s"></span>
        <span class="codela-scene__mote" style="left:49%;top:32%;--dur:9.4s;--delay:3.1s"></span>
        <span class="codela-scene__mote" style="left:57%;top:38%;--dur:11s;--delay:0.9s"></span>
        <span class="codela-scene__mote" style="left:42%;top:44%;--dur:9.8s;--delay:2.6s"></span>
        <span class="codela-scene__mote" style="left:52%;top:16%;--dur:8.8s;--delay:4.2s"></span>
        <span class="codela-scene__mote" style="left:46%;top:50%;--dur:10.6s;--delay:1.4s"></span>
      </div>

      <div class="codela-scene__floor"></div>
      <div class="codela-scene__caustic"></div>
      <div class="codela-scene__shadow"></div>

      <!-- Centerpiece 3D stage -->
      <div class="codela-scene__center">
        <div class="codela-scene__parallax">
          <div class="codela-scene__float">
            <div class="codela-laptop">
              <div class="codela-laptop__glow"></div>

              <!-- 3D Keyboard Base projecting forward -->
              <div class="codela-laptop__base">
                <div class="codela-laptop__front-lip"></div>
              </div>

              <!-- 3D Hinged Lid -->
              <div class="codela-laptop__lid-pivot">
                <div class="codela-laptop__lid-back"></div>
                <div class="codela-laptop__screen">
                  <div class="codela-laptop__rim"></div>
                  <div class="codela-laptop__display">
                    <div class="codela-laptop__display-content">
                      <!-- Calm architectural display: fluted glass light refraction + sculptural Codela C -->
                      <svg viewBox="0 0 600 370" xmlns="http://www.w3.org/2000/svg" role="presentation">
                        <defs>
                          <linearGradient id="scr-beam" x1="0.15" y1="0" x2="0.85" y2="1">
                            <stop offset="0" stop-color="#f7e4c8" stop-opacity="0"/>
                            <stop offset="0.38" stop-color="#e9cda6" stop-opacity="0.22"/>
                            <stop offset="0.54" stop-color="#fff2dc" stop-opacity="0.36"/>
                            <stop offset="0.7" stop-color="#d4b187" stop-opacity="0.12"/>
                            <stop offset="1" stop-color="#b8936a" stop-opacity="0"/>
                          </linearGradient>
                          <linearGradient id="scr-metal" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stop-color="#a89278"/>
                            <stop offset="0.28" stop-color="#f8e8cf"/>
                            <stop offset="0.55" stop-color="#bfa88c"/>
                            <stop offset="1" stop-color="#746455"/>
                          </linearGradient>
                          <linearGradient id="scr-glass-sheet" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stop-color="#f5e4ca" stop-opacity="0.18"/>
                            <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.02"/>
                            <stop offset="1" stop-color="#d8be9c" stop-opacity="0.12"/>
                          </linearGradient>
                          <pattern id="scr-flutes" width="12" height="370" patternUnits="userSpaceOnUse">
                            <rect x="0" y="0" width="2" height="370" fill="#fff1dc" fill-opacity="0.14"/>
                            <rect x="2" y="0" width="3" height="370" fill="#000000" fill-opacity="0.16"/>
                            <rect x="5" y="0" width="7" height="370" fill="#e7cfb2" fill-opacity="0.03"/>
                          </pattern>
                          <radialGradient id="scr-aura" cx="56%" cy="50%" r="48%">
                            <stop offset="0" stop-color="#e7cfb2" stop-opacity="0.26"/>
                            <stop offset="1" stop-color="#e7cfb2" stop-opacity="0"/>
                          </radialGradient>
                        </defs>

                        <rect width="600" height="370" fill="url(#scr-aura)"/>
                        <polygon points="160,0 410,0 530,370 280,370" fill="url(#scr-beam)"/>

                        <!-- Sculptural Codela C mark resting quietly in light -->
                        <g transform="translate(362 185)">
                          <path d="M52 -54 A74 74 0 1 0 52 54" fill="none" stroke="url(#scr-metal)" stroke-width="22" stroke-linecap="round"/>
                          <path d="M50 -62 A83 83 0 1 0 50 62" fill="none" stroke="#fff0d8" stroke-opacity="0.2" stroke-width="1"/>
                          <circle cx="58" cy="0" r="10" fill="url(#scr-metal)"/>
                        </g>

                        <!-- Translucent vertical fluted glass pane overlapping the left side of the C -->
                        <g>
                          <path d="M168 48 L314 26 L314 344 L168 326 Z" fill="url(#scr-glass-sheet)"/>
                          <path d="M168 48 L314 26 L314 344 L168 326 Z" fill="url(#scr-flutes)"/>
                          <path d="M168 48 L314 26 L314 344 L168 326 Z" fill="none" stroke="#e7cfb2" stroke-opacity="0.28" stroke-width="1.2"/>
                        </g>

                        <!-- Whisper-quiet horizon indicator lines -->
                        <g opacity="0.45">
                          <rect x="44" y="42" width="28" height="3" rx="1.5" fill="#e7cfb2"/>
                          <rect x="44" y="54" width="64" height="2" rx="1" fill="#8b8176"/>
                          <rect x="44" y="316" width="84" height="2" rx="1" fill="#e7cfb2" fill-opacity="0.4"/>
                          <circle cx="548" cy="46" r="3" fill="#e7cfb2"/>
                        </g>
                      </svg>
                    </div>
                    <div class="codela-laptop__sheen"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Floating Fluted-Glass Card 1: Minimal Code Glyph -->
            <div class="codela-card codela-card--code">
              <svg viewBox="0 0 112 76" xmlns="http://www.w3.org/2000/svg" role="presentation">
                <g fill="none" stroke="#e7cfb2" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M44 26 L32 36 L44 46"/>
                  <path d="M68 26 L80 36 L68 46"/>
                  <path d="M60 22 L52 50" stroke-opacity="0.72"/>
                </g>
                <rect x="24" y="60" width="38" height="3" rx="1.5" fill="#e7cfb2" fill-opacity="0.42"/>
                <rect x="68" y="60" width="20" height="3" rx="1.5" fill="#e7cfb2" fill-opacity="0.2"/>
              </svg>
            </div>

            <!-- Floating Fluted-Glass Card 2: Architectural Node Constellation -->
            <div class="codela-card codela-card--glass">
              <svg viewBox="0 0 118 148" xmlns="http://www.w3.org/2000/svg" role="presentation">
                <defs>
                  <linearGradient id="card-diag" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="#f7e5cb" stop-opacity="0.28"/>
                    <stop offset="1" stop-color="#e7cfb2" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <polygon points="0,24 118,0 118,86 0,118" fill="url(#card-diag)"/>
                <g stroke="#e7cfb2" stroke-opacity="0.45" stroke-width="1.3">
                  <line x1="34" y1="46" x2="82" y2="34"/>
                  <line x1="34" y1="46" x2="62" y2="82"/>
                  <line x1="82" y1="34" x2="62" y2="82"/>
                  <line x1="62" y1="82" x2="86" y2="112"/>
                </g>
                <g fill="#f5e3c8">
                  <circle cx="34" cy="46" r="4"/>
                  <circle cx="82" cy="34" r="3.5" fill-opacity="0.78"/>
                  <circle cx="62" cy="82" r="5"/>
                  <circle cx="86" cy="112" r="3" fill-opacity="0.65"/>
                </g>
                <circle cx="62" cy="82" r="11" fill="none" stroke="#e7cfb2" stroke-opacity="0.24" stroke-width="1"/>
              </svg>
            </div>

            <!-- Floating Fluted-Glass Card 3: Quiet Architecture Bar -->
            <div class="codela-card codela-card--pulse">
              <svg viewBox="0 0 126 52" xmlns="http://www.w3.org/2000/svg" role="presentation">
                <circle cx="20" cy="26" r="4" fill="#e7cfb2"/>
                <circle cx="20" cy="26" r="8" fill="none" stroke="#e7cfb2" stroke-opacity="0.26"/>
                <rect x="36" y="19" width="66" height="4" rx="2" fill="#e7cfb2" fill-opacity="0.65"/>
                <rect x="36" y="29" width="44" height="3" rx="1.5" fill="#e7cfb2" fill-opacity="0.28"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="codela-scene__vignette"></div>
    </div>


  </div>
