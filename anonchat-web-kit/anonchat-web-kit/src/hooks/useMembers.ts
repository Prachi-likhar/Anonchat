import { useInfiniteQuery } from '@tanstack/react-query';
import { membersApi } from '@/api/members';
import type { PublicMember, PaginatedResponse } from '@/types/api';

export interface UseMembersOptions {
  filter?: 'all' | 'male' | 'female' | 'online';
  search?: string;
  limit?: number;
}

export function useMembers({ filter = 'all', search = '', limit = 20 }: UseMembersOptions = {}) {
  const query = useInfiniteQuery<PaginatedResponse<PublicMember>, Error>({
    queryKey: ['members', { filter, search, limit }],
    queryFn: ({ pageParam }) =>
      membersApi.getMembers({
        filter,
        search: search.trim() || undefined,
        limit,
        cursor: (pageParam as string) || undefined,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    staleTime: 1000 * 30, // 30 seconds
  });

  const members: PublicMember[] =
    query.data?.pages.flatMap((page) => page.items) || [];

  return {
    ...query,
    members,
    totalCount: members.length,
  };
}

