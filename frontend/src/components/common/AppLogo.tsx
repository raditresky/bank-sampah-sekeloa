import React, { useState } from 'react';

interface AppLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCheckmark?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = '',
  size = 'md',
  showCheckmark = false,
}) => {
  const [imageError, setImageError] = useState<boolean>(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-lg',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-20 h-20 text-3xl',
  };

  const imageSrc = '/logo.png';

  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`}>
      {!imageError ? (
        <img
          src={imageSrc}
          alt="Logo Sampiah"
          onError={() => setImageError(true)}
          className={`${sizeClasses[size].split(' ')[0]} ${
            sizeClasses[size].split(' ')[1]
          } rounded-2xl object-cover shadow-sm border border-forest-100 bg-white`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-2xl bg-forest-900 border-2 border-forest-100 flex items-center justify-center text-white font-bold shadow-sm`}
        >
          <span className="text-forest-200 select-none">♻</span>
        </div>
      )}

      {showCheckmark && (
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-forest-600 text-white flex items-center justify-center border-2 border-white shadow-xs text-[10px]">
          ✓
        </div>
      )}
    </div>
  );
};
