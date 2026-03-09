import Link from 'next/link';

// Static page — visual-first, minimal text for Pakistan audience

const AGENTS = [
  { name: 'Orchestrator', icon: '🎯', color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', desc: 'Picks topics' },
  { name: 'Researcher', icon: '🔍', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', desc: 'Finds facts' },
  { name: 'Copywriter', icon: '✍️', color: 'from-green-500 to-green-600', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', desc: 'Writes copy' },
  { name: 'Designer', icon: '🎨', color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', desc: 'Makes images' },
  { name: 'Publisher', icon: '📲', color: 'from-pink-500 to-pink-600', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', desc: 'Posts to IG' },
  { name: 'Analyst', icon: '📊', color: 'from-red-500 to-red-600', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', desc: 'Tracks results' },
];

const PIPELINE_STEPS = [
  { icon: '💡', label: 'Topic', color: 'bg-purple-500', agent: 'Orchestrator', human: false },
  { icon: '🔬', label: 'Research', color: 'bg-blue-500', agent: 'Researcher', human: false },
  { icon: '📝', label: 'Write', color: 'bg-green-500', agent: 'Copywriter', human: false },
  { icon: '👁️', label: 'Review', color: 'bg-amber-500', agent: '', human: true },
  { icon: '🖼️', label: 'Image', color: 'bg-orange-500', agent: 'Designer', human: false },
  { icon: '✅', label: 'Approve', color: 'bg-amber-500', agent: '', human: true },
  { icon: '📱', label: 'Publish', color: 'bg-pink-500', agent: 'Publisher', human: false },
];

const DRAFT_STAGES = [
  { label: 'Review Copy', color: 'bg-amber-400', icon: '📝' },
  { label: 'Needs Design', color: 'bg-blue-400', icon: '🎨' },
  { label: 'Ready', color: 'bg-green-400', icon: '✅' },
  { label: 'Published', color: 'bg-gray-400', icon: '📱' },
  { label: 'Rejected', color: 'bg-red-400', icon: '✕' },
];

export default function HowItWorksPage() {
  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/marketing" className="text-text-muted hover:text-text-dark transition-colors text-sm">
          Marketing Studio
        </Link>
        <span className="text-text-muted">/</span>
        <h1 className="font-serif text-2xl font-semibold text-text-dark">How It Works</h1>
      </div>

      {/* ═══ HERO: Tech Stack Visual ═══ */}
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D] rounded-2xl p-8 mb-8 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <h2 className="text-xl font-semibold mb-6 relative z-10">AI Marketing Pipeline</h2>

        {/* 4 tech boxes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          {[
            { name: 'AI Brain', icon: '🧠', desc: 'Copy & Strategy', color: 'border-purple-400/50 bg-purple-500/10' },
            { name: 'Image Engine', icon: '🖼️', desc: 'Image Generation', color: 'border-blue-400/50 bg-blue-500/10' },
            { name: 'Instagram', icon: '📱', desc: 'Publishing', color: 'border-pink-400/50 bg-pink-500/10' },
            { name: 'Smart Memory', icon: '💾', desc: 'Memory & Drafts', color: 'border-amber-400/50 bg-amber-500/10' },
          ].map((tech) => (
            <div key={tech.name} className={`rounded-xl border ${tech.color} p-4 text-center`}>
              <div className="text-3xl mb-2">{tech.icon}</div>
              <p className="text-sm font-semibold">{tech.name}</p>
              <p className="text-[11px] text-white/50">{tech.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ 6 AGENTS: Visual Cards ═══ */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-text-dark mb-4">6 AI Agents</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AGENTS.map((agent) => (
            <div key={agent.name} className={`${agent.bg} border ${agent.border} rounded-xl p-4 text-center transition-transform hover:scale-[1.02]`}>
              <div className="text-4xl mb-2">{agent.icon}</div>
              <p className={`text-sm font-bold ${agent.text}`}>{agent.name}</p>
              <p className="text-xs text-text-muted mt-1">{agent.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ PIPELINE FLOW: Visual Diagram ═══ */}
      <div className="bg-white rounded-2xl border border-border p-6 md:p-8 mb-8">
        <h2 className="text-lg font-semibold text-text-dark mb-6">Content Flow</h2>

        {/* Desktop: horizontal flow */}
        <div className="hidden md:block">
          <div className="flex items-start justify-between relative">
            {/* Connecting line */}
            <div className="absolute top-6 left-6 right-6 h-0.5 bg-gradient-to-r from-purple-300 via-green-300 to-pink-300" />

            {PIPELINE_STEPS.map((step, i) => (
              <div key={i} className="flex flex-col items-center relative z-10 w-[13%]">
                {/* Circle */}
                <div className={`w-12 h-12 rounded-full ${step.color} text-white flex items-center justify-center text-xl shadow-lg ${step.human ? 'ring-2 ring-amber-300 ring-offset-2' : ''}`}>
                  {step.icon}
                </div>
                {/* Label */}
                <p className="text-xs font-semibold text-text-dark mt-2 text-center">{step.label}</p>
                {/* Agent or Human badge */}
                {step.human ? (
                  <span className="mt-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold">
                    YOU
                  </span>
                ) : (
                  <span className="mt-1 text-[9px] text-text-muted">{step.agent}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: vertical flow */}
        <div className="md:hidden space-y-0">
          {PIPELINE_STEPS.map((step, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full ${step.color} text-white flex items-center justify-center text-lg shadow-md ${step.human ? 'ring-2 ring-amber-300 ring-offset-1' : ''}`}>
                  {step.icon}
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className="w-0.5 h-6 bg-border-light" />
                )}
              </div>
              <div className="pb-6">
                <p className="text-sm font-semibold text-text-dark">{step.label}</p>
                <p className="text-[11px] text-text-muted">
                  {step.human ? 'Your approval' : step.agent}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ DRAFT STAGES: Visual Status Bar ═══ */}
      <div className="bg-white rounded-2xl border border-border p-6 mb-8">
        <h2 className="text-lg font-semibold text-text-dark mb-4">Draft Stages</h2>

        {/* Progress bar visual */}
        <div className="flex rounded-xl overflow-hidden h-10 mb-4">
          {DRAFT_STAGES.map((stage, i) => (
            <div
              key={i}
              className={`${stage.color} flex-1 flex items-center justify-center gap-1.5 text-white text-[11px] font-semibold ${i === 0 ? 'rounded-l-xl' : ''} ${i === DRAFT_STAGES.length - 1 ? 'rounded-r-xl' : ''}`}
            >
              <span>{stage.icon}</span>
              <span className="hidden sm:inline">{stage.label}</span>
            </div>
          ))}
        </div>

        {/* Arrow flow below */}
        <div className="flex items-center justify-center gap-1 text-text-muted text-xs">
          <span>📝 Write</span>
          <span>→</span>
          <span>👁️ Review</span>
          <span>→</span>
          <span>🎨 Design</span>
          <span>→</span>
          <span>✅ Approve</span>
          <span>→</span>
          <span>📱 Publish</span>
        </div>
      </div>

      {/* ═══ CONTENT TYPES: Visual Grid ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { type: 'Post', icon: '📷', desc: '1 image', link: '/dashboard/marketing/posts' },
          { type: 'Carousel', icon: '🎠', desc: 'Multi-slide', link: '/dashboard/marketing/carousels' },
          { type: 'Reel', icon: '🎬', desc: 'Short video', link: '/dashboard/marketing/reels' },
          { type: 'Ad', icon: '📢', desc: 'Meta Ads', link: '/dashboard/ads/create' },
        ].map((ct) => (
          <Link key={ct.type} href={ct.link} className="bg-white rounded-xl border border-border p-5 text-center hover:border-gold hover:shadow-sm transition-all group">
            <div className="text-4xl mb-2">{ct.icon}</div>
            <p className="text-sm font-bold text-text-dark group-hover:text-gold transition-colors">{ct.type}</p>
            <p className="text-[11px] text-text-muted">{ct.desc}</p>
          </Link>
        ))}
      </div>

      {/* ═══ AD CREATIVE: 4-Step Visual ═══ */}
      <div className="bg-white rounded-2xl border border-border p-6 mb-8">
        <h2 className="text-lg font-semibold text-text-dark mb-4">Ad Creative</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { step: 1, icon: '👤', label: 'Pick Model', color: 'bg-purple-50 border-purple-200' },
            { step: 2, icon: '💬', label: 'Instructions', color: 'bg-blue-50 border-blue-200' },
            { step: 3, icon: '⚡', label: 'Generate', color: 'bg-orange-50 border-orange-200' },
            { step: 4, icon: '🚀', label: 'Launch Ad', color: 'bg-green-50 border-green-200' },
          ].map((item) => (
            <div key={item.step} className={`${item.color} border rounded-xl p-4 text-center relative`}>
              <div className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-gold text-white text-xs font-bold flex items-center justify-center shadow">
                {item.step}
              </div>
              <div className="text-3xl mb-2">{item.icon}</div>
              <p className="text-xs font-bold text-text-dark">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ MODELS PAGE: Visual Feature Grid ═══ */}
      <div className="bg-white rounded-2xl border border-border p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-dark">Models Page</h2>
          <Link href="/dashboard/marketing/models" className="text-xs text-gold hover:text-gold-dark font-medium">
            Open →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '👁️', label: 'Browse Gallery', desc: 'All AI characters + photos' },
            { icon: '✨', label: 'Create Character', desc: 'AI builds full profile' },
            { icon: '📸', label: 'Generate Photos', desc: 'New photos with AI' },
            { icon: '📤', label: 'Upload Photos', desc: 'Real model photos' },
          ].map((f, i) => (
            <div key={i} className="bg-warm-white rounded-lg p-3 flex items-center gap-3">
              <span className="text-2xl">{f.icon}</span>
              <div>
                <p className="text-xs font-bold text-text-dark">{f.label}</p>
                <p className="text-[10px] text-text-muted">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ ARCHITECTURE: Visual Diagram ═══ */}
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D] rounded-2xl p-6 md:p-8 text-white">
        <h2 className="text-lg font-semibold mb-6">System Architecture</h2>

        {/* Central hub */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center text-3xl shadow-lg">
            ⚙️
          </div>
          <p className="text-sm font-bold mt-2">Dashboard</p>
          <p className="text-[10px] text-white/40">Aesthetic Lounge Platform</p>
        </div>

        {/* API routes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { route: '/pipeline', desc: 'AI agents', color: 'border-purple-400/30 bg-purple-500/10' },
            { route: '/drafts', desc: 'Draft queue', color: 'border-blue-400/30 bg-blue-500/10' },
            { route: '/ad-creative', desc: 'Ad generation', color: 'border-orange-400/30 bg-orange-500/10' },
            { route: '/status', desc: 'Health check', color: 'border-green-400/30 bg-green-500/10' },
          ].map((api) => (
            <div key={api.route} className={`border ${api.color} rounded-lg p-3 text-center`}>
              <p className="text-[11px] font-mono font-bold">{api.route}</p>
              <p className="text-[10px] text-white/40">{api.desc}</p>
            </div>
          ))}
        </div>

        {/* External connections */}
        <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
          <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300">AI Brain</span>
          <span>+</span>
          <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">Image Engine</span>
          <span>+</span>
          <span className="px-2 py-1 rounded bg-pink-500/20 text-pink-300">Instagram</span>
          <span>+</span>
          <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300">Smart Memory</span>
          <span>+</span>
          <span className="px-2 py-1 rounded bg-green-500/20 text-green-300">Media Storage</span>
        </div>
      </div>
    </div>
  );
}
