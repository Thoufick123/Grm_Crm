const DEFAULT_ROLE_PERMISSIONS = {
  'Super Admin': { inbox: { view: true, create: true, edit: true, delete: true } },
  'Sales Specialist (Baby Collection)': {
    inbox: { view: true, create: true, edit: true, delete: false },
    staff: { view: true, create: false, edit: false, delete: false }
  }
};

const CRM_STATE = {
  rolePermissions: DEFAULT_ROLE_PERMISSIONS,
  staffList: [
    { id: 'staff_04', name: 'mekha', role: 'Sales Specialist (Baby Collection)' }
  ]
};

function getUserAssignedRoleName(user) {
  if (!user) return 'Super Admin';
  if (user.role === 'admin' || user.id === 'admin' || user.role === 'Super Admin' || (user.title && user.title.includes('Admin Manager'))) {
    return 'Super Admin';
  }
  if (user.role && CRM_STATE.rolePermissions && CRM_STATE.rolePermissions[user.role]) {
    return user.role;
  }
  if (user.title && CRM_STATE.rolePermissions && CRM_STATE.rolePermissions[user.title]) {
    return user.title;
  }
  const staffId = user.staff_id || user.staffId || user.id || user.role;
  const staffMember = (CRM_STATE.staffList || []).find(s => s.id === staffId || s.username === user.username);
  if (staffMember && staffMember.role) {
    return staffMember.role;
  }
  return user.title || user.role || 'Sales Specialist (Baby Collection)';
}

function canUserPerformAction(user, moduleName, action) {
  if (!user) return true;
  if (user.role === 'admin' || user.id === 'admin' || user.role === 'Super Admin') return true;

  const roleName = getUserAssignedRoleName(user);
  const rolePerms = CRM_STATE.rolePermissions[roleName] || DEFAULT_ROLE_PERMISSIONS[roleName];
  if (!rolePerms || !rolePerms[moduleName]) return false;

  return Boolean(rolePerms[moduleName][action]);
}

// Test with mekha session object
const mekhaUser = {
  id: 'staff_04',
  username: 'mekha',
  name: 'mekha',
  role: 'staff_04',
  title: 'Sales Specialist (Baby Collection)',
  staff_id: 'staff_04'
};

console.log('Role resolved:', getUserAssignedRoleName(mekhaUser));
console.log('Staff view perm:', canUserPerformAction(mekhaUser, 'staff', 'view'));
console.log('Staff create perm:', canUserPerformAction(mekhaUser, 'staff', 'create'));
console.log('Staff edit perm:', canUserPerformAction(mekhaUser, 'staff', 'edit'));
console.log('Staff delete perm:', canUserPerformAction(mekhaUser, 'staff', 'delete'));
console.log('Inbox view perm:', canUserPerformAction(mekhaUser, 'inbox', 'view'));
console.log('Inbox delete perm:', canUserPerformAction(mekhaUser, 'inbox', 'delete'));

