import fs from 'fs';
import { execSync } from 'child_process';

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient: Deep Royal Blue to Midnight Blue -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1B6CE5" />
      <stop offset="45%" stop-color="#0E48B0" />
      <stop offset="85%" stop-color="#093180" />
      <stop offset="100%" stop-color="#061D52" />
    </linearGradient>

    <!-- Squircle Border Highlight Gradient -->
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#70B5FF" stop-opacity="0.9" />
      <stop offset="40%" stop-color="#2B7FFF" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#0D47A1" stop-opacity="0.2" />
    </linearGradient>

    <!-- Top Glow Spotlight -->
    <radialGradient id="topSpot" cx="50%" cy="10%" r="55%">
      <stop offset="0%" stop-color="#60A5FA" stop-opacity="0.45" />
      <stop offset="50%" stop-color="#1D4ED8" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#1E3A8A" stop-opacity="0" />
    </radialGradient>

    <!-- Metallic Gold Gradient -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF59D" />
      <stop offset="25%" stop-color="#FFD54F" />
      <stop offset="60%" stop-color="#FFA000" />
      <stop offset="85%" stop-color="#FF8F00" />
      <stop offset="100%" stop-color="#E65100" />
    </linearGradient>

    <!-- Light Golden Highlight -->
    <linearGradient id="goldLight" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFA000" />
      <stop offset="50%" stop-color="#FFE082" />
      <stop offset="100%" stop-color="#FFFFFF" />
    </linearGradient>

    <!-- Glowing White/Cyan Gradient for Pillar and Bars -->
    <linearGradient id="whiteGlow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="50%" stop-color="#E1F5FE" />
      <stop offset="100%" stop-color="#B3E5FC" />
    </linearGradient>

    <!-- Arrow Gradient -->
    <linearGradient id="arrowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFB300" />
      <stop offset="50%" stop-color="#FFD54F" />
      <stop offset="100%" stop-color="#FFF9C4" />
    </linearGradient>

    <!-- Soft Drop Shadow Filter -->
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.35" />
    </filter>

    <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#38BDF8" flood-opacity="0.6" />
    </filter>

    <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#FFB300" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- 1. ICON SQUIRCLE BASE -->
  <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#bgGrad)" />
  <!-- Border Rim Highlight -->
  <rect x="18" y="18" width="476" height="476" rx="110" fill="none" stroke="url(#borderGrad)" stroke-width="4.5" />
  <!-- Top Inner Glow -->
  <rect x="22" y="22" width="468" height="240" rx="106" fill="url(#topSpot)" />

  <!-- 2. CENTRAL EMBLEM: LETTER 'A' + BALANCE SCALE + FINANCIAL GROWTH CHART -->
  <g filter="url(#softGlow)">
    <!-- A. CENTRAL BALANCE SCALE PILLAR (Glowing White Column) -->
    <!-- Column -->
    <rect x="250" y="152" width="12" height="156" rx="6" fill="url(#whiteGlow)" filter="url(#neonGlow)" />

    <!-- Top Pivot Ring (Golden Circle at Apex) -->
    <circle cx="256" cy="146" r="16" fill="#0D48B0" stroke="url(#goldGrad)" stroke-width="7" />
    <circle cx="256" cy="146" r="6" fill="url(#goldLight)" />

    <!-- Scale Balance Crossbeam: Golden bar across top -->
    <path d="M 186 168 L 256 150 L 372 166" fill="none" stroke="url(#goldGrad)" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round" />

    <!-- B. THE LETTER 'A' MONOGRAM (Golden Left Strut & Arc) -->
    <!-- Left sweeping leg of 'A' -->
    <path d="M 238 155 L 148 316 L 170 316 L 202 260 L 252 260 L 252 245 L 210 245 L 235 200 Z"
          fill="url(#goldGrad)" />
    <!-- Golden stroke contour on A for glossy 3D look -->
    <path d="M 238 155 L 148 316" fill="none" stroke="url(#goldLight)" stroke-width="5" stroke-linecap="round" />

    <!-- Curved arch of 'A' crossbar swooping across to center -->
    <path d="M 148 316 Q 190 286 252 288" fill="none" stroke="url(#goldGrad)" stroke-width="6.5" stroke-linecap="round" />

    <!-- Left pan suspension line -->
    <path d="M 186 168 L 152 270" fill="none" stroke="url(#goldGrad)" stroke-width="3" stroke-linecap="round" opacity="0.4" />

    <!-- C. RIGHT BALANCE SCALE PAN (Golden Bowl holding financial chart) -->
    <!-- Right suspension lines from crossbeam -->
    <path d="M 372 166 L 332 258" fill="none" stroke="url(#goldGrad)" stroke-width="3.5" stroke-linecap="round" />
    <path d="M 372 166 L 398 258" fill="none" stroke="url(#goldGrad)" stroke-width="3.5" stroke-linecap="round" />

    <!-- Golden Pan Bowl (Curved semi-ellipse) -->
    <path d="M 324 258 Q 365 306 406 258 Z" fill="url(#goldGrad)" />
    <!-- Pan Bowl Golden Rim -->
    <path d="M 320 258 L 410 258" fill="none" stroke="url(#goldLight)" stroke-width="4.5" stroke-linecap="round" />

    <!-- D. FINANCIAL BAR CHART (3 Ascending Bars inside the Pan) -->
    <!-- Bar 1 (Left, Shortest) -->
    <rect x="342" y="218" width="13" height="40" rx="3.5" fill="url(#whiteGlow)" />
    <!-- Bar 2 (Middle) -->
    <rect x="360" y="196" width="13" height="62" rx="3.5" fill="url(#whiteGlow)" />
    <!-- Bar 3 (Right, Tallest) -->
    <rect x="378" y="174" width="13" height="84" rx="3.5" fill="url(#whiteGlow)" />

    <!-- E. UPWARD FINANCIAL GROWTH ARROW (Surging Golden Arrow) -->
    <!-- Dynamic curved trendline crossing over scale -->
    <path d="M 198 274 Q 252 248 308 214 T 414 136"
          fill="none" stroke="url(#goldGrad)" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#goldGlow)" />
    <path d="M 198 274 Q 252 248 308 214 T 414 136"
          fill="none" stroke="url(#goldLight)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Arrow Head at (418, 132) pointing top-right -->
    <path d="M 388 132 L 424 128 L 420 164 L 406 150 L 398 158 L 392 152 L 400 144 Z"
          fill="url(#goldGrad)" stroke="url(#goldLight)" stroke-width="1.5" stroke-linejoin="round" filter="url(#goldGlow)" />

    <!-- F. PEDESTAL BASE (Glowing Pediment Stand) -->
    <!-- Upper Glowing Cyan/White Light Bar -->
    <rect x="204" y="306" width="104" height="9" rx="4.5" fill="url(#whiteGlow)" filter="url(#neonGlow)" />
    <!-- Lower Golden Pediment Base -->
    <path d="M 216 318 L 296 318 L 306 328 L 206 328 Z" fill="url(#goldGrad)" />
    <rect x="194" y="328" width="124" height="6" rx="3" fill="url(#goldLight)" />
  </g>

  <!-- 3. TYPOGRAPHY: 'AMAR BANK' IN BOLD CLEAN WHITE -->
  <text x="256" y="420"
        text-anchor="middle"
        fill="#FFFFFF"
        font-size="44"
        font-weight="900"
        font-family="'Plus Jakarta Sans', 'Outfit', 'Montserrat', 'Inter', -apple-system, sans-serif"
        letter-spacing="5"
        style="text-transform: uppercase; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.45));">
    AMAR BANK
  </text>
</svg>`;

import path from 'path';

const publicDir = path.resolve(process.cwd(), 'public');
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);
fs.writeFileSync(path.join(publicDir, 'amar-bank-logo.svg'), svgContent);
console.log('SVG files generated successfully in', publicDir);

// Convert to PNG sizes using ImageMagick convert
try {
  const iconSvg = path.join(publicDir, 'icon.svg');
  execSync(`convert -background none -resize 192x192 "${iconSvg}" "${path.join(publicDir, 'pwa-192x192.png')}"`);
  execSync(`convert -background none -resize 512x512 "${iconSvg}" "${path.join(publicDir, 'pwa-512x512.png')}"`);
  execSync(`convert -background none -resize 512x512 "${iconSvg}" "${path.join(publicDir, 'pwa-maskable-512x512.png')}"`);
  execSync(`convert -background none -resize 180x180 "${iconSvg}" "${path.join(publicDir, 'apple-touch-icon.png')}"`);
  execSync(`convert -background none -resize 64x64 "${iconSvg}" "${path.join(publicDir, 'favicon.ico')}"`);
  console.log('PNG and ICO icons converted successfully');
} catch (e) {
  console.error('Convert failed:', e);
}
