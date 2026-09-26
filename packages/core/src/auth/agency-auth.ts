export type AgencyRole = 'owner' | 'admin' | 'manager' | 'editor' | 'viewer';

export type AgencyAction = 
  | 'agency.view' 
  | 'agency.update'
  | 'team.view'
  | 'team.invite'
  | 'team.update_role'
  | 'team.remove'
  | 'client.view'
  | 'client.create'
  | 'client.update'
  | 'client.archive'
  | 'campaign.view'
  | 'campaign.create'
  | 'campaign.update'
  | 'campaign.delete'
  | 'content.view'
  | 'content.create'
  | 'content.update'
  | 'content.delete'
  | 'knowledge.view'
  | 'knowledge.create'
  | 'knowledge.update'
  | 'knowledge.delete'
  | 'profile.view'
  | 'profile.update';

export function authorizeAgencyAction(role: AgencyRole, action: AgencyAction): boolean {
  switch (role) {
    case 'owner':
      return true; // Full access
    case 'admin':
      // Admin cannot transfer ownership or perform destructive actions
      return !['agency.update'].includes(action);
    case 'manager':
      // Manager has full control over clients and content they have access to
      return [
        'agency.view',
        'client.view', 'client.create', 'client.update', 'client.archive',
        'campaign.view', 'campaign.create', 'campaign.update', 'campaign.delete',
        'content.view', 'content.create', 'content.update', 'content.delete',
        'knowledge.view', 'knowledge.create', 'knowledge.update', 'knowledge.delete',
        'profile.view', 'profile.update'
      ].includes(action);
    case 'editor':
      // Editor can view structure, create/edit content, but cannot delete structure
      return [
        'agency.view',
        'client.view',
        'campaign.view',
        'content.view', 'content.create', 'content.update',
        'knowledge.view',
        'profile.view'
      ].includes(action);
    case 'viewer':
      // Viewer is read-only
      return [
        'agency.view',
        'client.view',
        'campaign.view',
        'content.view',
        'knowledge.view',
        'profile.view'
      ].includes(action);
    default:
      return false;
  }
}

export function canManageRole(currentUserRole: AgencyRole, targetRoleToGrant: AgencyRole, currentTargetRole?: AgencyRole): boolean {
  if (currentUserRole === 'owner') return true;
  if (currentUserRole === 'admin') {
    // Admin cannot grant 'owner' or 'admin'
    if (['owner', 'admin'].includes(targetRoleToGrant)) return false;
    // Admin cannot modify existing 'owner' or 'admin'
    if (currentTargetRole && ['owner', 'admin'].includes(currentTargetRole)) return false;
    return true;
  }
  return false;
}
