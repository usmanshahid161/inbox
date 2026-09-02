import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { Building2, User, Bell, Radio, Users, ShieldCheck } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { selectCurrentTenant } from '../features/auth/authSlice'
import { updateTenantProfile } from '../features/tenant/tenantSlice'
import { showToast } from '../features/ui/uiSlice'
import Button from '../components/common/Button'
import { ROLES } from '../utils/constants'
import manageAgentApi from '../services/manageAgentApi'

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-ink-600 dark:text-navy-300">{label}</label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white'

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-100 py-3 last:border-0 dark:border-navy-800">
      <div>
        <p className="text-sm font-medium text-ink-800 dark:text-navy-100">{label}</p>
        {description && <p className="text-xs text-ink-500 dark:text-navy-400">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-brand-500' : 'bg-ink-200 dark:bg-navy-700'}`}
        role="switch"
        aria-checked={checked}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

function TenantProfileSection() {
  const dispatch = useDispatch()
  const tenant = useSelector(selectCurrentTenant)
  const [name, setName] = useState(tenant?.name || '')
  const [domain, setDomain] = useState(tenant?.domain || '')

  return (
    <div className="max-w-lg space-y-4">
      <Field label="Workspace name">
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Support domain">
        <input value={domain} onChange={(e) => setDomain(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Plan">
        <input value={tenant?.plan || 'Growth'} disabled className={`${inputClass} opacity-60`} />
      </Field>
      <Button
        onClick={() => {
          dispatch(updateTenantProfile({ name, domain }))
          dispatch(showToast({ message: 'Workspace profile updated', tone: 'success' }))
        }}
      >
        Save changes
      </Button>
    </div>
  )
}

function AccountSection() {
  const { user } = useAuth()
  return (
    <div className="max-w-lg space-y-4">
      <Field label="Full name">
        <input defaultValue={user?.name} className={inputClass} />
      </Field>
      <Field label="Email">
        <input defaultValue={user?.email} className={inputClass} />
      </Field>
      <Field label="Role">
        <input value={user?.role === ROLES.ADMIN ? 'Administrator' : 'Agent'} disabled className={`${inputClass} opacity-60`} />
      </Field>
      <Button onClick={() => {}}>Save changes</Button>
    </div>
  )
}

function NotificationsSection() {
  const dispatch = useDispatch()
  const [prefs, setPrefs] = useState({ newMessage: true, assignment: true, mentions: true, digest: false })

  const update = (key, value) => {
    setPrefs((p) => ({ ...p, [key]: value }))
    dispatch(showToast({ message: 'Notification preferences saved', tone: 'success' }))
  }

  return (
    <div className="max-w-lg">
      <ToggleRow label="New messages" description="Notify me when a customer sends a new message" checked={prefs.newMessage} onChange={(v) => update('newMessage', v)} />
      <ToggleRow label="Assignments" description="Notify me when a conversation is assigned to me" checked={prefs.assignment} onChange={(v) => update('assignment', v)} />
      <ToggleRow label="Mentions" description="Notify me when a teammate mentions me in a note" checked={prefs.mentions} onChange={(v) => update('mentions', v)} />
      <ToggleRow label="Daily digest" description="Send a daily summary email" checked={prefs.digest} onChange={(v) => update('digest', v)} />
    </div>
  )
}

function SecuritySection() {
  const dispatch = useDispatch()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    setError(null)

    if (!currentPassword || !newPassword) {
      setError('Fill in both fields.')
      return
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.")
      return
    }

    setSaving(true)
    try {
      await manageAgentApi.changeMyPassword({ currentPassword, newPassword })
      dispatch(showToast({ message: 'Password updated', tone: 'success' }))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not update password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <Field label="Current password">
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="New password">
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Confirm new password">
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
        />
      </Field>
      {error && <p className="text-xs text-rose-500">{error}</p>}
      <Button onClick={handleSubmit} isLoading={saving}>
        Update password
      </Button>
    </div>
  )
}

const SECTIONS = [
  // { id: 'tenant', label: 'Workspace profile', icon: Building2, component: TenantProfileSection },
  // { id: 'account', label: 'Account', icon: User, component: AccountSection },
  // { id: 'notifications', label: 'Notifications', icon: Bell, component: NotificationsSection },
  { id: 'security', label: 'Security', icon: ShieldCheck, component: SecuritySection }
]

export default function Settings() {
  const { isAdmin } = useAuth()
  const [activeId, setActiveId] = useState('tenant')
  const sections = SECTIONS.filter((s) => !s.adminOnly || isAdmin)
  const active = sections.find((s) => s.id === activeId) || sections[0]

  if (active.redirect) return <Navigate to={active.redirect} replace />

  const ActiveComponent = active.component

  return (
    <div className="flex h-full flex-col overflow-hidden lg:flex-row">
      <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-ink-100 p-3 dark:border-navy-800 lg:w-56 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r lg:p-4">
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveId(id)}
            className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
              activeId === id
                ? 'bg-brand-50 text-brand-700 dark:bg-navy-800 dark:text-white'
                : 'text-ink-600 hover:bg-ink-50 dark:text-navy-300 dark:hover:bg-navy-800'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>
      <div className="flex-1 overflow-y-auto scroll-thin p-4 lg:p-6">
        <h2 className="mb-4 text-base font-semibold text-ink-900 dark:text-white">{active.label}</h2>
        <ActiveComponent />
      </div>
    </div>
  )
}