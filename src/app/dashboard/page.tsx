import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';

interface StatCard {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

interface Appointment {
  id: string;
  client_name: string;
  treatment: string;
  time: string;
  status: string;
}

async function getOverviewData() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Run queries in parallel
  const [
    appointmentsToday,
    appointmentsList,
    newLeads,
    activeCampaigns,
    totalClients,
    monthRevenue,
    pendingAppointments,
  ] = await Promise.all([
    query(
      `SELECT COUNT(*)::int AS count FROM al_appointments WHERE scheduled_at >= $1 AND scheduled_at < $2`,
      [todayStart, todayEnd],
    ).then((r) => r.rows[0]?.count ?? 0).catch(() => 0),

    query(
      `SELECT id, client_name, treatment, TO_CHAR(scheduled_at, 'HH12:MI AM') AS time, status
       FROM al_appointments
       WHERE scheduled_at >= $1 AND scheduled_at < $2
       ORDER BY scheduled_at ASC
       LIMIT 10`,
      [todayStart, todayEnd],
    ).then((r) => r.rows as Appointment[]).catch(() => [] as Appointment[]),

    query(
      `SELECT COUNT(*)::int AS count FROM al_leads WHERE created_at >= $1`,
      [yesterday],
    ).then((r) => r.rows[0]?.count ?? 0).catch(() => 0),

    query(
      `SELECT COUNT(*)::int AS count FROM al_ad_campaigns WHERE status = 'active'`,
    ).then((r) => r.rows[0]?.count ?? 0).catch(() => 0),

    query(
      `SELECT COUNT(*)::int AS count FROM al_clients`,
    ).then((r) => r.rows[0]?.count ?? 0).catch(() => 0),

    query(
      `SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM al_payments WHERE created_at >= $1`,
      [monthStart],
    ).then((r) => Number(r.rows[0]?.total ?? 0)).catch(() => 0),

    query(
      `SELECT COUNT(*)::int AS count FROM al_appointments WHERE status = 'pending'`,
    ).then((r) => r.rows[0]?.count ?? 0).catch(() => 0),
  ]);

  return {
    appointmentsToday,
    appointmentsList,
    newLeads,
    activeCampaigns,
    totalClients,
    monthRevenue,
    pendingAppointments,
  };
}

export default async function DashboardOverview() {
  const session = await requireAuth();
  const data = await getOverviewData();

  const stats: StatCard[] = [
    { label: "Today's Appointments", value: data.appointmentsToday, accent: true },
    { label: 'New Leads (24h)', value: data.newLeads },
    { label: 'Active Campaigns', value: data.activeCampaigns },
    { label: 'Total Clients', value: data.totalClients },
    { label: 'Revenue This Month', value: `PKR ${data.monthRevenue.toLocaleString()}`, sub: 'PKR' },
    { label: 'Pending Appointments', value: data.pendingAppointments },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl lg:text-3xl text-text-dark">
          Welcome back, {session.name}
        </h1>
        <p className="text-text-muted text-sm mt-1">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`
              rounded-xl p-5 shadow-sm border
              ${stat.accent
                ? 'bg-[#1A1A1A] text-white border-transparent'
                : 'bg-white text-text-dark border-border-light'
              }
            `}
          >
            <p className={`text-xs uppercase tracking-wider ${stat.accent ? 'text-gold' : 'text-text-muted'}`}>
              {stat.label}
            </p>
            <p className={`text-2xl lg:text-3xl font-semibold mt-2 ${stat.accent ? 'text-gold' : ''}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-xl shadow-sm border border-border-light p-6">
        <h2 className="font-serif text-lg text-text-dark mb-4">Today&apos;s Appointments</h2>
        {data.appointmentsList.length === 0 ? (
          <p className="text-text-muted text-sm py-4">No appointments scheduled for today.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light text-left">
                  <th className="pb-3 text-text-muted font-medium">Time</th>
                  <th className="pb-3 text-text-muted font-medium">Client</th>
                  <th className="pb-3 text-text-muted font-medium">Treatment</th>
                  <th className="pb-3 text-text-muted font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.appointmentsList.map((apt) => (
                  <tr key={apt.id} className="border-b border-border-light last:border-0">
                    <td className="py-3 text-text-dark font-medium">{apt.time}</td>
                    <td className="py-3 text-text-dark">{apt.client_name}</td>
                    <td className="py-3 text-text-light">{apt.treatment}</td>
                    <td className="py-3">
                      <span
                        className={`
                          inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${apt.status === 'confirmed' ? 'bg-green-100 text-green-700' : ''}
                          ${apt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                          ${apt.status === 'cancelled' ? 'bg-red-100 text-red-700' : ''}
                          ${!['confirmed', 'pending', 'cancelled'].includes(apt.status) ? 'bg-gray-100 text-gray-600' : ''}
                        `}
                      >
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
