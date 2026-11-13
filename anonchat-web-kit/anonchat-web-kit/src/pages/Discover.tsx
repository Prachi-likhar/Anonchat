import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Compass, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { MemberFilters, type MemberFilterType } from '@/components/members/MemberFilters';
import { MemberCard } from '@/components/members/MemberCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useMembers } from '@/hooks/useMembers';
import { useConversations } from '@/hooks/useConversations';
import { useDebounce } from '@/hooks/useDebounce';

export const Discover: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlFilter = (searchParams.get('filter') as MemberFilterType) || 'all';
  const validFilter = ['all', 'male', 'female', 'online'].includes(urlFilter)
    ? urlFilter
    : 'all';

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const {
    members,
    isLoading,
    isError,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMembers({
    filter: validFilter,
    search: debouncedSearch,
  });

  const { startConversation, isStarting } = useConversations();

  const handleFilterChange = (newFilter: MemberFilterType) => {
    const params = new URLSearchParams(searchParams);
    if (newFilter === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', newFilter);
    }
    setSearchParams(params, { replace: true });
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    const params = new URLSearchParams(searchParams);
    if (val.trim()) {
      params.set('q', val.trim());
    } else {
      params.delete('q');
    }
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
          <Compass className="h-4 w-4" />
          <span>Community Directory</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
          Discover Members
        </h1>
        <p className="text-xs sm:text-sm text-muted">
          Browse verified members and initiate one-to-one anonymous conversations.
        </p>
      </div>

      {/* Filter and Search Controls */}
      <MemberFilters
        search={searchTerm}
        onSearchChange={handleSearchChange}
        filter={validFilter}
        onFilterChange={handleFilterChange}
        totalCount={members.length}
      />

      {/* Content Stream */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-surface p-5 space-y-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" className="h-12 w-12 flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-danger/20 bg-danger/5 p-8 text-center space-y-3">
          <AlertCircle className="mx-auto h-8 w-8 text-danger" />
          <h3 className="text-base font-semibold text-text">Unable to load community members</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            {error?.message || 'A network error occurred while fetching members. Please try again.'}
          </p>
          <div className="pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No members found"
          description={
            searchTerm
              ? `No anonymous members matched "${searchTerm}". Try another identifier or filter.`
              : 'There are currently no active members matching this category.'
          }
          action={
            searchTerm || validFilter !== 'all'
              ? {
                  label: 'Reset Filters',
                  onClick: () => {
                    setSearchTerm('');
                    handleFilterChange('all');
                  },
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onStartChat={startConversation}
                isStarting={isStarting}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="secondary"
                size="md"
                isLoading={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                Load More Members
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
