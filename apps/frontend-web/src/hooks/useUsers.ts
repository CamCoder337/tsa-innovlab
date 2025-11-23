import { useCallback } from 'react';
import { useUserStore } from '@/stores/userStore';
/**
 * Main hook for user management operations
 */
export const useUsers = () => {
  const {
    users,
    selectedUser,
    userStats,
    isLoading,
    error,
    pagination,
    setUsers,
    setSelectedUser,
    fetchUsers,
    fetchUser,
    fetchUserStats,
    updateUser,
    suspendUser,
    activateUser,
    deleteUser,
    setLoading,
    setError,
    clearError,
    reset,
  } = useUserStore();

  const getUserById = useCallback(
    (id: string) => {
      return users.find((user) => user.id === id);
    },
    [users]
  );

  const getUsersByRole = useCallback(
    (role: string) => {
      return users.filter((user) => user.role === role);
    },
    [users]
  );

  const getUsersByStatus = useCallback(
    (status: string) => {
      return users.filter((user) => user.status === status);
    },
    [users]
  );

  const searchUsers = useCallback(
    (query: string) => {
      if (!query.trim()) return users;

      const lowercaseQuery = query.toLowerCase();
      return users.filter(
        (user) =>
          user.firstName?.toLowerCase().includes(lowercaseQuery) ||
          user.lastName?.toLowerCase().includes(lowercaseQuery) ||
          user.email?.toLowerCase().includes(lowercaseQuery) ||
          user.phone?.toLowerCase().includes(lowercaseQuery)
      );
    },
    [users]
  );

  const getTotalUsers = useCallback(() => {
    return users.length;
  }, [users]);

  const getActiveUsers = useCallback(() => {
    return users.filter((user) => user.status === 'active').length;
  }, [users]);

  const getPendingUsers = useCallback(() => {
    return users.filter((user) => user.status === 'pending').length;
  }, [users]);

  const getSuspendedUsers = useCallback(() => {
    return users.filter((user) => user.status === 'suspended').length;
  }, [users]);

  return {
    // State
    users,
    selectedUser,
    userStats,
    isLoading,
    error,
    pagination,

    // Actions
    setUsers,
    setSelectedUser,
    fetchUsers,
    fetchUser,
    fetchUserStats,
    updateUser,
    suspendUser,
    activateUser,
    deleteUser,
    setLoading,
    setError,
    clearError,
    reset,

    // Enhanced methods
    getUserById,
    getUsersByRole,
    getUsersByStatus,
    searchUsers,
    getTotalUsers,
    getActiveUsers,
    getPendingUsers,
    getSuspendedUsers,
  };
};
