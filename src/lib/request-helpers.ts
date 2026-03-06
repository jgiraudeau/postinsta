import { headers } from 'next/headers';

export interface RequestUser {
  userId: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

export async function getUserFromRequest(): Promise<RequestUser | null> {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  const email = headersList.get('x-user-email');
  const role = headersList.get('x-user-role') as 'ADMIN' | 'USER' | null;

  if (!userId || !email || !role) return null;

  return { userId, email, role };
}

export async function requireAuth(): Promise<RequestUser> {
  const user = await getUserFromRequest();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireAdmin(): Promise<RequestUser> {
  const user = await requireAuth();
  if (user.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }
  return user;
}
