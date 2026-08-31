import axios from 'axios'
import config from '../config'

const baseURL = config.BASE_URL

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
})

let storeRef = null

export function injectStore(store) {
  storeRef = store
}

/*
 |--------------------------------------------------------------------------
 | Refresh token state
 |--------------------------------------------------------------------------
 |
 | Agar ek saath multiple API requests 401 dein,
 | to hum multiple refresh requests nahi bhejenge.
 |
 | Sab requests same refreshPromise ka wait karengi.
 |
 */
let refreshPromise = null

/*
 |--------------------------------------------------------------------------
 | Request Interceptor
 |--------------------------------------------------------------------------
 */

api.interceptors.request.use(
  (config) => {
    const token = storeRef?.getState()?.auth?.token

    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

/*
 |--------------------------------------------------------------------------
 | Response Interceptor
 |--------------------------------------------------------------------------
 */

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    /*
     |--------------------------------------------------------------------------
     | Only handle 401
     |--------------------------------------------------------------------------
     */

    if (status !== 401 || !storeRef) {
      return Promise.reject(error)
    }

    /*
     |--------------------------------------------------------------------------
     | Don't retry refresh endpoint itself
     |--------------------------------------------------------------------------
     */

    if (originalRequest?.url?.includes('/auth/refresh')) {
      storeRef.dispatch({
        type: 'auth/sessionExpired'
      })

      return Promise.reject(error)
    }

    /*
     |--------------------------------------------------------------------------
     | Prevent infinite retry loop
     |--------------------------------------------------------------------------
     */

    if (originalRequest?._retry) {
      storeRef.dispatch({
        type: 'auth/sessionExpired'
      })

      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      /*
       |--------------------------------------------------------------------------
       | Get refresh token
       |--------------------------------------------------------------------------
       */

      const refreshToken = storeRef
        .getState()
        ?.auth
        ?.refreshToken

      if (!refreshToken) {
        storeRef.dispatch({
          type: 'auth/sessionExpired'
        })

        return Promise.reject(error)
      }

      /*
       |--------------------------------------------------------------------------
       | If another request is already refreshing,
       | wait for that request instead of creating another one.
       |--------------------------------------------------------------------------
       */

      if (!refreshPromise) {
        refreshPromise = axios
          .post(
            `${baseURL}/auth/refresh`,
            {
              refreshToken
            },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          )
          .then((response) => {
            const data = response.data

            /*
             |--------------------------------------------------------------------------
             | Adjust these names according to your backend response
             |--------------------------------------------------------------------------
             */

            const accessToken =
              data?.data?.accessToken ||
              data?.accessToken

            const newRefreshToken =
              data?.data?.refreshToken ||
              data?.refreshToken

            if (!accessToken) {
              throw new Error('Refresh response does not contain accessToken')
            }

            /*
             |--------------------------------------------------------------------------
             | Save new tokens in Redux
             |--------------------------------------------------------------------------
             */

            storeRef.dispatch({
              type: 'auth/setCredentials',
              payload: {
                token: accessToken,

                /*
                 | If backend rotates refresh token,
                 | save the new one.
                 | Otherwise keep the old one.
                 */
                refreshToken:
                  newRefreshToken || refreshToken
              }
            })

            return accessToken
          })
          .finally(() => {
            refreshPromise = null
          })
      }

      const newAccessToken = await refreshPromise

      /*
       |--------------------------------------------------------------------------
       | Retry original request with new token
       |--------------------------------------------------------------------------
       */

      originalRequest.headers = originalRequest.headers || {}

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`

      return api(originalRequest)

    } catch (refreshError) {

      /*
       |--------------------------------------------------------------------------
       | Refresh token invalid/expired
       |--------------------------------------------------------------------------
       */

      storeRef.dispatch({
        type: 'auth/sessionExpired'
      })

      return Promise.reject(refreshError)
    }
  }
)

export default api