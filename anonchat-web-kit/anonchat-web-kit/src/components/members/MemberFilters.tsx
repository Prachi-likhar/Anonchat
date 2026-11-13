import React from 'react';
import { Search, X, Users, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';

export type MemberFilterType = 'all' | 'male' | 'female' | 'online';

export interface MemberFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  filter: MemberFilterType;
  onFilterChange: (filter: MemberFilterType) => void;
  totalCount?: number;
}

export const MemberFilters: React.FC<MemberFiltersProps> = ({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  totalCount,
}) => {
  const filterChips: Array<{ value: MemberFilterType; label: string; icon?: React.ReactNode }> = [
    { value: 'all', label: 'All Members', icon: <Users className="h-3.5 w-3.5" /> },
    { value: 'online', label: 'Online', icon: <span className="h-2 w-2 rounded-full bg-online animate-pulse" /> },
    { value: 'male', label: 'Male Only', icon: <span className="font-bold">♂</span> },
    { value: 'female', label: 'Female Only', icon: <span className="font-bold">♀</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search by anonymous ID (e.g. 4821)..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            rightIcon={
              search ? (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Clear search"
                  className="pointer-events-auto text-muted hover:text-text p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : undefined
            }
          />
        </div>

        {totalCount !== undefined && (
          <div className="inline-flex items-center gap-1.5 text-xs text-muted font-medium px-3 py-1.5 rounded-xl bg-surface border border-border">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>
              Showing <strong className="text-text">{totalCount}</strong> active members
            </span>
          </div>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {filterChips.map((chip) => {
          const isActive = filter === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => onFilterChange(chip.value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium border transition-all duration-150 select-none',
                isActive
                  ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm'
                  : 'border-border bg-surface text-muted hover:border-border/80 hover:text-text hover:bg-surface-2',
              )}
            >
              {chip.icon}
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

