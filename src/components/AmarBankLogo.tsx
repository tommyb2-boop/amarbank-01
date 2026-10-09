import React from 'react';

interface AmarBankLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const AmarBankLogo: React.FC<AmarBankLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 28,
    xl: 38,
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Official Symbol: White notebook and pencil symbol with elegant banking blue background (#0D47A1) */}
      <div
        className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center shadow-md shadow-blue-900/20 text-white shrink-0`}
        style={{ backgroundColor: '#0D47A1' }}
      >
        <svg
          width={iconSizes[size]}
          height={iconSizes[size]}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Notebook outline with bookmark and pencil */}
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10" />
          <path d="M6 10h10" />
          <path d="M6 14h6" />
          {/* Pencil symbol angled */}
          <path d="m18 13 3 3-5 5h-3v-3l5-5Z" fill="white" stroke="none" />
          <path d="m18 13 3 3-5 5h-3v-3l5-5Z" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className="font-extrabold tracking-tight text-slate-900 leading-tight"
              style={{ fontSize: size === 'sm' ? '1rem' : size === 'lg' ? '1.5rem' : '1.18rem' }}
            >
              AMAR <span style={{ color: '#0D47A1' }}>BANK</span>
            </span>
          </div>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">
            Kredit & Piutang
          </span>
        </div>
      )}
    </div>
  );
};
