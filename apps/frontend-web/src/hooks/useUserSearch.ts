import { useState, useCallback } from 'react';
import { chatService } from '@/services/chat.service';
import type { SearchUser } from '@/types/chat.types';

interface UserSearchCache {
  [userId: string]: SearchUser;
}

export const useUserSearch = () => {
  const [userCache, setUserCache] = useState<UserSearchCache>({});
  const [isLoading, setIsLoading] = useState(false);

  const getUserById = useCallback(
    async (userId: string): Promise<SearchUser | null> => {
      // Return cached user if available
      if (userCache[userId]) {
        return userCache[userId];
      }

      setIsLoading(true);
      try {
        // Search for user by ID (we'll use email search as fallback)
        const response = await chatService.searchUsers({ limit: 50 });

        if (response.error || !response.data) {
          return null;
        }

        // Find user in the results
        const user = response.data.find((u) => u.id === userId);

        if (user) {
          // Cache the user
          setUserCache((prev) => ({
            ...prev,
            [userId]: user,
          }));
          return user;
        }

        return null;
      } catch (error) {
        console.error('Error fetching user:', error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [userCache]
  );

  const getUserName = useCallback(
    async (userId: string): Promise<string> => {
      const user = await getUserById(userId);
      if (user) {
        return `${user.firstName} ${user.lastName}`.trim();
      }
      return 'Utilisateur inconnu';
    },
    [getUserById]
  );

  const clearCache = useCallback(() => {
    setUserCache({});
  }, []);

  return {
    getUserById,
    getUserName,
    userCache,
    isLoading,
    clearCache,
  };
};
