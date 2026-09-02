import { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { MessageCircle } from 'lucide-react'
import Button from '../common/Button'
import { loadFacebookSdk } from '../../utils/facebookSdk'
import { completeEmbeddedSignup } from '../../features/whatsappChannel/whatsappNumbersSlice'
import { showToast } from '../../features/ui/uiSlice'

const META_APP_ID = import.meta.env.VITE_META_APP_ID
const WHATSAPP_CONFIG_ID = import.meta.env.VITE_WHATSAPP_CONFIG_ID

// Meta's Embedded Signup flow: FB.login() opens a Meta-hosted popup where
// the admin logs into (or creates) their own Meta Business Account and
// picks/creates a WhatsApp number — all inside our UI, no manual token or
// ID copying. Two separate signals come back from it, on two separate
// channels:
//  1. FB.login's own callback gives an OAuth `code` (short-lived,
//     exchanged for an access token server-side — the app secret needed
//     for that exchange must never reach the browser).
//  2. A `postMessage` from the popup gives the actual `waba_id` and
//     `phone_number_id` the admin picked — FB.login's callback doesn't
//     carry these.
// Both are needed before setup can be completed, so this waits for
// whichever arrives second before calling the backend.
export default function ConnectWhatsAppButton() {
  const dispatch = useDispatch()
  const [status, setStatus] = useState('idle') // idle | opening | waiting | completing | error
  const sessionRef = useRef({ code: null, wabaId: null, phoneNumberId: null })

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== 'https://www.facebook.com') return

      let payload
      try {
        payload = JSON.parse(event.data)
      } catch {
        return // not JSON — not a message meant for us
      }

      if (payload.type !== 'WA_EMBEDDED_SIGNUP') return

      if (payload.event === 'FINISH' || payload.event === 'FINISH_ONLY_WABA') {
        sessionRef.current.wabaId = payload.data?.waba_id || sessionRef.current.wabaId
        sessionRef.current.phoneNumberId = payload.data?.phone_number_id || sessionRef.current.phoneNumberId
        maybeComplete()
      } else if (payload.event === 'CANCEL') {
        setStatus('idle')
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const maybeComplete = () => {
    const { code, wabaId, phoneNumberId } = sessionRef.current
    if (!code || !wabaId || !phoneNumberId) {
      setStatus('waiting') // still missing one piece — wait for it
      return
    }

    setStatus('completing')
    dispatch(completeEmbeddedSignup({ code, wabaId, phoneNumberId }))
      .then((res) => {
        if (!res.error) {
          dispatch(showToast({ message: 'WhatsApp connected', tone: 'success' }))
          setStatus('idle')
        } else {
          dispatch(showToast({ message: res.payload || 'Could not finish connecting WhatsApp', tone: 'danger' }))
          setStatus('error')
        }
        sessionRef.current = { code: null, wabaId: null, phoneNumberId: null }
      })
  }

  const handleClick = async () => {
    if (!META_APP_ID || !WHATSAPP_CONFIG_ID) {
      dispatch(
        showToast({
          message: "WhatsApp connect isn't configured yet (missing VITE_META_APP_ID / VITE_WHATSAPP_CONFIG_ID)",
          tone: 'danger'
        })
      )
      return
    }

    setStatus('opening')
    sessionRef.current = { code: null, wabaId: null, phoneNumberId: null }

    try {
      const FB = await loadFacebookSdk(META_APP_ID)

      FB.login(
        (response) => {
          if (response.authResponse?.code) {
            sessionRef.current.code = response.authResponse.code
            maybeComplete()
          } else {
            // Closed/denied without completing — not necessarily an error
            // worth surfacing loudly, the admin just backed out.
            setStatus('idle')
          }
        },
        {
          config_id: WHATSAPP_CONFIG_ID,
          response_type: 'code',
          override_default_response_type: true,
          extras: { setup: {}, featureType: '', sessionInfoVersion: '2' }
        }
      )
    } catch (err) {
      dispatch(showToast({ message: err.message, tone: 'danger' }))
      setStatus('error')
    }
  }

  const busy = status === 'opening' || status === 'waiting' || status === 'completing'

  return (
    <Button variant="secondary" icon={MessageCircle} onClick={handleClick} isLoading={busy}>
      {status === 'completing'
        ? 'Finishing setup...'
        : status === 'waiting'
          ? 'Waiting for WhatsApp...'
          : 'Connect with WhatsApp'}
    </Button>
  )
}