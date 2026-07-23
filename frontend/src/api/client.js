import axios from 'axios'

// In production this is served behind the same domain via nginx reverse
// proxy (see frontend/nginx.conf), so /api works both in dev (Vite proxy
// isn't configured, so set VITE_API_URL for local dev against a bare
// backend) and in the built container.
const baseURL = import.meta.env.VITE_API_URL || '/api'

const client = axios.create({ baseURL })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('ems_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ems_token')
      localStorage.removeItem('ems_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
