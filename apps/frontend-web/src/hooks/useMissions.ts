import { useMissionStore } from '@/stores/mission'

export function useMissions() {
    const missions = useMissionStore((s) => s.missions)
    const currentMission = useMissionStore((s) => s.currentMission)
    const isLoading = useMissionStore((s) => s.isLoading)
    const error = useMissionStore((s) => s.error)
    const setMissions = useMissionStore((s) => s.setMissions)
    const addMission = useMissionStore((s) => s.addMission)
    const updateMission = useMissionStore((s) => s.updateMission)
    const deleteMission = useMissionStore((s) => s.deleteMission)
    const setCurrentMission = useMissionStore((s) => s.setCurrentMission)
    const setLoading = useMissionStore((s) => s.setLoading)
    const setError = useMissionStore((s) => s.setError)

    return {
        missions,
        currentMission,
        isLoading,
        error,
        setMissions,
        addMission,
        updateMission,
        deleteMission,
        setCurrentMission,
        setLoading,
        setError,
    }
}

