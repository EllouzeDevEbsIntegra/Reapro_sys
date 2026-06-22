import { useAuthStore } from '../stores/auth'

/**
 * Helpers de permissions RBAC (Lot 3) pour les composants.
 * Le backend reste la source de vérité ; ces helpers ne servent qu'au masquage ergonomique.
 *
 * Exemple :
 *   const { hasPermission, isSuperAdmin } = usePermissions()
 *   if (hasPermission('B2B_ACCESS')) { ... }
 */
export function usePermissions() {
    const auth = useAuthStore()
    return {
        get isSuperAdmin() { return auth.isSuperAdmin },
        hasPermission: (code) => auth.hasPermission(code),
        hasAnyPermission: (codes) => auth.hasAnyPermission(codes),
        canAccessRoute: (route) => auth.canAccessRoute(route)
    }
}
