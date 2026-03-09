import { getSession } from '@/lib/auth';
import { DashboardShell } from './dashboard-shell';
import AuthProvider from '@/components/AuthProvider';

export const metadata = {
  title: 'Dashboard | Aesthetic Lounge',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // No session = login page (middleware handles redirect for other pages)
  if (!session) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  return (
    <AuthProvider>
      <DashboardShell session={session}>
        {children}
      </DashboardShell>
    </AuthProvider>
  );
}
