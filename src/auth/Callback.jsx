import { useEffect } from 'react'
import { Container } from 'react-bootstrap'

export const Callback = () => {
  useEffect(() => {
    // Токен уже обработан в AuthContext при загрузке приложения
    // Просто перенаправляем на главную
    window.location.href = '/'
  }, [])

  return (
    <Container className="mt-5">
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
        <p className="mt-3">Завершение авторизации...</p>
      </div>
    </Container>
  )
}
