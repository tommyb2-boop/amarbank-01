import React from 'react';

interface AmarBankLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  badgeOnly?: boolean;
  subtitle?: string;
  textClassName?: string;
  darkBackground?: boolean;
}

export const AmarBankLogo: React.FC<AmarBankLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  badgeOnly = false,
  subtitle = 'Kredit, Piutang & Neraca',
  textClassName = '',
  darkBackground = false,
}) => {
  const badgeDimensions = {
    sm: { width: 36, height: 36, rx: 9 },
    md: { width: 44, height: 44, rx: 11 },
    lg: { width: 68, height: 68, rx: 17 },
    xl: { width: 104, height: 104, rx: 26 },
  };

  const textSizes = {
    sm: { title: 'text-sm', sub: 'text-[9px]' },
    md: { title: 'text-base', sub: 'text-[10px]' },
    lg: { title: 'text-xl', sub: 'text-xs' },
    xl: { title: 'text-2xl', sub: 'text-sm' },
  };

  const currentBadge = badgeDimensions[size];

  // Vector SVG emblem matching official Amar Bank app icon (Scale of Justice + Monogram 'A' + Rising Financial Chart & Arrow)
  const EmblemSvg = (
    <div
      className="relative shrink-0 select-none group transition-transform duration-200"
      style={{
        width: currentBadge.width,
        height: currentBadge.height,
      }}
    >
      <svg
        viewBox="0 0 512 512"
        width="100%"
        height="100%"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Background Gradient: Rich Royal Blue to Deep Navy */}
          <linearGradient id="ab_bg_grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1B6CE5" />
            <stop offset="45%" stopColor="#0E48B0" />
            <stop offset="85%" stopColor="#093180" />
            <stop offset="100%" stopColor="#061D52" />
          </linearGradient>

          {/* Squircle Rim Border Highlight */}
          <linearGradient id="ab_border_grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#70B5FF" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#2B7FFF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0D47A1" stopOpacity="0.25" />
          </linearGradient>

          {/* Top Radial Spotlight */}
          <radialGradient id="ab_top_spot" cx="50%" cy="10%" r="55%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#1D4ED8" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0" />
          </radialGradient>

          {/* Metallic Gold Gradient */}
          <linearGradient id="ab_gold_grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF59D" />
            <stop offset="25%" stopColor="#FFD54F" />
            <stop offset="60%" stopColor="#FFA000" />
            <stop offset="85%" stopColor="#FF8F00" />
            <stop offset="100%" stopColor="#E65100" />
          </linearGradient>

          {/* Golden Highlight Stroke */}
          <linearGradient id="ab_gold_light" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFA000" />
            <stop offset="50%" stopColor="#FFE082" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>

          {/* Glowing White/Cyan for Pillar & Bar Charts */}
          <linearGradient id="ab_white_glow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#E1F5FE" />
            <stop offset="100%" stopColor="#B3E5FC" />
          </linearGradient>

          {/* Soft Filter Shadow */}
          <filter id="ab_soft_glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.4" />
          </filter>
          <filter id="ab_neon_glow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#38BDF8" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* 1. SQUIRCLE APP BADGE BACKGROUND */}
        <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#ab_bg_grad)" />
        <rect x="18" y="18" width="476" height="476" rx="110" fill="none" stroke="url(#ab_border_grad)" strokeWidth="4.5" />
        <rect x="22" y="22" width="468" height="240" rx="106" fill="url(#ab_top_spot)" />

        {/* 2. EMBLEM ICON: MONOGRAM 'A' + BALANCE SCALE + RISING CHART ARROW */}
        <g filter="url(#ab_soft_glow)">
          {/* A. Central Pillar (Glowing White Beam) */}
          <rect x="250" y="152" width="12" height="156" rx="6" fill="url(#ab_white_glow)" filter="url(#ab_neon_glow)" />

          {/* Top Pivot Ring */}
          <circle cx="256" cy="146" r="16" fill="#0D48B0" stroke="url(#ab_gold_grad)" strokeWidth="7" />
          <circle cx="256" cy="146" r="6" fill="url(#ab_gold_light)" />

          {/* Scale Crossbeam */}
          <path
            d="M 186 168 L 256 150 L 372 166"
            fill="none"
            stroke="url(#ab_gold_grad)"
            strokeWidth="7.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* B. Letter 'A' (Golden Left Strut & Swooping Arch) */}
          <path
            d="M 238 155 L 148 316 L 170 316 L 202 260 L 252 260 L 252 245 L 210 245 L 235 200 Z"
            fill="url(#ab_gold_grad)"
          />
          <path
            d="M 238 155 L 148 316"
            fill="none"
            stroke="url(#ab_gold_light)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M 148 316 Q 190 286 252 288"
            fill="none"
            stroke="url(#ab_gold_grad)"
            strokeWidth="6.5"
            strokeLinecap="round"
          />

          {/* Left suspension line */}
          <path d="M 186 168 L 152 270" fill="none" stroke="url(#ab_gold_grad)" strokeWidth="3" strokeLinecap="round" opacity="0.4" />

          {/* C. Right Pan Suspension Lines & Bowl */}
          <path d="M 372 166 L 332 258" fill="none" stroke="url(#ab_gold_grad)" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 372 166 L 398 258" fill="none" stroke="url(#ab_gold_grad)" strokeWidth="3.5" strokeLinecap="round" />

          {/* Golden Pan Bowl */}
          <path d="M 324 258 Q 365 306 406 258 Z" fill="url(#ab_gold_grad)" />
          <path d="M 320 258 L 410 258" fill="none" stroke="url(#ab_gold_light)" strokeWidth="4.5" strokeLinecap="round" />

          {/* D. Ascending Financial Chart Bars inside the Pan */}
          <rect x="342" y="218" width="13" height="40" rx="3.5" fill="url(#ab_white_glow)" />
          <rect x="360" y="196" width="13" height="62" rx="3.5" fill="url(#ab_white_glow)" />
          <rect x="378" y="174" width="13" height="84" rx="3.5" fill="url(#ab_white_glow)" />

          {/* E. Surging Financial Growth Arrow */}
          <path
            d="M 198 274 Q 252 248 308 214 T 414 136"
            fill="none"
            stroke="url(#ab_gold_grad)"
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 198 274 Q 252 248 308 214 T 414 136"
            fill="none"
            stroke="url(#ab_gold_light)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Arrow Head pointing top-right */}
          <path
            d="M 388 132 L 424 128 L 420 164 L 406 150 L 398 158 L 392 152 L 400 144 Z"
            fill="url(#ab_gold_grad)"
            stroke="url(#ab_gold_light)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* F. Pedestal Base */}
          <rect x="204" y="306" width="104" height="9" rx="4.5" fill="url(#ab_white_glow)" filter="url(#ab_neon_glow)" />
          <path d="M 216 318 L 296 318 L 306 328 L 206 328 Z" fill="url(#ab_gold_grad)" />
          <rect x="194" y="328" width="124" height="6" rx="3" fill="url(#ab_gold_light)" />
        </g>

        {/* 3. TYPOGRAPHY EMBEDDED IN ICON: 'AMAR BANK' */}
        <text
          x="256"
          y="420"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="44"
          fontWeight="900"
          fontFamily="'Plus Jakarta Sans', 'Outfit', 'Montserrat', 'Inter', -apple-system, sans-serif"
          letterSpacing="5"
          style={{ textTransform: 'uppercase', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.45))' }}
        >
          AMAR BANK
        </text>
      </svg>
    </div>
  );

  if (badgeOnly || !showText) {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {EmblemSvg}
      </div>
    );
  }

  // If size is 'lg' or 'xl', provide a centered stacked card option if desired, or elegant row
  const isLarge = size === 'lg' || size === 'xl';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {EmblemSvg}

      <div className={`flex flex-col justify-center ${textClassName}`}>
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`font-black tracking-tight ${textSizes[size].title} ${
              darkBackground ? 'text-white' : 'text-slate-900'
            }`}
          >
            AMAR <span className="text-blue-600">BANK</span>
          </span>
        </div>
        <span
          className={`font-semibold tracking-wider uppercase mt-0.5 ${textSizes[size].sub} ${
            darkBackground ? 'text-blue-200' : 'text-slate-500'
          }`}
        >
          {subtitle}
        </span>
      </div>
    </div>
  );
};
