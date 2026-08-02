import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

const ToastCtx = createContext(null)
export const useToast = () => useContext(ToastCtx)

const ICONS = {
  success: { Icon: CheckCircle2, cls: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  error:   { Icon: XCircle,      cls: 'bg-rose-50 border-rose-200 text-rose-800' },
  info:    { Icon: Info,         cls: 'bg-sky-50 border-sky-200 text-sky-800' },
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts(ts => ts.filter(t => t.id !== id))
  }, [])

  const push = useCallback((type, message) => {
    const id = ++idRef.current
    setToasts(ts => [...ts, { id, type, message }])
    setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  const toast = {
    success: (msg) => push('success', msg),
    error:   (msg) => push('error', msg),
    info:    (msg) => push('info', msg),
  }

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] sm:w-96">
        {toasts.map(t => {
          const { Icon, cls } = ICONS[t.type] || ICONS.info
          return (
            <div key={t.id} className={`flex items-start gap-2.5 border rounded-xl shadow-lg px-4 py-3 text-sm font-semibold animate-[fadeIn_.15s_ease-out] ${cls}`}>
              <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="flex-1 leading-snug">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="flex-shrink-0 opacity-60 hover:opacity-100">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}
