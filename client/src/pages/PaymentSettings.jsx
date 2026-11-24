import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import { PageHeader, Stat, StatusPill, btn, inr, humanize, fmtDate } from '../components/ui'
import PaymentVerifyModal from '../components/PaymentVerifyModal'
import toast from 'react-hot-toast'
import { calcCompletion } from '../utils/profileCompletion'

export default function PaymentSettings() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const navigate = useNavigate()
  const isClient = user.role === 'client'
  const isFreelancer = user.role === 'freelancer'

  const [portfolio, setPortfolio] = useState(null)
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [payoutForm, setPayoutForm] = useState({ payoutMethod: 'upi', upiId: '', bankAccountNumber: '', ifscCode: '', accountHolderName: '' })
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [editingPayout, setEditingPayout] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)

  const [milestones, setMilestones] = useState([])   // all milestones across my contracts
  const [txs, setTxs] = useState([])                 // freelancer payouts (real transactions)
  const [wallet, setWallet] = useState(0)

  useEffect(() => {
    Promise.all([
      api.get('/api/auth/me'),
      isClient ? api.get('/api/contracts/my-contracts') : api.get('/api/contracts/my-work'),
      isFreelancer ? api.get('/api/transactions/my').catch(() => ({ data: {} })) : Promise.resolve({ data: {} }),
    ]).then(async ([me, c, tx]) => {
      const p = me.data.portfolio
      const list = c.data || []
      setPortfolio(p)
      setContracts(list)
      setTxs(tx.data?.transactions || [])
      setWallet(tx.data?.walletBalance || 0)
      if (isFreelancer && p) {
        setPayoutForm({
          payoutMethod: p.payoutMethod || 'upi',
          upiId: p.upiId || '',
          bankAccountNumber: p.bankAccountNumber || '',
          ifscCode: p.ifscCode || '',
          accountHolderName: p.accountHolderName || '',
        })
      }
      const ms = await Promise.all(list.map(ct =>
        api.get(`/api/milestones/contract/${ct._id}`).then(r => (r.data || []).map(m => ({ ...m, _contract: ct }))).catch(() => [])
      ))
      setMilestones(ms.flat())
    }).catch(() => toast.error('Failed to load payment data'))
      .finally(() => setLoading(false))
  }, [])

  const handleVerified = () => {
    setPortfolio(prev => {
      const updated = { ...prev, paymentVerified: true }
      const pct = calcCompletion(user.role, updated)
      localStorage.setItem('profileCompletion', String(pct))
      window.dispatchEvent(new Event('profileUpdated'))
      return updated
    })
    toast.success('Payment method verified!')
  }

  const savePayoutDetails = async () => {
    setPayoutLoading(true)
    try {
      await api.post('/api/portfolio/payout-details', payoutForm)
      setPortfolio(prev => ({ ...prev, payoutDetailsAdded: true, paymentVerified: false, payoutMethod: payoutForm.payoutMethod, upiId: payoutForm.upiId, bankAccountNumber: payoutForm.bankAccountNumber, ifscCode: payoutForm.ifscCode, accountHolderName: payoutForm.accountHolderName }))
      setEditingPayout(false)
      toast.success('Details saved! Click Verify to confirm your payout account.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save payout details')
    } finally {
      setPayoutLoading(false)
    }
  }

  const verifyPayoutDetails = async () => {
    setVerifyLoading(true)
    try {
      const { data } = await api.post('/api/portfolio/verify-payout')
      setPortfolio(prev => ({ ...prev, paymentVerified: true }))
      const pct = data.completionPercent
      localStorage.setItem('profileCompletion', String(pct))
      window.dispatchEvent(new Event('profileUpdated'))
      window.dispatchEvent(new Event('payoutsProcessed'))
      toast.success('Payout account verified!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed')
    } finally {
      setVerifyLoading(false)
    }
  }

  const isVerified = portfolio?.paymentVerified || false

  // ── Money maths from real milestone states ──
  const HELD = ['funded', 'in_progress', 'submitted', 'review', 'approved', 'inaccurate_1', 'inaccurate_2', 'disputed']
  const sum = (arr, f = m => m.amount || 0) => arr.reduce((t, m) => t + f(m), 0)
  const held = milestones.filter(m => HELD.includes(m.status))
  const released = milestones.filter(m => m.status === 'released')
  const unfunded = milestones.filter(m => m.status === 'pending_deposit')
  const refunded = milestones.filter(m => m.status === 'refunded')
  const heldAmt = sum(held), releasedAmt = sum(released), unfundedAmt = sum(unfunded)
  const feesPaid = sum(milestones, m => m.clientFee || 0)
  const earned = sum(txs)

  const byContract = contracts
    .filter(c => ['active', 'pending_advance', 'completed'].includes(c.status))
    .map(c => {
      const ms = milestones.filter(m => m._contract?._id === c._id)
      const total = sum(ms) || c.amount || 0
      return { c, total, rel: sum(ms.filter(m => m.status === 'released')), held: sum(ms.filter(m => HELD.includes(m.status))) }
    })

  // Client ledger built from milestone events; freelancer ledger from real payout transactions.
  const ledger = isFreelancer
    ? txs.map(t => ({ id: t._id, date: t.createdAt, title: t.milestone?.title || t.description || 'Payment', sub: t.contract?.job?.title || (t.contract?.hashId ? `Contract #${t.contract.hashId}` : ''), amount: t.amount, sign: '+', tone: 'green', label: humanize(t.type || 'payout'), status: t.status }))
    : milestones.flatMap(m => {
        const base = { title: m.title, sub: m._contract?.job?.title }
        const ev = []
        if (m.fundedAt || m.status !== 'pending_deposit') ev.push({ ...base, id: m._id + 'f', date: m.fundedAt || (m.releasedAt && new Date(m.releasedAt) < new Date(m.createdAt) ? m.releasedAt : m.createdAt), amount: m.amount + (m.clientFee || 0), sign: '−', tone: 'blue', label: m.isAdvance ? 'Advance funded' : 'Funded into escrow' })
        if (m.status === 'released') ev.push({ ...base, id: m._id + 'r', date: m.releasedAt || m.updatedAt, amount: m.amount, sign: '', tone: 'green', label: 'Released to freelancer' })
        if (m.status === 'refunded') ev.push({ ...base, id: m._id + 'x', date: m.updatedAt, amount: m.amount, sign: '+', tone: 'gray', label: 'Refunded to you' })
        return ev
      }).sort((a, b) => new Date(b.date) - new Date(a.date))

  const card = 'rounded-xl border border-slate-200 bg-surface'
  const check = <svg className="h-4 w-4 flex-none text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>

  if (loading) return (
    <div className="min-h-screen bg-page">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="h-8 w-64 shimmer-skeleton" />
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map(i => <div key={i} className="h-24 shimmer-skeleton rounded-xl" />)}</div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-page">
      <Navbar />
      {showVerifyModal && <PaymentVerifyModal onClose={() => setShowVerifyModal(false)} onVerified={handleVerified} />}

      <main className="mx-auto max-w-6xl px-4 py-8 pb-16 sm:px-6">
        <PageHeader eyebrow="Payments" title={isFreelancer ? 'Payouts & earnings' : 'Payments & escrow'}
          subtitle={isFreelancer ? 'Money waiting for you in escrow, and everything you have been paid.' : 'What you have funded, what is held in escrow, and what has been released.'} />

        {/* Summary */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {isFreelancer ? (<>
            <Stat label="Wallet balance" value={inr(wallet)} highlight />
            <Stat label="Total earned" value={inr(earned)} hint="after 2% fee" />
            <Stat label="Held in escrow for you" value={inr(heldAmt)} hint={`${held.length} milestone${held.length === 1 ? '' : 's'}`} />
            <Stat label="Not yet funded" value={inr(unfundedAmt)} hint="upcoming milestones" />
          </>) : (<>
            <Stat label="In escrow now" value={inr(heldAmt)} highlight hint={`${held.length} milestone${held.length === 1 ? '' : 's'}`} />
            <Stat label="Released to freelancers" value={inr(releasedAmt)} />
            <Stat label="Still to fund" value={inr(unfundedAmt)} hint="upcoming milestones" />
            <Stat label="Platform fees paid" value={inr(feesPaid)} hint="2% per funded milestone" />
          </>)}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-6">
            {/* Escrow by contract */}
            <section className={card}>
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-semibold text-slate-900">Escrow by contract</h2>
                <div className="hidden items-center gap-3 text-xs text-slate-500 sm:flex">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Released</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-500" />In escrow</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-300" />Not funded</span>
                </div>
              </div>
              {byContract.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm font-semibold text-slate-900">No contracts yet</p>
                  <p className="mt-1 text-sm text-slate-500">{isFreelancer ? 'When a client hires you, the escrow for that contract shows up here.' : 'Hire a freelancer and fund the first milestone to see it here.'}</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 p-0">
                  {byContract.map(({ c, total, rel, held: h }) => (
                    <li key={c._id} className="list-none px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <Link to={`/contracts/${c._id}`} className="block truncate text-sm font-semibold text-slate-900 no-underline hover:underline">{c.job?.title || 'Contract'}</Link>
                          <p className="mt-0.5 text-xs text-slate-500">{isFreelancer ? `Client: ${c.client?.name}` : `Freelancer: ${c.freelancer?.name}`} · <StatusPill status={c.status}>{c.status === 'pending_advance' ? 'Awaiting advance' : humanize(c.status)}</StatusPill></p>
                        </div>
                        <div className="flex-none text-right">
                          <p className="text-sm font-semibold text-slate-900">{inr(h)} <span className="font-normal text-slate-500">in escrow</span></p>
                          <p className="text-xs text-slate-500">{inr(rel)} released of {inr(total)}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-200">
                        <div className="bg-emerald-500" style={{ width: `${total ? (rel / total) * 100 : 0}%` }} />
                        <div className="bg-orange-500" style={{ width: `${total ? (h / total) * 100 : 0}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Activity */}
            <section className={card}>
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-semibold text-slate-900">{isFreelancer ? 'Payouts received' : 'Payment activity'}</h2>
              </div>
              {ledger.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm font-semibold text-slate-900">No payments yet</p>
                  <p className="mt-1 text-sm text-slate-500">{isFreelancer ? 'Payouts appear here when a client approves a milestone.' : 'Funding and releases for your milestones will be listed here.'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                      <tr><th className="px-5 py-2.5">Date</th><th className="px-5 py-2.5">Description</th><th className="hidden px-5 py-2.5 sm:table-cell">Type</th><th className="px-5 py-2.5 text-right">Amount</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ledger.map(e => (
                        <tr key={e.id}>
                          <td className="whitespace-nowrap px-5 py-3 text-slate-500">{fmtDate(e.date)}</td>
                          <td className="px-5 py-3">
                            <p className="font-medium text-slate-900">{e.title}</p>
                            {e.sub && <p className="mt-0.5 truncate text-xs text-slate-500">{e.sub}</p>}
                          </td>
                          <td className="hidden px-5 py-3 sm:table-cell"><StatusPill tone={e.tone}>{e.label}</StatusPill></td>
                          <td className={`whitespace-nowrap px-5 py-3 text-right font-semibold ${e.sign === '+' ? 'text-emerald-700' : 'text-slate-900'}`}>{e.sign}{inr(e.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {isClient && (
              <section className={`${card} p-5`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">Payment method</h2>
                  <StatusPill tone={isVerified ? 'green' : 'orange'}>{isVerified ? 'Verified' : 'Not verified'}</StatusPill>
                </div>
                {isVerified ? (
                  <>
                    <p className="mt-2 text-sm text-slate-600">Your payment method is verified. Freelancers see a “Payment verified” badge on your profile.</p>
                    <ul className="mt-4 space-y-2 p-0 text-sm text-slate-700">
                      {['Badge shown on your public profile', 'Stronger proposals from freelancers', 'Faster hiring'].map(t => <li key={t} className="flex list-none items-center gap-2">{check}{t}</li>)}
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-sm text-slate-600">Verify with a ₹1 refundable charge so freelancers know you can pay.</p>
                    <ol className="mt-4 space-y-3 p-0">
                      {[['Choose a method', 'UPI, card or net banking'], ['₹1 test charge', 'Confirms the method is active'], ['Instant refund', 'Returned within seconds via Razorpay']].map(([t, d], i) => (
                        <li key={t} className="flex list-none gap-3">
                          <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-orange-50 text-xs font-semibold text-orange-700 ring-1 ring-orange-200">{i + 1}</span>
                          <div><p className="text-sm font-medium text-slate-900">{t}</p><p className="text-xs text-slate-500">{d}</p></div>
                        </li>
                      ))}
                    </ol>
                    <button onClick={() => setShowVerifyModal(true)} className={`${btn.primary} mt-5 w-full`}>Verify payment method</button>
                  </>
                )}
              </section>
            )}

            {isFreelancer && (
              <section className={`${card} p-5`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">Payout account</h2>
                  <StatusPill tone={portfolio?.paymentVerified ? 'green' : 'orange'}>{portfolio?.paymentVerified ? 'Verified' : 'Not verified'}</StatusPill>
                </div>

                {!portfolio?.payoutDetailsAdded && !editingPayout && (
                  <div className="mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center">
                    <p className="text-sm font-semibold text-slate-900">No payout account yet</p>
                    <p className="mt-1 text-sm text-slate-500">Add a UPI ID or bank account to receive milestone payments.</p>
                    <button onClick={() => setEditingPayout(true)} className={`${btn.primary} mt-4`}>Add payout account</button>
                  </div>
                )}

                {portfolio?.payoutDetailsAdded && !editingPayout && (
                  <div className="mt-4 rounded-lg bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-500">{portfolio.payoutMethod === 'bank' ? 'Bank transfer' : 'UPI'}</p>
                        {portfolio.payoutMethod === 'upi'
                          ? <p className="mt-0.5 truncate font-mono text-sm font-semibold text-slate-900">{portfolio.upiId}</p>
                          : <>
                              <p className="mt-0.5 font-mono text-sm font-semibold text-slate-900">•••• {portfolio.bankAccountNumber?.slice(-4)}</p>
                              <p className="text-xs text-slate-500">{portfolio.accountHolderName} · {portfolio.ifscCode}</p>
                            </>}
                      </div>
                      <button onClick={() => setEditingPayout(true)} className="text-sm font-semibold text-orange-700 hover:underline">Edit</button>
                    </div>
                    {!portfolio.paymentVerified ? (
                      <div className="mt-4 border-t border-slate-200 pt-4">
                        <p className="text-sm text-slate-600">Verify this account to receive payouts and earn the Verified badge.</p>
                        <button onClick={verifyPayoutDetails} disabled={verifyLoading} className={`${btn.primary} mt-3 w-full`}>
                          {verifyLoading ? 'Verifying…' : 'Verify account'}
                        </button>
                      </div>
                    ) : (
                      <p className="mt-3 flex items-center gap-2 border-t border-slate-200 pt-3 text-sm text-slate-600">{check}Payouts go here when milestones are released.</p>
                    )}
                  </div>
                )}

                {editingPayout && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1" role="tablist">
                      {[['upi', 'UPI'], ['bank', 'Bank account']].map(([m, l]) => (
                        <button key={m} role="tab" aria-selected={payoutForm.payoutMethod === m} onClick={() => setPayoutForm(f => ({ ...f, payoutMethod: m }))}
                          className={`rounded-md py-2 text-sm font-semibold transition-colors ${payoutForm.payoutMethod === m ? 'bg-surface text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{l}</button>
                      ))}
                    </div>
                    {payoutForm.payoutMethod === 'upi' ? (
                      <div>
                        <label htmlFor="upi" className="mb-1.5 block text-sm font-medium text-slate-700">UPI ID</label>
                        <input id="upi" type="text" value={payoutForm.upiId} placeholder="name@okaxis" onChange={e => setPayoutForm(f => ({ ...f, upiId: e.target.value }))} className="dark-input w-full" />
                        <p className="mt-1 text-xs text-slate-500">For example name@upi or 98xxxxxx@paytm</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label htmlFor="ahn" className="mb-1.5 block text-sm font-medium text-slate-700">Account holder name</label>
                          <input id="ahn" type="text" value={payoutForm.accountHolderName} placeholder="As on bank records" onChange={e => setPayoutForm(f => ({ ...f, accountHolderName: e.target.value }))} className="dark-input w-full" />
                        </div>
                        <div>
                          <label htmlFor="acc" className="mb-1.5 block text-sm font-medium text-slate-700">Account number</label>
                          <input id="acc" type="text" inputMode="numeric" value={payoutForm.bankAccountNumber} placeholder="9–18 digits" onChange={e => setPayoutForm(f => ({ ...f, bankAccountNumber: e.target.value.replace(/\D/g, '') }))} className="dark-input w-full" />
                        </div>
                        <div>
                          <label htmlFor="ifsc" className="mb-1.5 block text-sm font-medium text-slate-700">IFSC code</label>
                          <input id="ifsc" type="text" value={payoutForm.ifscCode} placeholder="HDFC0001234" maxLength={11} onChange={e => setPayoutForm(f => ({ ...f, ifscCode: e.target.value.toUpperCase() }))} className="dark-input w-full uppercase" />
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={savePayoutDetails} disabled={payoutLoading || !payoutForm.payoutMethod} className={`${btn.primary} flex-1`}>{payoutLoading ? 'Saving…' : 'Save'}</button>
                      {portfolio?.payoutDetailsAdded && <button onClick={() => setEditingPayout(false)} className={btn.secondary}>Cancel</button>}
                    </div>
                  </div>
                )}
              </section>
            )}

            <section className={`${card} p-5`}>
              <h2 className="text-base font-semibold text-slate-900">How payments work</h2>
              <ol className="mt-3 space-y-2.5 p-0 text-sm text-slate-600">
                {(isFreelancer
                  ? ['Client funds a milestone into escrow', 'You deliver; the file gets a SHA-256 record', 'Client approves → payout minus 2% fee', 'No reply in 72h? It auto-releases']
                  : ['Fund each milestone (+2% fee) via Razorpay', 'Money is held in escrow, not paid out', 'Approve the delivery to release it', 'Disputes freeze funds until resolved']
                ).map((t, i) => (
                  <li key={t} className="flex list-none gap-2.5"><span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">{i + 1}</span>{t}</li>
                ))}
              </ol>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}
