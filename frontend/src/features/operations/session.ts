import type { OperationsUser } from './types';

const fallbackStaff: OperationsUser = {
  id: 11,
  email: 'an.nguyen@eduspace.edu.vn',
  fullName: 'Nguyễn Văn An',
  role: 'STAFF',
};

export function getOperationsUser(): OperationsUser {
  const stored = localStorage.getItem('eduspace_user');
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Partial<OperationsUser>;
      if (parsed.role === 'STAFF' || parsed.role === 'ADMIN') {
        return {
          id: parsed.id ?? (parsed.role === 'ADMIN' ? 1 : 11),
          email: parsed.email ?? fallbackStaff.email,
          fullName: parsed.fullName ?? (parsed.role === 'ADMIN' ? 'Admin' : fallbackStaff.fullName),
          role: parsed.role,
        };
      }
    } catch {
      // Ignore malformed demo session and fall back to Staff.
    }
  }

  const demoEmail = localStorage.getItem('eduspace_demo_user') ?? '';
  if (demoEmail.includes('admin')) {
    return { id: 1, email: 'admin@eduspace.edu.vn', fullName: 'Admin', role: 'ADMIN' };
  }
  if (demoEmail.includes('staff')) return fallbackStaff;
  return fallbackStaff;
}
