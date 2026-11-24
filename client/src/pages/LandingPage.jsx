import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SiteHeader, SiteFooter } from '../components/marketing/SiteChrome'
import Icon from '../components/marketing/Icon'

const POPULAR = ['React developer', 'Logo design', 'Landing page', 'SEO', 'Video editing']

const CATEGORIES = [
  { icon: 'code', name: 'Web Development', desc: 'Websites, web apps, APIs' },
  { icon: 'phone', name: 'Mobile Apps', desc: 'iOS, Android, Flutter' },
  { icon: 'layout', name: 'UI/UX Design', desc: 'Product & interface design' },
  { icon: 'brush', name: 'Graphic Design', desc: 'Logos, branding, print' },
  { icon: 'pen', name: 'Writing & Content', desc: 'Blogs, copy, docs' },
  { icon: 'megaphone', name: 'Digital Marketing', desc: 'SEO, social, ads' },
  { icon: 'video', name: 'Video & Animation', desc: 'Editing, motion, reels' },
  { icon: 'chart', name: 'Data & AI', desc: 'Analytics, ML, automation' },
]

const STEPS = {
  client: [
    { icon: 'doc', title: 'Post a job', body: 'Describe the work, set your budget and split it into milestones.' },
    { icon: 'user', title: 'Shortlist & hire', body: 'Compare profiles and past projects. Freelancers offering a discount are highlighted.' },
    { icon: 'lock', title: 'Fund the milestone', body: 'Pay into escrow via Razorpay. Work only starts once funds are locked.' },
    { icon: 'check', title: 'Approve & release', body: 'Review the verified deliverable. Approve to release payment, or raise a dispute.' },
  ],
  freelancer: [
    { icon: 'user', title: 'Build your profile', body: 'Add skills, links and portfolio. Profiles are reviewed before going live.' },
    { icon: 'briefcase', title: 'Apply to jobs', body: 'Send proposals on jobs that fit. Offer a discount to stand out.' },
    { icon: 'shield', title: 'Start once funded', body: 'You see the money locked in escrow before you write a single line.' },
    { icon: 'wallet', title: 'Deliver & get paid', body: 'Upload work, it gets a SHA-256 fingerprint. No response in 72h? Funds auto-release.' },
  ],
}

const FEATURES = [
  { icon: 'lock', title: 'Money locked before work starts', body: 'Clients fund each milestone up front. Freelancers never chase invoices again.' },
  { icon: 'fingerprint', title: 'Tamper-proof delivery records', body: 'Every file is hashed with SHA-256, so anyone can verify what was delivered and when.' },
  { icon: 'clock', title: '72-hour auto-release', body: 'If a client goes silent after delivery, payment releases automatically.' },
  { icon: 'scale', title: 'Fair dispute resolution', body: 'Evidence, chat history and delivery proofs go to an admin for a clear decision.' },
  { icon: 'chat', title: 'Built-in chat & calls', body: 'Talk, share files and hop on a video call without leaving the contract.' },
  { icon: 'tag', title: 'Discounts surfaced', body: 'Freelancers can offer a discount on a job, and clients see it right in the shortlist.' },
]

const FAQS = [
  { q: 'How does escrow protect me?', a: 'The client pays the milestone amount into escrow before work begins. The money is held by the platform and only released to the freelancer when the client approves the deliverable, or automatically 72 hours after delivery if the client does not respond.' },
  { q: 'What does SafeLancer cost?', a: 'Signing up and posting jobs is free. On each paid milestone the client pays a 2% fee on top and the freelancer has 2% deducted from the payout. There are no subscriptions.' },
  { q: 'What is SHA-256 verification?', a: 'When a freelancer uploads a deliverable we compute a unique fingerprint (hash) of the file. If the file changes even slightly, the fingerprint changes, which gives both sides proof of exactly what was delivered.' },
  { q: 'What happens if there is a dispute?', a: 'Either party can raise a dispute on a milestone. Funds stay locked while an admin reviews the contract, messages and delivery proofs, then decides how the funds are released.' },
  { q: 'Why do freelancer accounts need approval?', a: 'To keep quality high and reduce fraud, freelancer profiles (with optional LinkedIn, GitHub and portfolio links) are reviewed by an admin before they can apply to jobs.' },
]

/* ── Hero illustration: a static escrow contract card ── */
function ContractPreview() {
  const milestones = [
    { name: 'Wireframes & user flow', amount: '₹8,000', status: 'Paid', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
    { name: 'High-fidelity design', amount: '₹12,000', status: 'In escrow', tone: 'bg-orange-50 text-orange-700 ring-orange-600/20' },
    { name: 'Developer handoff', amount: '₹5,000', status: 'Upcoming', tone: 'bg-slate-100 text-slate-600 ring-slate-500/20' },
  ]
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">Contract</p>
            <p className="mt-0.5 text-base font-semibold text-slate-900">Mobile app redesign</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Active</span>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700">AK</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">Aditi K.</p>
            <p className="truncate text-xs text-slate-500">Product Designer · 4.9 ★</p>
          </div>
          <p className="text-sm font-semibold text-slate-900">₹25,000</p>
        </div>

        <ul className="mt-4 space-y-2.5 p-0">
          {milestones.map((m, i) => (
            <li key={m.name} className="flex list-none items-center gap-3">
              <span className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11px] font-semibold ${i === 0 ? 'bg-emerald-600 text-white' : i === 1 ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {i === 0 ? <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{m.name}</span>
              <span className="text-sm font-medium text-slate-900">{m.amount}</span>
              <span className={`hidden rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset sm:inline ${m.tone}`}>{m.status}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5">
          <div className="flex justify-between text-xs text-slate-500"><span>Released</span><span>₹8,000 of ₹25,000</span></div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-[32%] rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>

      <div className="absolute -bottom-6 -left-4 hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg shadow-slate-900/5 sm:flex">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Icon name="fingerprint" /></span>
        <div>
          <p className="text-xs font-semibold text-slate-900">Deliverable verified</p>
          <p className="font-mono text-[11px] text-slate-500">sha256: 9f2c…a41e</p>
        </div>
      </div>
      <div className="absolute -right-3 -top-4 hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg shadow-slate-900/5 sm:flex">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600"><Icon name="lock" className="h-4 w-4" /></span>
        <p className="text-xs font-semibold text-slate-900">₹12,000 secured</p>
      </div>
    </div>
  )
}

function SectionHeading({ eyebrow, title, sub, center }) {
  return (
    <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow && <p className="text-sm font-semibold text-orange-700">{eyebrow}</p>}
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      {sub && <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">{sub}</p>}
    </div>
  )
}

export default function LandingPage() {
  const nav = useNavigate()
  const [query, setQuery] = useState('')
  const [audience, setAudience] = useState('client')

  // Support /#section links coming from other pages.
  useEffect(() => {
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash)
      if (el) setTimeout(() => el.scrollIntoView(), 0)
    }
  }, [])

  const onSearch = e => {
    e.preventDefault()
    nav('/register?role=client')
  }

  return (
    <div className="light-ui min-h-screen">
      <SiteHeader />

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/70 to-white">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8 lg:pb-28 lg:pt-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Escrow on every milestone
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-[56px]">
              Hire top freelancers.<br />
              <span className="text-orange-600">Pay only for approved work.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              SafeLancer holds the payment in escrow until the work is delivered and approved, so clients don't pay for nothing and freelancers never go unpaid.
            </p>

            <form onSubmit={onSearch} className="mt-8 flex max-w-xl items-center gap-2 rounded-xl border border-slate-300 bg-white p-1.5 shadow-sm focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-100">
              <Icon name="search" className="ml-2.5 h-5 w-5 flex-none text-slate-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="What do you need done?"
                aria-label="What do you need done?"
                className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2.5 text-[15px] text-slate-900 outline-none placeholder:!text-slate-400"
              />
              <button type="submit" className="flex-none rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700">
                Find talent
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate-500">Popular:</span>
              {POPULAR.map(p => (
                <button key={p} type="button" onClick={() => setQuery(p)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50">
                  {p}
                </button>
              ))}
            </div>

            <p className="mt-8 text-sm text-slate-600">
              Looking for work?{' '}
              <Link to="/register?role=freelancer" className="font-semibold text-orange-700 underline-offset-4 hover:underline">Join as a freelancer →</Link>
            </p>
          </div>

          <ContractPreview />
        </div>
      </section>

      {/* ── Trust strip ────────────────────────────────── */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            ['lock', 'Funds held in escrow'],
            ['fingerprint', 'SHA-256 verified delivery'],
            ['clock', '72h auto-release'],
            ['card', 'Payments via Razorpay'],
          ].map(([icon, label]) => (
            <div key={label} className="flex items-center gap-3">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-slate-100 text-slate-700"><Icon name={icon} /></span>
              <span className="text-sm font-medium text-slate-800">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeading eyebrow="Explore" title="Find talent by category" />
          <Link to="/register?role=client" className="text-sm font-semibold text-orange-700 no-underline hover:underline">Post a job →</Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {CATEGORIES.map(c => (
            <button key={c.name} type="button" onClick={() => nav('/register?role=client')}
              className="group rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-900/5">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-600 group-hover:text-white">
                <Icon name={c.icon} className="h-6 w-6" />
              </span>
              <p className="mt-4 font-semibold text-slate-900">{c.name}</p>
              <p className="mt-1 text-sm text-slate-500">{c.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────── */}
      <section id="how-it-works" className="scroll-mt-16 bg-slate-50 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading center eyebrow="How it works" title="Four steps from idea to paid" sub="The same simple flow for every contract, with the payment protected the whole way." />

          <div className="mt-8 flex justify-center">
            <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-slate-200" role="tablist">
              {[['client', 'I want to hire'], ['freelancer', 'I want to work']].map(([key, label]) => (
                <button key={key} type="button" role="tab" aria-selected={audience === key} onClick={() => setAudience(key)}
                  className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${audience === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <ol className="mt-12 grid gap-6 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS[audience].map((s, i) => (
              <li key={s.title} className="relative list-none rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 text-orange-600"><Icon name={s.icon} className="h-6 w-6" /></span>
                  <span className="text-sm font-semibold text-slate-400">Step {i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{s.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 text-center">
            <Link to={`/register?role=${audience}`} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-3 text-sm font-semibold text-white no-underline transition-colors hover:bg-orange-700">
              {audience === 'client' ? 'Post your first job' : 'Create your freelancer profile'}
              <Icon name="arrow" className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why ────────────────────────────────────────── */}
      <section id="why" className="scroll-mt-16 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading eyebrow="Why SafeLancer" title="Trust built into every contract" sub="Most freelance platforms ask you to trust the other side. SafeLancer makes trust the default." />
        <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(f => (
            <div key={f.title} className="flex gap-4">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-slate-900 text-white"><Icon name={f.icon} /></span>
              <div>
                <h3 className="font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────── */}
      <section id="pricing" className="scroll-mt-16 bg-slate-50 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading center eyebrow="Pricing" title="Free to join. Pay only when work is paid." sub="No subscriptions or setup fees. A small fee is split between both sides on each completed milestone." />

          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            {[
              { who: 'Clients', pct: '2%', line: 'added to each milestone you fund', ex: 'Fund a ₹10,000 milestone → pay ₹10,200', icon: 'briefcase' },
              { who: 'Freelancers', pct: '2%', line: 'deducted from each payout', ex: 'Complete a ₹10,000 milestone → receive ₹9,800', icon: 'user' },
            ].map(p => (
              <div key={p.who} className="rounded-2xl border border-slate-200 bg-white p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600"><Icon name={p.icon} /></span>
                  <h3 className="text-lg font-semibold text-slate-900">{p.who}</h3>
                </div>
                <p className="mt-6 flex items-baseline gap-2">
                  <span className="text-5xl font-bold tracking-tight text-slate-900">{p.pct}</span>
                  <span className="text-sm text-slate-500">{p.line}</span>
                </p>
                <ul className="mt-6 space-y-3 p-0 text-sm text-slate-700">
                  {['Free sign-up and job posting', 'Escrow protection included', 'SHA-256 delivery proof', 'Dispute support'].map(x => (
                    <li key={x} className="flex list-none items-center gap-2.5"><Icon name="check" className="h-4 w-4 text-emerald-600" strokeWidth={2.2} />{x}</li>
                  ))}
                </ul>
                <p className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">{p.ex}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────── */}
      <section id="faq" className="scroll-mt-16 mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:py-24">
        <SectionHeading center title="Frequently asked questions" />
        <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
          {FAQS.map(f => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="flex-none text-slate-400 transition-transform group-open:rotate-45"><Icon name="plus" /></span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl bg-slate-900 px-6 py-14 text-center sm:px-12 sm:py-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Start your next project with confidence</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-300">Create a free account in under a minute. You only pay when a milestone is completed.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/register?role=client" className="rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold text-white no-underline transition-colors hover:bg-orange-500">Hire a freelancer</Link>
            <Link to="/register?role=freelancer" className="rounded-lg bg-white/10 px-6 py-3 text-sm font-semibold text-white no-underline ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/15">Find work</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
