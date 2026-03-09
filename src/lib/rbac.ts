/**
 * Role-Based Access Control (RBAC) for Aesthetic Lounge Staff Dashboard
 *
 * Roles:
 *   admin        — Owner/Asim: full access
 *   manager      — Dr. Huma / clinic manager: full access (same as admin)
 *   agent        — Call center: own leads, inbox, appointments, basic client view
 *   marketing    — Content team: marketing studio, ads, blog, SEO, Google, analytics
 *   receptionist — Front desk: appointments, intake, basic client, payments
 */

export type Role = 'admin' | 'manager' | 'agent' | 'marketing' | 'receptionist';

export type Permission =
  // Dashboard
  | 'dashboard:view'
  // Leads
  | 'leads:view'
  | 'leads:view_own'
  | 'leads:edit'
  | 'leads:assign'
  | 'leads:convert'
  // Clients
  | 'clients:view'
  | 'clients:view_medical'
  | 'clients:edit'
  | 'clients:photos'
  // Appointments
  | 'appointments:view'
  | 'appointments:edit'
  // Payments
  | 'payments:view'
  | 'payments:edit'
  // Inbox / Conversations
  | 'inbox:view'
  | 'inbox:send'
  // Marketing
  | 'marketing:view'
  | 'marketing:trigger'
  | 'marketing:approve'
  // Content / Blog
  | 'content:view'
  | 'content:edit'
  // Ads / Campaigns
  | 'ads:view'
  | 'ads:edit'
  // Google Business
  | 'google:view'
  | 'google:edit'
  // SEO
  | 'seo:view'
  | 'seo:edit'
  // Analytics
  | 'analytics:view'
  | 'analytics:sentiment'
  | 'analytics:agent_quality'
  // Performance
  | 'performance:view'
  // Feedback
  | 'feedback:view'
  // Services
  | 'services:view'
  | 'services:edit'
  // Intake Forms
  | 'intake:create'
  | 'intake:view'
  // Settings
  | 'settings:view'
  | 'settings:edit'
  // Staff Management
  | 'staff:view'
  | 'staff:edit';

/**
 * Permission matrix: role → set of permissions
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    // Admin gets everything
    'dashboard:view',
    'leads:view', 'leads:view_own', 'leads:edit', 'leads:assign', 'leads:convert',
    'clients:view', 'clients:view_medical', 'clients:edit', 'clients:photos',
    'appointments:view', 'appointments:edit',
    'payments:view', 'payments:edit',
    'inbox:view', 'inbox:send',
    'marketing:view', 'marketing:trigger', 'marketing:approve',
    'content:view', 'content:edit',
    'ads:view', 'ads:edit',
    'google:view', 'google:edit',
    'seo:view', 'seo:edit',
    'analytics:view', 'analytics:sentiment', 'analytics:agent_quality',
    'performance:view',
    'feedback:view',
    'services:view', 'services:edit',
    'intake:create', 'intake:view',
    'settings:view', 'settings:edit',
    'staff:view', 'staff:edit',
  ],

  manager: [
    // Manager (Dr. Huma) gets full access — same as admin
    'dashboard:view',
    'leads:view', 'leads:view_own', 'leads:edit', 'leads:assign', 'leads:convert',
    'clients:view', 'clients:view_medical', 'clients:edit', 'clients:photos',
    'appointments:view', 'appointments:edit',
    'payments:view', 'payments:edit',
    'inbox:view', 'inbox:send',
    'marketing:view', 'marketing:trigger', 'marketing:approve',
    'content:view', 'content:edit',
    'ads:view', 'ads:edit',
    'google:view', 'google:edit',
    'seo:view', 'seo:edit',
    'analytics:view', 'analytics:sentiment', 'analytics:agent_quality',
    'performance:view',
    'feedback:view',
    'services:view', 'services:edit',
    'intake:create', 'intake:view',
    'settings:view', 'settings:edit',
    'staff:view', 'staff:edit',
  ],

  agent: [
    'dashboard:view',
    'leads:view_own', 'leads:edit',
    'clients:view',
    'appointments:view', 'appointments:edit',
    'inbox:view', 'inbox:send',
    'intake:create', 'intake:view',
  ],

  marketing: [
    'dashboard:view',
    'marketing:view', 'marketing:trigger', 'marketing:approve',
    'content:view', 'content:edit',
    'ads:view', 'ads:edit',
    'google:view', 'google:edit',
    'seo:view', 'seo:edit',
    'analytics:view',
    'services:view',
  ],

  receptionist: [
    'dashboard:view',
    'clients:view',
    'appointments:view', 'appointments:edit',
    'payments:view', 'payments:edit',
    'intake:create', 'intake:view',
    'services:view',
  ],
};

// Pre-compute as Sets for fast lookup
const ROLE_PERMISSION_SETS: Record<Role, Set<Permission>> = {} as Record<Role, Set<Permission>>;
for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
  ROLE_PERMISSION_SETS[role as Role] = new Set(perms);
}

/** Check if a role has a specific permission */
export function hasPermission(role: string, permission: Permission): boolean {
  const set = ROLE_PERMISSION_SETS[role as Role];
  if (!set) return false;
  return set.has(permission);
}

/** Check if a role has ANY of the given permissions */
export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  const set = ROLE_PERMISSION_SETS[role as Role];
  if (!set) return false;
  return permissions.some((p) => set.has(p));
}

/** Check if a role has ALL of the given permissions */
export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  const set = ROLE_PERMISSION_SETS[role as Role];
  if (!set) return false;
  return permissions.every((p) => set.has(p));
}

/** Get all permissions for a role */
export function getPermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role as Role] || [];
}

/** Check if a role is valid */
export function isValidRole(role: string): role is Role {
  return role in ROLE_PERMISSIONS;
}

/** All available roles */
export const ALL_ROLES: Role[] = ['admin', 'manager', 'agent', 'marketing', 'receptionist'];

/**
 * Navigation items → required permissions mapping
 * Used by dashboard-shell to filter sidebar based on role
 */
export const NAV_PERMISSIONS: Record<string, Permission[]> = {
  '/dashboard':               ['dashboard:view'],
  '/dashboard/leads':         ['leads:view', 'leads:view_own'],
  '/dashboard/clients':       ['clients:view'],
  '/dashboard/appointments':  ['appointments:view'],
  '/dashboard/payments':      ['payments:view'],
  '/dashboard/ads':           ['ads:view'],
  '/dashboard/content':       ['content:view'],
  '/dashboard/marketing':     ['marketing:view'],
  '/dashboard/conversations': ['inbox:view'],
  '/dashboard/services':      ['services:view'],
  '/dashboard/google':        ['google:view'],
  '/dashboard/seo':           ['seo:view'],
  '/dashboard/analytics':     ['analytics:view'],
  '/dashboard/analytics/sentiment':     ['analytics:sentiment'],
  '/dashboard/analytics/agent-quality': ['analytics:agent_quality'],
  '/dashboard/performance':   ['performance:view'],
  '/dashboard/feedback':      ['feedback:view'],
  '/dashboard/settings':      ['settings:view'],
};

/** Role display labels */
export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  agent: 'Call Center Agent',
  marketing: 'Marketing Team',
  receptionist: 'Receptionist',
};
