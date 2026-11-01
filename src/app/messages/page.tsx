'use client'
import { useState } from 'react'

const THREADS = [
  {
    id: 't1', from: 'SGT Johnson', listing: '3BR/2BA Near Fort Liberty', time: '2h ago', unread: true,
    messages: [
      { id: 1, from: 'SGT Johnson', body: 'Is the property still available for Dec 1?', time: '2h ago', mine: false },
      { id: 2, from: 'You', body: 'Yes, still available! Are you PCSing to Fort Liberty?', time: '1h ago', mine: true },
      { id: 3, from: 'SGT Johnson', body: 'Yes! Reporting Dec 15. Can we schedule a walk-through?', time: '45m ago', mine: false },
    ],
  },
  {
    id: 't2', from: 'CPT Williams', listing: '2021 Toyota Tacoma TRD', time: '1d ago', unread: false,
    messages: [
      { id: 1, from: 'CPT Williams', body: 'Would you take $30,000?', time: '1d ago', mine: false },
      { id: 2, from: 'You', body: 'Best I can do is $31,500 — I have PCS orders and need to sell fast.', time: '23h ago', mine: true },
    ],
  },
  {
    id: 't3', from: 'SPC Davis', listing: '3BR/2BA Near Fort Liberty', time: '2d ago', unread: false,
    messages: [
      { id: 1, from: 'SPC Davis', body: 'Are pets allowed?', time: '2d ago', mine: false },
      { id: 2, from: 'You', body: 'Yes, pets allowed with a $300 deposit.', time: '2d ago', mine: true },
      { id: 3, from: 'SPC Davis', body: 'Great! We have one small dog. I will reach out next week.', time: '2d ago', mine: false },
    ],
  },
]

export default function MessagesPage() {
  const [activeId, setActiveId] = useState('t1')
  const [draft, setDraft] = useState('')
  const active = THREADS.find(t => t.id === activeId)!

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black text-gray-900 mb-6" style={{ fontFamily: 'var(--font-oswald)' }}>Messages</h1>

      <div className="flex gap-0 rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border)', height: '600px' }}>
        {/* thread list */}
        <div className="w-72 shrink-0 border-r overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
          {THREADS.map(t => (
            <button key={t.id} onClick={() => setActiveId(t.id)}
                    className={`w-full text-left p-4 border-b transition-colors ${
                      activeId === t.id ? 'bg-[rgba(75,83,32,0.07)]' : 'hover:bg-gray-50'
                    }`} style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 ${
                  t.unread ? '' : 'opacity-70'
                }`} style={{ background: 'var(--army-green)' }}>
                  {t.from[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${t.unread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{t.from}</span>
                    <span className="text-xs text-gray-400">{t.time}</span>
                  </div>
                  <div className="text-xs text-gray-400 truncate mt-0.5">{t.listing}</div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">{t.messages[t.messages.length - 1].body}</div>
                </div>
                {t.unread && <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: 'var(--army-green)' }} />}
              </div>
            </button>
          ))}
        </div>

        {/* conversation */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* header */}
          <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ background: 'var(--army-green)' }}>
              {active.from[0]}
            </div>
            <div>
              <div className="font-semibold text-sm text-gray-900">{active.from}</div>
              <div className="text-xs text-gray-400">Re: {active.listing}</div>
            </div>
          </div>

          {/* messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {active.messages.map(m => (
              <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.mine
                    ? 'text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                }`} style={{ background: m.mine ? 'var(--army-green)' : undefined }}>
                  <p>{m.body}</p>
                  <p className={`text-xs mt-1 ${m.mine ? 'text-white/60' : 'text-gray-400'}`}>{m.time}</p>
                </div>
              </div>
            ))}

            <div className="text-xs text-center text-gray-400 py-2">
              🛡️ Keep all communication here — never share personal contact info
            </div>
          </div>

          {/* reply box */}
          <div className="p-4 border-t flex gap-3 items-end" style={{ borderColor: 'var(--border)' }}>
            <textarea
              rows={2}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-[var(--army-green)] resize-none"
              style={{ borderColor: 'var(--border)' }}
            />
            <button
              disabled={!draft.trim()}
              className="px-5 py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-90"
              style={{ background: 'var(--army-green)' }}
              onClick={() => setDraft('')}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
