import { useState, useEffect, useCallback } from 'react';
import { UserService } from '@/lib/user-service';

// Cache for user names to avoid repeated API calls
const userNameCache = new Map<string, string>();

/**
 * Hook to resolve user IDs to display names
 */
export function useUserNames(userIds: string[]) {
  const [userNames, setUserNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);

  const fetchUserNames = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;

    setLoading(true);
    const nameMap = new Map<string, string>();
    const idsToFetch: string[] = [];

    // Check cache first
    ids.forEach(id => {
      if (userNameCache.has(id)) {
        nameMap.set(id, userNameCache.get(id)!);
      } else {
        idsToFetch.push(id);
      }
    });

    // Fetch uncached user names
    if (idsToFetch.length > 0) {
      try {
        const promises = idsToFetch.map(async (id) => {
          const user = await UserService.getUserById(id);
          const displayName = user?.name || user?.firstName + ' ' + user?.lastName || user?.email || id;
          return { id, name: displayName };
        });

        const results = await Promise.all(promises);
        
        results.forEach(({ id, name }) => {
          nameMap.set(id, name);
          userNameCache.set(id, name); // Cache the result
        });
      } catch (error) {
        console.error('Error fetching user names:', error);
        // Fallback to showing user IDs
        idsToFetch.forEach(id => {
          nameMap.set(id, id);
          userNameCache.set(id, id);
        });
      }
    }

    setUserNames(nameMap);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUserNames(userIds);
  }, [fetchUserNames, userIds]);

  return { userNames, loading };
}

/**
 * Hook to resolve a single user ID to display name
 */
export function useUserName(userId: string | undefined) {
  const { userNames, loading } = useUserNames(userId ? [userId] : []);
  
  return {
    userName: userId ? userNames.get(userId) || userId : '',
    loading
  };
}
