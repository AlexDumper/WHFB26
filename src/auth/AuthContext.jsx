import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

// Конфигурация Яндекс OAuth
const YANDEX_CLIENT_ID = '2d3a952e9dce4ab9bfdde5d84ab8d05a'
const SCOPE = 'login:info login:email'

// Динамический redirect URI (работает и на localhost, и на Vercel)
const getRedirectUri = () => {
  const baseUrl = window.location.origin
  return `${baseUrl}/callback`
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  useEffect(() => {
    // Проверяем наличие токена в URL (после редиректа от Яндекса)
    const hash = window.location.hash
    const params = new URLSearchParams(hash.substring(1))
    const accessToken = params.get('access_token')
    const expiresIn = params.get('expires_in')

    if (accessToken) {
      // Сохраняем токен
      localStorage.setItem('yandex_token', accessToken)
      localStorage.setItem('yandex_token_expiry', Date.now() + (expiresIn * 1000))
      setToken(accessToken)
      
      // Очищаем URL от токена
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    // Проверяем сохраненный токен
    const savedToken = localStorage.getItem('yandex_token')
    const tokenExpiry = localStorage.getItem('yandex_token_expiry')

    if (savedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
      setToken(savedToken)
      fetchUserInfo(savedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserInfo = async (accessToken) => {
    try {
      const response = await fetch('https://login.yandex.ru/info', {
        headers: {
          'Authorization': `OAuth ${accessToken}`
        }
      })

      if (response.ok) {
        const userInfo = await response.json()
        setUser(userInfo)
        
        // Логируем авторизацию
        logAuthorization(userInfo, 'login')
      } else {
        // Токен недействителен, очищаем
        logout()
      }
    } catch (error) {
      console.error('Ошибка получения данных пользователя:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const logAuthorization = (userInfo, action) => {
    try {
      const timestamp = new Date().toISOString()
      
      const logEntry = {
        id: Date.now(),
        timestamp,
        action, // 'login' или 'logout'
        login: userInfo?.login || 'unknown',
        email: userInfo?.default_email || '',
        name: userInfo?.display_name || '',
        user_id: userInfo?.id || ''
      }

      // Получаем существующие логи
      const existingLogs = JSON.parse(localStorage.getItem('auth_logs') || '[]')
      
      // Добавляем новую запись
      existingLogs.push(logEntry)
      
      // Сохраняем (храним последние 100 записей)
      localStorage.setItem('auth_logs', JSON.stringify(existingLogs.slice(-100)))
      
      console.log('Авторизация залогирована:', logEntry)
    } catch (error) {
      console.error('Ошибка логирования:', error)
    }
  }

  const login = () => {
    // force_confirm=1 заставляет Яндекс всегда показывать окно авторизации
    const redirectUri = getRedirectUri()
    const authUrl = `https://oauth.yandex.ru/authorize?response_type=token&client_id=${YANDEX_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(SCOPE)}&force_confirm=1`
    window.location.href = authUrl
  }

  const logout = () => {
    // Логируем разлогирование перед очисткой
    if (user) {
      logAuthorization(user, 'logout')
    }
    
    // Очищаем данные из localStorage
    localStorage.removeItem('yandex_token')
    localStorage.removeItem('yandex_token_expiry')
    
    // Очищаем состояние
    setToken(null)
    setUser(null)
    
    // Перезагружаем страницу для полной очистки
    window.location.reload()
  }

  const isAuthenticated = !!user

  // Функция для получения логов
  const getLogs = () => {
    return JSON.parse(localStorage.getItem('auth_logs') || '[]')
  }

  // Функция для очистки логов
  const clearLogs = () => {
    localStorage.removeItem('auth_logs')
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout, getLogs, clearLogs }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider')
  }
  return context
}
