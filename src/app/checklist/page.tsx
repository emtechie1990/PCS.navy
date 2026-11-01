'use client'
import { useState } from 'react'

type Task = {
  id: string
  week: number
  label: string
  done: boolean
  category: 'admin' | 'housing' | 'logistics' | 'finance' | 'personal'
}

const INITIAL_TASKS: Task[] = [
  // 12+ weeks out
  { id: '1', week: 12, label: 'Receive official PCS orders', done: true, category: 'admin' },
  { id: '2', week: 12, label: 'Notify your unit of PCS date', done: true, category: 'admin' },
  { id: '3', week: 12, label: 'Schedule household goods weight survey', done: true, category: 'logistics' },
  { id: '4', week: 12, label: 'Research the new duty station', done: true, category: 'housing' },

  // 8–12 weeks
  { id: '5', week: 8, label: 'List current housing on PCS.army', done: false, category: 'housing' },
  { id: '6', week: 8, label: 'List vehicles / household goods you won\'t move', done: false, category: 'logistics' },
  { id: '7', week: 8, label: 'Begin searching housing at new installation', done: false, category: 'housing' },
  { id: '8', week: 8, label: 'Contact school liaison officer if you have children', done: false, category: 'personal' },
  { id: '9', week: 8, label: 'Obtain medical/dental records', done: false, category: 'personal' },

  // 4–8 weeks
  { id: '10', week: 4, label: 'Schedule household goods pickup date', done: false, category: 'logistics' },
  { id: '11', week: 4, label: 'Arrange POV shipment if deploying OCONUS', done: false, category: 'logistics' },
  { id: '12', week: 4, label: 'Update SGLI/beneficiary designations', done: false, category: 'finance' },
  { id: '13', week: 4, label: 'Set up mail forwarding with USPS', done: false, category: 'admin' },
  { id: '14', week: 4, label: 'Notify bank and update your address', done: false, category: 'finance' },

  // 2–4 weeks
  { id: '15', week: 2, label: 'Sign lease or close on new home', done: false, category: 'housing' },
  { id: '16', week: 2, label: 'Transfer utilities at both addresses', done: false, category: 'housing' },
  { id: '17', week: 2, label: 'Update vehicle registration and driver\'s license', done: false, category: 'admin' },
  { id: '18', week: 2, label: 'Pack "load-first, unload-last" essentials box', done: false, category: 'logistics' },
  { id: '19', week: 2, label: 'Settle outstanding balances and clear post', done: false, category: 'finance' },

  // 0–2 weeks
  { id: '20', week: 0, label: 'Check out of current unit', done: false, category: 'admin' },
  { id: '21', week: 0, label: 'Complete clearing paperwork (DD-137, etc.)', done: false, category: 'admin' },
  { id: '22', week: 0, label: 'Secure TLE/TDY lodging if needed', done: false, category: 'housing' },
  { id: '23', week: 0, label: 'Update MyPay allotments for new BAH rate', done: false, category: 'finance' },
  { id: '24', week: 0, label: 'Report to new unit and sign in', done: false, category: 'admin' },
]

const WEEK_LABELS: Record<number, string> = {
  12: '12+ Weeks Out',
  8: '8–12 Weeks Out',
  4: '4–8 Weeks Out',
  2: '2–4 Weeks Out',
  0: 'Final 2 Weeks',
}

const CAT_COLORS: Record<Task['category'], string> = {
  admin: 'bg-blue-100 text-blue-700',
  housing: 'bg-green-100 text-green-700',
  logistics: 'bg-orange-100 text-orange-700',
  finance: 'bg-purple-100 text-purple-700',
  personal: 'bg-pink-100 text-pink-700',
}

export default function ChecklistPage() {
  const [tasks, setTasks] = useState(INITIAL_TASKS)

  function toggle(id: string) {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const total = tasks.length
  const done = tasks.filter(t => t.done).length
  const pct = Math.round((done / total) * 100)

  const weeks = [12, 8, 4, 2, 0]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: 'var(--font-oswald)' }}>
          PCS Move Checklist
        </h1>
        <p className="text-gray-500 text-sm mt-1">Everything you need to do before, during, and after your PCS move.</p>
      </div>

      {/* progress */}
      <div className="card-base p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-sm text-gray-700">Overall Progress</span>
          <span className="font-black text-lg" style={{ fontFamily: 'var(--font-oswald)', color: 'var(--army-green)' }}>
            {done}/{total} Complete
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: 'var(--army-green)' }} />
        </div>
        <p className="text-xs text-gray-400 mt-2">{pct}% complete · {total - done} tasks remaining</p>
      </div>

      {/* category legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(CAT_COLORS).map(([cat, cls]) => (
          <span key={cat} className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${cls}`}>
            {cat}
          </span>
        ))}
      </div>

      {/* task groups */}
      <div className="space-y-8">
        {weeks.map(w => {
          const group = tasks.filter(t => t.week === w)
          const groupDone = group.filter(t => t.done).length
          return (
            <div key={w}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-black text-gray-900" style={{ fontFamily: 'var(--font-oswald)' }}>
                  {WEEK_LABELS[w]}
                </h2>
                <span className="text-xs text-gray-400">{groupDone}/{group.length}</span>
              </div>
              <div className="space-y-2">
                {group.map(t => (
                  <button key={t.id} onClick={() => toggle(t.id)}
                          className="w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all hover:shadow-sm"
                          style={{ borderColor: t.done ? 'rgba(75,83,32,0.25)' : 'var(--border)', background: t.done ? 'rgba(75,83,32,0.04)' : 'white' }}>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                      t.done ? 'border-[var(--army-green)]' : 'border-gray-300'
                    }`} style={{ background: t.done ? 'var(--army-green)' : 'transparent' }}>
                      {t.done && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <span className={`flex-1 text-sm ${t.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {t.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${CAT_COLORS[t.category]}`}>
                      {t.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-10 rounded-xl p-5 text-center" style={{ background: 'var(--army-green)', color: 'white' }}>
        <p className="font-black text-lg mb-1" style={{ fontFamily: 'var(--font-oswald)' }}>Ready to move on post?</p>
        <p className="text-white/70 text-sm mb-4">List your housing, vehicle, or household goods on PCS.army — free for goods.</p>
        <a href="/listings/create" className="inline-block px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
           style={{ background: 'var(--army-gold)', color: '#1a1a1a' }}>
          + Post a Listing
        </a>
      </div>
    </div>
  )
}
