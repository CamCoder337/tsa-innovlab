import { useAuthStore } from '@/stores/user'

export function useAuth() {
    const user = useAuthStore((s) => s.currentUser)
    const token = useAuthStore((s) => s.token)
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const login = useAuthStore((s) => s.login)
    const logout = useAuthStore((s) => s.logout)
    const updateUser = useAuthStore((s) => s.updateUser)
    const setRole = useAuthStore((s) => s.setRole)

    return {
        user,
        token,
        isAuthenticated,
        login,
        logout,
        updateUser,
        setRole,
    }
}


