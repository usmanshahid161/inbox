// Loads Facebook's JS SDK exactly once and resolves once it's ready to
// use (FB.init has run). Safe to call from multiple components — later
// calls just reuse the same in-flight/completed load.
let loadPromise = null

export function loadFacebookSdk(appId, version = 'v20.0') {
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    if (!appId) {
      reject(new Error('Meta App ID is not configured (VITE_META_APP_ID)'))
      return
    }

    window.fbAsyncInit = function fbAsyncInit() {
      window.FB.init({
        appId,
        autoLogAppEvents: true,
        xfbml: false,
        version
      })
      resolve(window.FB)
    }

    if (document.getElementById('facebook-jssdk')) {
      // Script tag already present (e.g. hot reload) — fbAsyncInit above
      // will still fire once FB's own script finishes evaluating.
      return
    }

    const script = document.createElement('script')
    script.id = 'facebook-jssdk'
    script.src = 'https://connect.facebook.net/en_US/sdk.js'
    script.async = true
    script.defer = true
    script.crossOrigin = 'anonymous'
    script.onerror = () => reject(new Error('Could not load the Facebook SDK'))
    document.body.appendChild(script)
  })

  return loadPromise
}