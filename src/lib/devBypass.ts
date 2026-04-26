/**
 * ⚠️ MIDLERTIDIG DEV BYPASS ⚠️
 *
 * Når DEV_BYPASS_AUTH = true:
 * - Alle ProtectedRoutes er åbne (ingen login-redirect)
 * - useAuth() returnerer Emil's konto (ek@klockmann.dk) med admin + owner roller
 * - Login-sider auto-redirecter til de respektive dashboards
 *
 * SÆT TIL false FØR PRODUKTION / NÅR FIVERR-UDVIKLERE ER FÆRDIGE.
 */
export const DEV_BYPASS_AUTH = true;

// Emil Klockmann (admin + owner)
export const DEV_BYPASS_USER = {
  id: '74a122fb-b6fc-48bc-8cee-944801ee2448',
  email: 'ek@klockmann.dk',
  full_name: 'Emil Klockmann',
};

export const DEV_BYPASS_ROLES = ['admin', 'owner'] as const;
