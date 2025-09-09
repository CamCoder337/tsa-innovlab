import { create } from 'zustand'
import type { User, UserRole } from '@/types/user.types'
import type { AuthState, AuthActions } from '@/types/store.types'

export type AuthStore = AuthState & AuthActions

const now = new Date()

export const mockUsers: Record<UserRole, User> = {
    'Affreteur': {
        id: 'user-aff-1',
        nom: 'Doe',
        prenom: 'Alice',
        email: 'affreteur@example.com',
        role: 'Affreteur',
        phone: '+237 696 123 456',
        company: 'Agro-Export SARL',
        address: 'Douala, Cameroun',
        createdAt: now,
        updatedAt: now,
    },
    'Transporteur': {
        id: 'user-tr-1',
        nom: 'Ngala',
        prenom: 'Peter',
        email: 'transporteur@example.com',
        role: 'Transporteur',
        phone: '+237 696 789 012',
        company: 'Transport Express SARL',
        address: 'Yaoundé, Cameroun',
        createdAt: now,
        updatedAt: now,
    },
    'Admin': {
        id: 'user-ad-1',
        nom: 'Kamga',
        prenom: 'Maya',
        email: 'admin@example.com',
        role: 'Admin',
        phone: '+237 696 555 789',
        company: 'TSA Logistics',
        address: 'Douala, Cameroun',
        createdAt: now,
        updatedAt: now,
    },
    'Client': {
        id: 'user-cl-1',
        nom: 'Client',
        prenom: 'Test',
        email: 'client@example.com',
        role: 'Client',
        phone: '+237 696 111 222',
        company: 'Test Company',
        address: 'Bafoussam, Cameroun',
        createdAt: now,
        updatedAt: now,
    },
}

function persistToLocalStorage(user: User | null) {
    try {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user))
            localStorage.setItem('userRole', user.role)
            localStorage.setItem('role', user.role)
        } else {
            localStorage.removeItem('user')
            localStorage.removeItem('userRole')
            localStorage.removeItem('role')
        }
    } catch { }
}

function loadUserFromLocalStorage(): User | null {
    try {
        const raw = localStorage.getItem('user')
        if (raw) return JSON.parse(raw)
    } catch { }
    return null
}

export const useAuthStore = create<AuthStore>((set, get) => ({
    currentUser: loadUserFromLocalStorage(),
    token: null,
    isAuthenticated: !!loadUserFromLocalStorage(),

    login: (user: User, token?: string) => {
        persistToLocalStorage(user)
        set({
            currentUser: user,
            token: token ?? null,
            isAuthenticated: true
        })
    },

    logout: () => {
        persistToLocalStorage(null)
        set({
            currentUser: null,
            token: null,
            isAuthenticated: false
        })
    },

    updateUser: (userData: Partial<User>) => {
        const currentUser = get().currentUser
        if (!currentUser) return

        const updatedUser: User = {
            ...currentUser,
            ...userData,
            updatedAt: new Date()
        }

        persistToLocalStorage(updatedUser)
        set({ currentUser: updatedUser })
    },

    setRole: (role: UserRole) => {
        const existing = get().currentUser
        const base = existing ?? mockUsers[role]
        if (!base) return

        const updated: User = {
            ...base,
            role,
            updatedAt: new Date()
        }
        persistToLocalStorage(updated)
        set({ currentUser: updated })
    },
}))

export function getDashboardPathForRole(): string {
    return '/dashboard'
}


