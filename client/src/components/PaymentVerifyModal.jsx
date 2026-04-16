import { useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'

export default function PaymentVerifyModal({ onClose, onVerified }) {
  const [step, setStep] = useState('method')   // method | upi | verifying | success
  const [method, setMethod] = useState('')
  const [upiId, setUpiId] = useState('')
  const [upiError, setUpiError] = useState('')

  const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/

  const handleMethodSelect = (m) => {
    setMethod(m)
    setStep('upi')
  }

  const handleVerify = async () => {
    if (!UPI_REGEX.test(upiId.trim())) {
      setUpiError('Enter a valid UPI ID (e.g. yourname@upi or name@okaxis)')
      return
    }
    setUpiError('')
    setStep('verifying')
    await new Promise(r => setTimeout(r, 2200))
    try {
      const { data } = await api.post('/api/portfolio/verify-payment')
      setStep('success')
      onVerified(data.completionPercent)
    } catch {
      toast.error('Verification failed. Please try again.')
      setStep('upi')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={step !== 'verifying' ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Verify Payment Method</h2>
              <p className="text-xs text-zinc-400">Powered by Razorpay</p>
            </div>
          </div>
          {step !== 'verifying' && (
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="p-6">
          {/* Step: method selection */}
          {step === 'method' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-zinc-700 font-medium mb-1">Why verify?</p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  A verified payment badge shows freelancers you are a legitimate client and increases the quality of bids you receive. A small ₹1 charge is made and immediately refunded.
                </p>
              </div>
              <p className="text-sm font-medium text-zinc-700">Choose a payment method</p>
              <div className="space-y-2">
                {[
                  { id: 'upi', icon: '📲', title: 'UPI', sub: 'Pay via any UPI app — GPay, PhonePe, Paytm, BHIM' },
                  { id: 'card', icon: '💳', title: 'Debit / Credit Card', sub: 'Visa, Mastercard, RuPay' },
                  { id: 'netbanking', icon: '🏦', title: 'Net Banking', sub: 'All major Indian banks supported' },
                ].map(opt => (
                  <button key={opt.id} type="button" onClick={() => handleMethodSelect(opt.id)}
                    className="w-full text-left flex items-center gap-3 border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 rounded-xl px-4 py-3 transition-all group">
                    <span className="text-xl w-8 text-center">{opt.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-800">{opt.title}</p>
                      <p className="text-xs text-zinc-400">{opt.sub}</p>
                    </div>
                    <svg className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step: UPI input */}
          {step === 'upi' && (
            <div className="space-y-4">
              <button onClick={() => setStep('method')} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 transition-colors mb-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 flex gap-3">
                <span className="text-base mt-0.5">ℹ️</span>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  A ₹1 refundable charge will be placed on your payment method to confirm it is valid. The amount is refunded within seconds.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 block mb-1.5">
                  {method === 'upi' ? 'Your UPI ID' : method === 'card' ? 'UPI ID linked to your card' : 'UPI ID linked to your bank'}
                </label>
                <input
                  value={upiId}
                  onChange={e => { setUpiId(e.target.value); setUpiError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleVerify()}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-colors ${
                    upiError ? 'border-red-300 bg-red-50' : 'border-zinc-200 focus:border-zinc-400'
                  }`}
                  placeholder="yourname@upi or name@okaxis"
                  autoFocus
                />
                {upiError
                  ? <p className="text-xs text-red-500 mt-1">{upiError}</p>
                  : <p className="text-xs text-zinc-400 mt-1">Format: handle@bank (e.g. rahul@okhdfc, priya@oksbi)</p>
                }
              </div>
              <button onClick={handleVerify}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
                Verify ₹1 charge
              </button>
            </div>
          )}

          {/* Step: verifying */}
          {step === 'verifying' && (
            <div className="py-8 text-center space-y-4">
              <div className="relative mx-auto w-16 h-16">
                <div className="w-16 h-16 border-4 border-zinc-100 rounded-full" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-t-zinc-900 rounded-full animate-spin" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">Verifying with Razorpay…</p>
                <p className="text-xs text-zinc-400 mt-1">Processing ₹1 charge on {upiId}</p>
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-zinc-400 pt-2">
                {['Initiating', 'Processing', 'Confirming'].map((label, i) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step: success */}
          {step === 'success' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-zinc-900">Payment method verified!</p>
                <p className="text-xs text-zinc-500 mt-1">The ₹1 charge has been refunded to {upiId}</p>
              </div>
              <div className="bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-left space-y-1.5">
                {[
                  'Payment Verified badge on your profile',
                  'Higher quality bids from freelancers',
                  'Faster contract creation',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs text-zinc-600">{item}</span>
                  </div>
                ))}
              </div>
              <button onClick={onClose}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
