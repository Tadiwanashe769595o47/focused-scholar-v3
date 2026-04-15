import type { User } from '../stores/authStore';

export function getRoleHomePath(type?: User['type'] | null): string {
  switch (type) {
    case 'teacher':
      return '/teacher';
    case 'parent':
      return '/parent';
    case 'holiday':
      return '/holiday/import';
    case 'student':
      return '/dashboard';
    default:
      return '/login';
  }
}

export function getViewerStudentId(user: User | null | undefined): number | null {
  if (!user) return null;
  if (user.type === 'parent') return user.student_id ?? null;
  if (user.type === 'student') return user.id;
  return null;
}

export function getUserDisplayName(user: User | null | undefined): string {
  if (!user) return 'Focused Scholar';
  return user.name || user.username || 'Focused Scholar';
}
