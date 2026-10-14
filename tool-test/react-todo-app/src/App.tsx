import { useEffect, useState } from 'react'
import './App.css'

// ============ 类型定义 ============
interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: number
}

type FilterType = 'all' | 'active' | 'completed'

const STORAGE_KEY = 'react-todo-app-todos'

// ============ localStorage 工具函数 ============
function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (t): t is Todo =>
        t &&
        typeof t.id === 'string' &&
        typeof t.text === 'string' &&
        typeof t.completed === 'boolean',
    )
  } catch {
    return []
  }
}

function saveTodos(todos: Todo[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  } catch {
    // 存储失败时静默忽略
  }
}

// ============ 组件 ============
function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos)
  const [inputValue, setInputValue] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set())

  // 数据持久化到 localStorage
  useEffect(() => {
    saveTodos(todos)
  }, [todos])

  // ============ 增删改查 ============
  const addTodo = () => {
    const text = inputValue.trim()
    if (!text) return
    const newTodo: Todo = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      completed: false,
      createdAt: Date.now(),
    }
    setTodos((prev) => [newTodo, ...prev])
    setInputValue('')
  }

  const removeTodo = (id: string) => {
    // 先播放退出动画，动画结束后再真正移除
    setExitingIds((prev) => new Set(prev).add(id))
    setTimeout(() => {
      setTodos((prev) => prev.filter((t) => t.id !== id))
      setExitingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 300)
  }

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    )
  }

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id)
    setEditingText(todo.text)
  }

  const commitEditing = () => {
    const text = editingText.trim()
    if (editingId && text) {
      setTodos((prev) =>
        prev.map((t) => (t.id === editingId ? { ...t, text } : t)),
      )
    }
    setEditingId(null)
    setEditingText('')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingText('')
  }

  const clearCompleted = () => {
    const completedIds = todos.filter((t) => t.completed).map((t) => t.id)
    if (completedIds.length === 0) return
    setExitingIds((prev) => new Set([...prev, ...completedIds]))
    setTimeout(() => {
      setTodos((prev) => prev.filter((t) => !t.completed))
      setExitingIds(new Set())
    }, 300)
  }

  // 键盘事件
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addTodo()
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEditing()
    if (e.key === 'Escape') cancelEditing()
  }

  // ============ 派生数据 ============
  const filteredTodos = todos.filter((t) => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const total = todos.length
  const completedCount = todos.filter((t) => t.completed).length
  const activeCount = total - completedCount
  const completionRate = total === 0 ? 0 : Math.round((completedCount / total) * 100)

  return (
    <div className="app">
      <div className="card">
        <header className="header">
          <h1 className="title">
            <span className="title-icon">✓</span> Todo List
          </h1>
          <p className="subtitle">高效管理你的每一天</p>
        </header>

        {/* ============ 输入区 ============ */}
        <div className="input-row">
          <input
            className="todo-input"
            type="text"
            placeholder="添加新任务，按 Enter 确认…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            maxLength={100}
          />
          <button
            className="btn btn-add"
            onClick={addTodo}
            disabled={!inputValue.trim()}
          >
            ＋ 添加
          </button>
        </div>

        {/* ============ 筛选器 ============ */}
        <div className="filter-row">
          {(
            [
              ['all', `全部 (${total})`],
              ['active', `进行中 (${activeCount})`],
              ['completed', `已完成 (${completedCount})`],
            ] as [FilterType, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              className={`filter-btn ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ============ 统计信息 ============ */}
        <div className="stats">
          <div className="stat-item">
            <span className="stat-value">{total}</span>
            <span className="stat-label">总任务</span>
          </div>
          <div className="stat-item">
            <span className="stat-value stat-active">{activeCount}</span>
            <span className="stat-label">进行中</span>
          </div>
          <div className="stat-item">
            <span className="stat-value stat-done">{completedCount}</span>
            <span className="stat-label">已完成</span>
          </div>
          <div className="stat-item">
            <span className="stat-value stat-rate">{completionRate}%</span>
            <span className="stat-label">完成率</span>
          </div>
        </div>

        {/* 进度条 */}
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${completionRate}%` }}
          />
        </div>

        {/* ============ 列表区 ============ */}
        <ul className="todo-list">
          {filteredTodos.length === 0 ? (
            <li className="empty">
              <span className="empty-icon">🗒️</span>
              <p>
                {filter === 'completed'
                  ? '还没有已完成的任务'
                  : filter === 'active'
                    ? '太棒了，没有待办任务！'
                    : '暂无任务，快来添加第一个吧'}
              </p>
            </li>
          ) : (
            filteredTodos.map((todo) => (
              <li
                key={todo.id}
                className={`todo-item ${todo.completed ? 'completed' : ''} ${
                  exitingIds.has(todo.id) ? 'exiting' : ''
                }`}
              >
                {editingId === todo.id ? (
                  <div className="edit-row">
                    <input
                      className="edit-input"
                      value={editingText}
                      autoFocus
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      onBlur={commitEditing}
                      maxLength={100}
                    />
                    <button className="btn btn-save" onClick={commitEditing}>
                      保存
                    </button>
                    <button className="btn btn-cancel" onClick={cancelEditing}>
                      取消
                    </button>
                  </div>
                ) : (
                  <>
                    <label className="checkbox-wrap">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodo(todo.id)}
                      />
                      <span className="checkbox-custom" aria-hidden="true">
                        ✓
                      </span>
                    </label>
                    <span
                      className="todo-text"
                      onDoubleClick={() => startEditing(todo)}
                      title="双击编辑"
                    >
                      {todo.text}
                    </span>
                    <div className="actions">
                      <button
                        className="icon-btn"
                        onClick={() => startEditing(todo)}
                        title="编辑"
                      >
                        ✏️
                      </button>
                      <button
                        className="icon-btn icon-danger"
                        onClick={() => removeTodo(todo.id)}
                        title="删除"
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))
          )}
        </ul>

        {/* ============ 底部操作 ============ */}
        {completedCount > 0 && (
          <button className="btn-clear" onClick={clearCompleted}>
            清除所有已完成 ({completedCount})
          </button>
        )}
      </div>

      <footer className="footer">
        数据自动保存在浏览器 localStorage 中 · 双击任务文字可编辑
      </footer>
    </div>
  )
}

export default App
