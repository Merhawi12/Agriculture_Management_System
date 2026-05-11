// Routes each role is allowed to visit (null = unrestricted)
export const ROLE_ROUTES = {
  super_admin:  null,
  farmer:       ['/dashboard', '/farms', '/crops', '/livestock', '/inventory', '/finance', '/sales', '/marketplace', '/weather', '/predictions', '/monitoring', '/notifications'],
  farm_manager: ['/dashboard', '/farms', '/crops', '/livestock', '/inventory', '/finance', '/workers', '/equipment', '/sales', '/marketplace', '/weather', '/predictions', '/monitoring', '/notifications'],
  agronomist:   ['/dashboard', '/crops', '/inventory', '/weather', '/predictions', '/monitoring', '/notifications'],
  accountant:   ['/dashboard', '/finance', '/inventory', '/sales', '/workers', '/notifications'],
  worker:       ['/dashboard', '/marketplace', '/weather', '/notifications'],
};

export function canAccess(role, route) {
  const allowed = ROLE_ROUTES[role];
  if (allowed === null || allowed === undefined) return true;
  return allowed.includes(route);
}

export function getAllowedRoutes(role) {
  return ROLE_ROUTES[role] ?? null;
}
