import { useState, useEffect } from 'react'
import { Container, Card, Table, Badge, Button } from 'react-bootstrap'
import { useAuth } from './AuthContext'
import './UserLog.css'

export const UserLog = () => {
  const { getLogs, clearLogs } = useAuth()
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('all') // all, login, logout

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = () => {
    const allLogs = getLogs()
    setLogs(allLogs.reverse()) // Новые записи сверху
  }

  const handleClearLogs = () => {
    if (window.confirm('Вы уверены, что хотите очистить все логи?')) {
      clearLogs()
      loadLogs()
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true
    return log.action === filter
  })

  return (
    <Container className="py-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">📋 Журнал авторизаций</h4>
            <Button 
              variant="light" 
              size="sm" 
              onClick={handleClearLogs}
              className="text-danger"
            >
              🗑️ Очистить логи
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {/* Фильтры */}
          <div className="mb-3">
            <Badge 
              bg={filter === 'all' ? 'primary' : 'secondary'} 
              className="me-2 filter-badge"
              onClick={() => setFilter('all')}
              style={{cursor: 'pointer'}}
            >
              Все ({logs.length})
            </Badge>
            <Badge 
              bg={filter === 'login' ? 'success' : 'secondary'} 
              className="me-2 filter-badge"
              onClick={() => setFilter('login')}
              style={{cursor: 'pointer'}}
            >
              🟢 Входы ({logs.filter(l => l.action === 'login').length})
            </Badge>
            <Badge 
              bg={filter === 'logout' ? 'danger' : 'secondary'} 
              className="filter-badge"
              onClick={() => setFilter('logout')}
              style={{cursor: 'pointer'}}
            >
              🔴 Выходы ({logs.filter(l => l.action === 'logout').length})
            </Badge>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">Нет записей в журнале</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover striped bordered>
                <thead>
                  <tr>
                    <th>Дата и время</th>
                    <th>Действие</th>
                    <th>Login</th>
                    <th>Email</th>
                    <th>Имя</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatDate(log.timestamp)}</td>
                      <td>
                        {log.action === 'login' ? (
                          <Badge bg="success">🟢 Вход</Badge>
                        ) : (
                          <Badge bg="danger">🔴 Выход</Badge>
                        )}
                      </td>
                      <td><Badge bg="primary">{log.login}</Badge></td>
                      <td className="text-muted">{log.email || '—'}</td>
                      <td>{log.name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  )
}
