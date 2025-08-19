import { useEffect, useState } from 'react'
import axios from 'axios'
import { getApiUrl } from '../../config'
import './DebugPanel.css'

function DebugPanel() {
  const [user, setUser] = useState(null)
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')

        // load user profile if token exists
        const token = localStorage.getItem('authToken')
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const u = await axios.get(getApiUrl('/user/profile'))
          setUser(u.data.user)

          const prog = await axios.get(getApiUrl('/progress'))
          setProgress(prog.data.progress || [])
        } else {
          setUser(null)
          setProgress([])
        }
      } catch (e) {
        setError(e.response?.data?.error || e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="debug-panel">
      <div className="debug-header">Debug Panel</div>
      {loading && <div className="debug-row">Loading debug data...</div>}
      {error && <div className="debug-error">{error}</div>}

      <div className="debug-section">
        <div className="debug-section-title">User</div>
        {user ? (
          <pre className="debug-pre">{JSON.stringify(user, null, 2)}</pre>
        ) : (
          <div className="debug-row">Not logged in</div>
        )}
      </div>

      <div className="debug-section">
        <div className="debug-section-title">Vocabulary Progress ({progress.length})</div>
        {progress.length === 0 ? (
          <div className="debug-row">No progress records</div>
        ) : (
          <div className="debug-table-wrapper">
            <table className="debug-table">
              <thead>
                <tr>
                  <th>Hebrew</th>
                  <th>Rank</th>
                  <th>Learned</th>
                  <th>Seen</th>
                  <th>Wrong</th>
                  <th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {progress.map((p) => (
                  <tr key={p.id}>
                    <td className="rtl">{p.hebrew}</td>
                    <td>{p.rank ?? ''}</td>
                    <td>{p.learned_score}</td>
                    <td>{p.times_seen}</td>
                    <td>{p.times_wrong}</td>
                    <td>{p.last_seen ? new Date(p.last_seen).toLocaleString() : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default DebugPanel
