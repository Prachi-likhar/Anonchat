import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { AVATAR_COLORS } from '@/lib/constants';

export interface AvatarColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  className?: string;
}

export const AvatarColorPicker: React.FC<AvatarColorPickerProps> = ({
  value,
  onChange,
  disabled = false,
  className,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-text">Avatar Palette</label>
      <div className="grid grid-cols-6 sm:grid-cols-12 gap-2.5">
        {AVATAR_COLORS.map((hex) => {
          const isSelected = value.toLowerCase() === hex.toLowerCase();
          return (
            <button
              key={hex}
              type="button"
              disabled={disabled}
              onClick={() => onChange(hex)}
              aria-label={`Select color ${hex}`}
              style={{ backgroundColor: hex }}
              className={cn(
                'relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed',
                isSelected &&
                  'ring-2 ring-primary ring-offset-2 ring-offset-surface shadow-md scale-105',
              )}
            >
              {isSelected && <Check className="h-4 w-4 text-white drop-shadow-md stroke-[3]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
