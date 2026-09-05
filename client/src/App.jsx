import { useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(() => localStorage.getItem('pulse_token') || '');
  const [statuses, setStatuses] = useState([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const authed = Boolean(token);

  const headers = useMemo(() => {
    const h = { 'Content-Type': 'application/json' };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  async function registerOrLogin(path) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Auth failed');
      localStorage.setItem('pulse_token', data.token);
      setToken(data.token);
      await loadFeed(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function loadFeed(activeToken = token) {
    const res = await fetch(`${API_BASE}/statuses`, {
      headers: {
        Authorization: `Bearer ${activeToken}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load feed');
    setStatuses(data.items || []);
  }

  async function postStatus(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/statuses`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ body, mood: 'focused' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post');
      setBody('');
      await loadFeed();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem('pulse_token');
    setToken('');
    setStatuses([]);
  }

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Portfolio full-stack demo</p>
          <h1>Pulse</h1>
          <p className="lede">Team status board — auth, CRUD API, React UI, SQLite.</p>
        </div>
        {authed ? (
          <button type="button" className="ghost" onClick={logout}>
            Log out
          </button>
        ) : null}
      </header>

      {error ? <p className="error">{error}</p> : null}

      {!authed ? (
        <section className="card">
          <h2>Sign in</h2>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </label>
          <label>
            Password (min 8)
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
          </label>
          <div className="row">
            <button type="button" disabled={busy} onClick={() => registerOrLogin('/auth/register')}>
              Register
            </button>
            <button type="button" disabled={busy} onClick={() => registerOrLogin('/auth/login')}>
              Log in
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="card">
            <h2>Post a status</h2>
            <form onSubmit={postStatus}>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What are you working on?"
                rows={3}
                required
              />
              <button type="submit" disabled={busy}>
                Share
              </button>
            </form>
          </section>

          <section className="card">
            <div className="row between">
              <h2>Team feed</h2>
              <button type="button" className="ghost" disabled={busy} onClick={() => loadFeed()}>
                Refresh
              </button>
            </div>
            {statuses.length === 0 ? (
              <p className="muted">No statuses yet. Be the first.</p>
            ) : (
              <ul className="feed">
                {statuses.map((item) => (
                  <li key={item.id}>
                    <strong>{item.author}</strong>
                    <span className="mood">{item.mood}</span>
                    <p>{item.body}</p>
                    <time>{item.created_at}</time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
