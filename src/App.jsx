import { useState, useEffect } from 'react'
import { Container, Card, Form, Badge, Button, Row, Col, Dropdown } from 'react-bootstrap'
import { Routes, Route, useNavigate } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import { useAuth } from './auth/AuthContext'
import { Login } from './auth/Login'
import { Callback } from './auth/Callback'
import { UserLog } from './auth/UserLog'

const SHEET_ID = '1Xm1Zj-_QBlagfR9rYq-o5v2rmNUSt34T2qxu-BHsJsY'
const SHEET_NAME = 'Поборы'

function App() {
  const { user, loading: authLoading, isAuthenticated, login, logout } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Фильтры
  const [searchPlayer, setSearchPlayer] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [minAmount, setMinAmount] = useState('')

  // Тема (светлая/темная)
  const [darkMode, setDarkMode] = useState(false)

  // Показываем экран загрузки во время аутентификации
  if (authLoading) {
    return (
      <Container className="mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
          <p className="mt-3">Проверка авторизации...</p>
        </div>
      </Container>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <MainContent user={user} logout={logout} /> : <Login />} />
      <Route path="/callback" element={<Callback />} />
      <Route path="/logs" element={isAuthenticated ? <UserLog /> : <Login />} />
      <Route path="*" element={isAuthenticated ? <MainContent user={user} logout={logout} /> : <Login />} />
    </Routes>
  )
}

// Основной контент приложения
function MainContent({ user, logout }) {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [interestData, setInterestData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Фильтры
  const [searchPlayer, setSearchPlayer] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [minAmount, setMinAmount] = useState('')

  // Тема (светлая/темная)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    fetchData()
    // Применяем тему к body
    document.body.classList.toggle('dark-mode', darkMode)
  }, [darkMode])

  const fetchData = async () => {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`
      const response = await fetch(url)
      const text = await response.text()

      // Парсим JSONP ответ Google Sheets (убираем обертку)
      const jsonText = text.substring(47).slice(0, -2)
      const json = JSON.parse(jsonText)

      console.log('Всего строк в ответе:', json.table.rows.length)
      
      // Преобразуем данные, начиная с 4-й строки (индекс 2)
      // Строки 0-1 пропускаем (агрегационные данные)
      const playerRows = json.table.rows.slice(2)
      
      console.log('Строк после slice(2):', playerRows.length)

      const playerData = playerRows.map((row, idx) => {
        const c = row.c
        // ИТОГО находится в колонке N (индекс 13)
        const total = c[13]?.v || 0
        const playerName = c[0]?.v || ''

        return {
          player: playerName,
          telegram: c[1]?.v || '',
          status: c[2]?.v || '',
          total: Number(total) || 0,
          rowIndex: idx
        }
      })

      // Выводим все имена игроков для отладки
      console.log('Все строки playerData:', playerData.map(p => ({
        index: p.rowIndex,
        player: p.player,
        total: p.total
      })))

      // Отделяем проценты по вкладу от остальных игроков
      const interestRow = playerData.find(row =>
        row.player?.toString().trim() === 'Проценты по вкладу'
      )

      console.log('Проценты по вкладу найдены:', interestRow)

      // Фильтруем заголовки и итоговые строки (но оставляем Проценты по вкладу отдельно)
      const filteredRows = playerData.filter(row => {
        const player = row.player?.toString().trim()
        const isEmpty = player === ''
        const isHeader = player === 'Игрок'
        const isTotal = player === 'ИТОГО'
        const isInterest = player === 'Проценты по вкладу'
        
        if (isEmpty) console.log('Пропущена пустая строка:', row)
        if (isHeader) console.log('Пропущен заголовок:', row)
        if (isTotal) console.log('Пропущена строка ИТОГО:', row)
        if (isInterest) console.log('Проценты по вкладу будут отдельно:', row)
        
        return player &&
               !isHeader &&
               !isTotal &&
               !isInterest
      })

      console.log('Отфильтрованные игроки:', filteredRows.length)
      console.log('Список игроков:', filteredRows.map(p => p.player))

      setData(filteredRows)

      // Если есть проценты по вкладу, добавляем их в данные
      if (interestRow) {
        setInterestData(interestRow)
        console.log('Проценты по вкладу:', interestRow.total)
      }

      // Отладка: проверяем суммы
      const playersTotal = filteredRows.reduce((sum, item) => sum + item.total, 0)
      console.log('Сумма игроков:', playersTotal)
      console.log('Количество игроков:', filteredRows.length)
      
      setLoading(false)
    } catch (err) {
      setError('Ошибка загрузки данных: ' + err.message)
      setLoading(false)
    }
  }

  // Получаем уникальные статусы для фильтра
  const uniqueStatuses = [...new Set(data.map(item => item.status))].filter(Boolean)

  // Применяем фильтры
  const filteredData = data.filter(item => {
    // Поиск по имени игрока
    if (searchPlayer && !item.player.toLowerCase().includes(searchPlayer.toLowerCase())) {
      return false
    }
    
    // Фильтр по статусу
    if (selectedStatus !== 'all' && item.status !== selectedStatus) {
      return false
    }
    
    // Фильтр по минимальной сумме
    if (minAmount && item.total < parseFloat(minAmount)) {
      return false
    }
    
    return true
  })

  // Форматируем сумму
  const formatMoney = (value) => {
    if (!value) return '0 ₽'
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2
    }).format(value)
  }

  // Считаем общую сумму (по отфильтрованным данным)
  // Проценты по вкладу уже включены в общую сумму таблицы (ИТОГО), поэтому не добавляем их отдельно
  const totalCollected = filteredData.reduce((sum, item) => sum + (Number(item.total) || 0), 0) + (interestData ? Number(interestData.total) || 0 : 0)

  // Считаем суммы по категориям (по отфильтрованным данным)
  const totalsByStatus = filteredData.reduce((acc, item) => {
    const status = item.status || 'Без статуса'
    const amount = Number(item.total) || 0
    if (!acc[status]) {
      acc[status] = 0
    }
    acc[status] += amount
    return acc
  }, {})

  // Сортируем категории по сумме (по убыванию)
  const sortedStatuses = Object.entries(totalsByStatus)
    .sort((a, b) => b[1] - a[1])

  // Считаем количество игроков по категориям (по отфильтрованным данным)
  const playersByStatus = filteredData.reduce((acc, item) => {
    const status = item.status || 'Без статуса'
    if (!acc[status]) {
      acc[status] = 0
    }
    acc[status] += 1
    return acc
  }, {})

  // Сортируем категории по количеству (по убыванию)
  const sortedPlayersStatuses = Object.entries(playersByStatus)
    .sort((a, b) => b[1] - a[1])

  // Создаем ссылку на Telegram
  const getTelegramLink = (username) => {
    if (!username) return '#'
    const cleanUsername = username.replace('@', '')
    return `https://t.me/${cleanUsername}`
  }

  // Определяем цвет бейджа статуса
  const getStatusBadgeVariant = (status) => {
    switch(status) {
      case 'Бояре': return 'warning'
      case 'Жрец': return 'danger'
      case 'Тяжелый косарь': return 'dark'
      case 'Косарь': return 'primary'
      case 'Помощники': return 'success'
      case 'Ледяные': return 'info'
      case 'Гражданские': return 'secondary'
      default: return 'light'
    }
  }

  if (loading) {
    return (
      <Container className="mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
          <p className="mt-3">Загрузка данных из Google Таблицы...</p>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Card className="border-danger">
          <Card.Header className="bg-danger text-white">Ошибка</Card.Header>
          <Card.Body>
            <p>{error}</p>
            <Button variant="outline-danger" onClick={fetchData}>Попробовать снова</Button>
          </Card.Body>
        </Card>
      </Container>
    )
  }

  return (
    <Container fluid className="py-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="me-2" style={{verticalAlign: 'middle'}}>
                <rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor" opacity="0.9"/>
                <rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor" opacity="0.6"/>
                <rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor" opacity="0.6"/>
                <rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor" opacity="0.9"/>
              </svg>
              <span style={{verticalAlign: 'middle'}}>WHFB2026 Взносы</span>
            </h4>
            <div className="d-flex gap-2 align-items-center">
              <Button
                variant="light"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                className="theme-toggle-btn"
                title={darkMode ? 'Светлая тема' : 'Темная тема'}
              >
                {darkMode ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="5" fill="#FFD54F"/>
                    <path d="M12 2V4M12 20V22M2 12H4M20 12H22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93" stroke="#FFD54F" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" fill="#5C6BC0" stroke="#5C6BC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </Button>
              
              <Dropdown align="end">
                <Dropdown.Toggle variant="light" size="sm" className="d-flex align-items-center gap-2 user-dropdown">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" fill="#5C6BC0"/>
                    <path d="M6 20C6 16.69 8.69 14 12 14C15.31 14 18 16.69 18 20" stroke="#5C6BC0" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span className="d-none d-md-inline">{user?.display_name || user?.login || 'Пользователь'}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Header>
                    <div className="text-truncate" style={{maxWidth: '200px'}}>
                      <strong>{user?.display_name || user?.login || 'Пользователь'}</strong>
                    </div>
                    {user?.default_email && (
                      <div className="small text-muted text-truncate" style={{maxWidth: '200px'}}>
                        {user.default_email}
                      </div>
                    )}
                  </Dropdown.Header>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={() => navigate('/logs')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="me-2">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 18V12M12 18L10 16M12 18L14 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Журнал авторизаций
                  </Dropdown.Item>
                  <Dropdown.Item onClick={logout}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="me-2">
                      <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Выйти
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        </Card.Header>

        <Card.Body>
          {/* Сводные карточки */}
          <Row className="g-3 mb-4">
            <Col xs={12} md={6}>
              <Card className="summary-card shadow-sm border-0 h-100">
                <Card.Body className="text-center py-3 d-flex flex-column">
                  <svg className="summary-icon-svg" viewBox="0 0 24 24" fill="none">
                    <circle cx="9" cy="7" r="3" fill="#7C94B9" opacity="0.9"/>
                    <circle cx="15" cy="7" r="3" fill="#7C94B9" opacity="0.6"/>
                    <path d="M3 20C3 17.24 5.24 15 8 15H10C12.76 15 15 17.24 15 20" stroke="#7C94B9" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M17 20C17 18.5 16.2 17.2 15 16.5" stroke="#7C94B9" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <div className="summary-value fw-bold">{filteredData.length}</div>
                  <div className="summary-label">Игроков {filteredData.length !== data.length ? `(из ${data.length})` : ''}</div>
                  
                  {/* Детализация по категориям */}
                  <div className="mt-3 status-breakdown flex-grow-1">
                    <div className="small text-muted mb-2">По категориям:</div>
                    <div className="status-breakdown-list">
                      {sortedPlayersStatuses.map(([status, count]) => (
                        <div key={status} className="status-breakdown-item">
                          <Badge bg={getStatusBadgeVariant(status)} className="me-2">
                            {status}
                          </Badge>
                          <span className="fw-bold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card className="summary-card shadow-sm border-0 h-100">
                <Card.Body className="text-center py-3 d-flex flex-column">
                  <svg className="summary-icon-svg" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="6" width="20" height="14" rx="2" fill="#7C94B9" opacity="0.3"/>
                    <path d="M2 10H22" stroke="#7C94B9" strokeWidth="2"/>
                    <circle cx="12" cy="15" r="3" fill="#7C94B9" opacity="0.9"/>
                    <path d="M7 6V4C7 2.89543 7.89543 2 9 2H15C16.1046 2 17 2.89543 17 4V6" stroke="#7C94B9" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <div className="summary-value fw-bold">{formatMoney(totalCollected)}</div>
                  <div className="summary-label">Общая собранная сумма</div>
                  
                  {/* Детализация по категориям */}
                  <div className="mt-3 status-breakdown flex-grow-1">
                    <div className="small text-muted mb-2">По категориям:</div>
                    <div className="status-breakdown-list">
                      {sortedStatuses.map(([status, amount]) => (
                        <div key={status} className="status-breakdown-item">
                          <Badge bg={getStatusBadgeVariant(status)} className="me-2">
                            {status}
                          </Badge>
                          <span className="fw-bold">{formatMoney(amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Фильтры */}
          <Card className="mb-4 bg-light">
            <Card.Body>
              <h6 className="mb-3">🔍 Фильтры</h6>
              <Row className="g-3">
                <Col md={3}>
                  <Form.Label>Поиск игрока</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Введите имя..."
                    value={searchPlayer}
                    onChange={(e) => setSearchPlayer(e.target.value)}
                  />
                </Col>
                
                <Col md={3}>
                  <Form.Label>Статус</Form.Label>
                  <Form.Select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="all">Все статусы</option>
                    {uniqueStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </Form.Select>
                </Col>

                <Col md={3}>
                  <Form.Label>Мин. сумма (₽)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="0"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                  />
                </Col>
              </Row>
              
              <Row className="mt-3 align-items-center">
                <Col md="auto">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      setSearchPlayer('')
                      setSelectedStatus('all')
                      setMinAmount('')
                    }}
                  >
                    🔄 Сбросить фильтры
                  </Button>
                </Col>
                <Col>
                  <span className="text-muted">
                    Найдено: <strong>{filteredData.length}</strong> из <strong>{data.length}</strong>
                  </span>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Карточки игроков */}
          <Row className="g-4">
            {filteredData.map((item, index) => (
              <Col key={index} xs={12} sm={6} lg={4} xl={3}>
                <Card className="player-card h-100 shadow-sm">
                  <Card.Header className="bg-transparent border-0 pb-0">
                    <div className="d-flex justify-content-between align-items-start">
                      <span className="total-amount text-primary fw-bold">
                        {formatMoney(item.total)}
                      </span>
                      {item.telegram ? (
                        <a
                          href={getTelegramLink(item.telegram)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="telegram-link"
                        >
                          <Badge bg-info className="d-flex align-items-center justify-content-center" style={{backgroundColor: '#03A9F4', color: 'white', width: '32px', height: '32px', padding: 0, borderRadius: '50%'}}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42l10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l-.002.001l-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15l4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z" fill="white"/>
                            </svg>
                          </Badge>
                        </a>
                      ) : null}
                    </div>
                  </Card.Header>

                  <Card.Body className="pt-2 d-flex flex-column justify-content-between">
                    <div>
                      <h5 className="card-title mb-2" title={item.player}>{item.player}</h5>
                    </div>
                    <div className="mt-2">
                      <Badge bg={getStatusBadgeVariant(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Карточка с процентами по вкладу */}
          {interestData && (
            <Row className="g-4 mb-4">
              <Col xs={12} sm={6} lg={4} xl={3}>
                <Card className="player-card interest-card h-100 shadow-sm">
                  <Card.Header className="bg-transparent border-0 pb-0">
                    <div className="d-flex justify-content-between align-items-start">
                      <span className="total-amount text-primary fw-bold">
                        {formatMoney(interestData.total)}
                      </span>
                    </div>
                  </Card.Header>

                  <Card.Body className="pt-2 d-flex flex-column justify-content-between">
                    <div>
                      <h5 className="card-title mb-2" title={interestData.player}>
                        📈 {interestData.player}
                      </h5>
                    </div>
                    <div className="mt-2">
                      <Badge bg="success">
                        💰 Процентный доход
                      </Badge>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {filteredData.length === 0 && (
            <div className="text-center py-5">
              <p className="text-muted">Нет данных, соответствующих выбранным фильтрам</p>
            </div>
          )}
        </Card.Body>

        <Card.Footer className="text-muted small">
          Данные загружаются из Google Таблицы:
          <a href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=0`} target="_blank" rel="noopener noreferrer">
            {' '}Открыть оригинал
          </a>
        </Card.Footer>
      </Card>
    </Container>
  )
}

export default App
export { MainContent }
