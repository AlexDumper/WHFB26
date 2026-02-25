import { Container, Card, Button } from 'react-bootstrap'
import './Login.css'

export const Login = () => {
  const handleYandexLogin = () => {
    const YANDEX_CLIENT_ID = '2d3a952e9dce4ab9bfdde5d84ab8d05a'
    const REDIRECT_URI = 'http://localhost:5173/callback'
    const SCOPE = 'login:info login:email'

    // force_confirm=1 заставляет Яндекс всегда показывать окно авторизации
    const authUrl = `https://oauth.yandex.ru/authorize?response_type=token&client_id=${YANDEX_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPE)}&force_confirm=1`
    window.location.href = authUrl
  }

  return (
    <Container className="login-container">
      <Card className="login-card shadow-lg">
        <Card.Body className="text-center p-5">
          <div className="login-icon mb-4">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="6" width="20" height="14" rx="2" fill="#FC3F1D" opacity="0.3"/>
              <path d="M2 10H22" stroke="#FC3F1D" strokeWidth="2"/>
              <circle cx="12" cy="15" r="3" fill="#FC3F1D"/>
              <path d="M7 6V4C7 2.89543 7.89543 2 9 2H15C16.1046 2 17 2.89543 17 4V6" stroke="#FC3F1D" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          
          <h1 className="login-title mb-3">WHFB2026 Взносы</h1>
          <p className="login-subtitle mb-4">
            Для просмотра информации о взносах необходимо авторизоваться
          </p>
          
          <Button 
            className="yandex-login-btn mb-3"
            onClick={handleYandexLogin}
            size="lg"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="me-2">
              <path d="M10.56 1.1C10.56 1.1 11.39 0 13.5 0C15.61 0 17.5 1.1 17.5 1.1V22.9C17.5 22.9 15.61 24 13.5 24C11.39 24 10.56 22.9 10.56 22.9V1.1Z" fill="#FC3F1D"/>
              <path d="M10.56 1.1V22.9C10.56 22.9 9.5 24 6.5 24C3.5 24 0 22.9 0 22.9V1.1C0 1.1 3.5 0 6.5 0C9.5 0 10.56 1.1 10.56 1.1Z" fill="#FFCC4D"/>
              <path d="M24 12C24 12 22.5 13.5 20 13.5C17.5 13.5 15.5 12 15.5 12C15.5 12 17.5 10.5 20 10.5C22.5 10.5 24 12 24 12Z" fill="#FFCC4D"/>
            </svg>
            Войти через Яндекс ID
          </Button>
          
          <div className="login-info mt-4">
            <small className="text-muted">
              🔒 Безопасная авторизация через Яндекс
            </small>
          </div>
        </Card.Body>
      </Card>
    </Container>
  )
}
