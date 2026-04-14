import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import SkillSelector from '../components/SkillSelector'
import toast, { Toaster } from 'react-hot-toast'

export default function PostJob() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', budget: '', deadline: '' })
  const [skills, setSkills] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Job title is required'
    if (!form.description.trim()) e.description = 'Description is required'
    if (!form.budget || Number(form.budget) <= 0) e.budget = 'Enter a valid budget'
    if (!form.deadline) e.deadline = 'Deadline is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await api.post('/api/jobs', {
        ...form,
        budget: Number(form.budget),
        skills
      })
      toast.success('Job posted!')
      setTimeout(() => navigate('/dashboard/client'), 1000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post job')
    } finally { setLoading(false) }
  }

  const inputClass = (field) =>
    `w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
      errors[field] ? 'border-red-400' : 'border-slate-300'
    }`

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />
      <Navbar />
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">Post a New Job</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className={inputClass('title')}
                placeholder="e.g. Build React E-Commerce Website"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                rows={5}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className={inputClass('description')}
                placeholder="Describe what needs to be built, requirements, and deliverables..."
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Budget (₹)</label>
                <input
                  type="number"
                  value={form.budget}
                  onChange={e => setForm({ ...form, budget: e.target.value })}
                  className={inputClass('budget')}
                  placeholder="10000"
                />
                {errors.budget && <p className="text-red-500 text-xs mt-1">{errors.budget}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={e => setForm({ ...form, deadline: e.target.value })}
                  className={inputClass('deadline')}
                />
                {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Required Skills</label>
              <SkillSelector value={skills} onChange={setSkills} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {loading ? 'Posting...' : 'Post Job'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
