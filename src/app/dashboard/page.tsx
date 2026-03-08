import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { PerformanceBanner } from './performance-banner';

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

interface RecentConversation {
  phone: string;
  name: string | null;
  last_message: string;
  direction: string;
  unread: number;
  last_at: string;
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
    recentConversations,
    leadScoreStats,
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

    query(
      `SELECT
         c.phone,
         l.name,
         c.content AS last_message,
         c.direction,
         c.created_at AS last_at,
         (SELECT COUNT(*)::int FROM al_conversations c2 WHERE c2.phone = c.phone AND c2.read = false) AS unread
       FROM al_conversations c
       LEFT JOIN al_leads l ON c.lead_id = l.id
       WHERE c.created_at = (
         SELECT MAX(c3.created_at) FROM al_conversations c3 WHERE c3.phone = c.phone
       )
       ORDER BY c.created_at DESC
       LIMIT 5`,
    ).then((r) => r.rows as RecentConversation[]).catch(() => [] as RecentConversation[]),

    query(
      `SELECT
        COUNT(CASE WHEN score >= 70 THEN 1 END)::int AS hot_count,
        COUNT(CASE WHEN score >= 40 AND score < 70 THEN 1 END)::int AS warm_count,
        COUNT(CASE WHEN converted_at IS NOT NULL AND converted_at >= $1 THEN 1 END)::int AS converted_this_month,
        COUNT(CASE WHEN created_at >= $1 THEN 1 END)::int AS leads_this_month,
        ROUND(AVG(COALESCE(score, 0)))::int AS avg_score
      FROM al_leads`,
      [monthStart],
    ).then((r) => r.rows[0]).catch(() => ({ hot_count: 0, warm_count: 0, converted_this_month: 0, leads_this_month: 0, avg_score: 0 })),
  ]);

  return {
    appointmentsToday,
    appointmentsList,
    newLeads,
    activeCampaigns,
    totalClients,
    monthRevenue,
    pendingAppointments,
    recentConversations,
    leadScoreStats,
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
      {/* Performance Banner */}
      <PerformanceBanner />

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

      {/* Lead Pipeline Card */}
      <div className="bg-white rounded-xl shadow-sm border border-border-light p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg text-text-dark">Lead Pipeline</h2>
          <a href="/dashboard/leads" className="text-xs text-gold font-medium hover:underline">View All</a>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-lg">
              &#x1F525;
            </div>
            <div>
              <p className="text-xl font-semibold text-text-dark">{data.leadScoreStats.hot_count}</p>
              <p className="text-xs text-text-muted">Hot Leads</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-lg">
              &#x2600;&#xFE0F;
            </div>
            <div>
              <p className="text-xl font-semibold text-text-dark">{data.leadScoreStats.warm_count}</p>
              <p className="text-xs text-text-muted">Warm Leads</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-lg">
              &#x2705;
            </div>
            <div>
              <p className="text-xl font-semibold text-text-dark">
                {data.leadScoreStats.leads_this_month > 0
                  ? Math.round((data.leadScoreStats.converted_this_month / data.leadScoreStats.leads_this_month) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-text-muted">Conversion Rate</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-lg">
              &#x1F4CA;
            </div>
            <div>
              <p className="text-xl font-semibold text-text-dark">{data.leadScoreStats.avg_score || 0}</p>
              <p className="text-xs text-text-muted">Avg Score</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

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

      {/* Recent WhatsApp Conversations */}
      <div className="bg-white rounded-xl shadow-sm border border-border-light p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg text-text-dark">WhatsApp Conversations</h2>
          <a href="/dashboard/conversations" className="text-xs text-gold font-medium hover:underline">View All</a>
        </div>
        {data.recentConversations.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-3">💬</div>
            <p className="text-text-muted text-sm">No conversations yet.</p>
            <p className="text-text-muted text-xs mt-1">WhatsApp messages will appear here once the n8n pipeline is connected.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {data.recentConversations.map((conv) => {
              const initial = (conv.name || conv.phone)?.[0]?.toUpperCase() || '?';
              const timeAgo = (() => {
                const diff = Date.now() - new Date(conv.last_at).getTime();
                const mins = Math.floor(diff / 60000);
                if (mins < 60) return `${mins}m`;
                const hrs = Math.floor(mins / 60);
                if (hrs < 24) return `${hrs}h`;
                return `${Math.floor(hrs / 24)}d`;
              })();
              return (
                <a
                  key={conv.phone}
                  href={`/dashboard/conversations?phone=${encodeURIComponent(conv.phone)}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-warm-white transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gold-pale flex items-center justify-center text-gold-dark text-sm font-semibold shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-text-dark truncate">{conv.name || conv.phone}</p>
                      <span className="text-[10px] text-text-muted shrink-0 ml-2">{timeAgo}</span>
                    </div>
                    <p className="text-xs text-text-muted truncate mt-0.5">
                      {conv.direction === 'outbound' ? '↗ ' : ''}{conv.last_message}
                    </p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="bg-gold text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        )}
      </div>

      </div>
    </div>
  );
}
