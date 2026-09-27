import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL, apiRequest as request } from './api.js';
import { useAuth } from './AuthContext.jsx';
import {
  AlertCircle,
  ArrowDownUp,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Eye,
  LibraryBig,
  LoaderCircle,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';

const ROLE_OPTIONS = ['STUDENT', 'LIBRARIAN', 'ADMIN'];

function getUserId(user) {
  return user?.id ?? user?._id ?? '';
}

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U';
}

function roleClass(role = '') {
  return `role-${String(role).toLowerCase()}`;
}

function UserForm({ mode, user, onClose, onSave, saving }) {
  const [values, setValues] = useState({
    studentId: user?.studentId || '',
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'STUDENT',
  });
  const [errors, setErrors] = useState({});

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!values.studentId.trim()) nextErrors.studentId = 'Student ID is required.';
    if (!values.name.trim()) nextErrors.name = 'Name is required.';
    if (!values.email.trim()) nextErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) nextErrors.email = 'Enter a valid email address.';
    if (mode === 'create' && !values.password.trim()) nextErrors.password = 'Password is required.';
    if (values.password && values.password.length < 8) nextErrors.password = 'Use at least 8 characters.';
    if (!values.role) nextErrors.role = 'Choose a role.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const payload = {
      studentId: values.studentId.trim(),
      name: values.name.trim(),
      email: values.email.trim(),
      role: values.role,
    };
    if (values.password) payload.password = values.password;
    await onSave(payload);
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card form-modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
        <div className="modal-heading">
          <div className="modal-icon"><UserRound size={20} /></div>
          <button className="icon-button close-button" type="button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button>
          <p className="eyebrow">MEMBER RECORD</p>
          <h2 id="form-title">{mode === 'create' ? 'Add a member' : 'Edit member'}</h2>
          <p className="modal-subtitle">{mode === 'create' ? 'Create an account for your library community.' : 'Update this member’s account information.'}</p>
        </div>
        <form className="user-form" onSubmit={submit} noValidate>
          <div className="form-grid">
            <label className="field">
              <span>Student ID</span>
              <input autoFocus value={values.studentId} onChange={(event) => update('studentId', event.target.value)} placeholder="e.g. STU-2048" aria-invalid={Boolean(errors.studentId)} />
              {errors.studentId && <small className="field-error">{errors.studentId}</small>}
            </label>
            <label className="field">
              <span>Full name</span>
              <input value={values.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Maya Chen" aria-invalid={Boolean(errors.name)} />
              {errors.name && <small className="field-error">{errors.name}</small>}
            </label>
            <label className="field field-wide">
              <span>Email address</span>
              <input type="email" value={values.email} onChange={(event) => update('email', event.target.value)} placeholder="name@school.edu" aria-invalid={Boolean(errors.email)} />
              {errors.email && <small className="field-error">{errors.email}</small>}
            </label>
            <label className="field field-wide">
              <span>{mode === 'create' ? 'Password' : 'New password'} <em>{mode === 'edit' ? 'optional' : ''}</em></span>
              <input type="password" autoComplete={mode === 'create' ? 'new-password' : 'new-password'} value={values.password} onChange={(event) => update('password', event.target.value)} placeholder={mode === 'create' ? 'At least 8 characters' : 'Leave blank to keep current'} aria-invalid={Boolean(errors.password)} />
              {errors.password && <small className="field-error">{errors.password}</small>}
            </label>
            <label className="field field-wide">
              <span>Account role</span>
              <span className="select-wrap">
                <select value={values.role} onChange={(event) => update('role', event.target.value)}>
                  {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role.charAt(0) + role.slice(1).toLowerCase()}</option>)}
                </select>
                <ChevronDown size={16} />
              </span>
              {errors.role && <small className="field-error">{errors.role}</small>}
            </label>
          </div>
          <div className="form-footer">
            <span className="secure-note"><ShieldCheck size={15} /> Account details stay private</span>
            <div className="form-actions">
              <button className="button button-quiet" type="button" onClick={onClose} disabled={saving}>Cancel</button>
              <button className="button button-primary" type="submit" disabled={saving}>
                {saving ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}
                {saving ? 'Saving…' : mode === 'create' ? 'Create member' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

function DetailModal({ user, onClose, onEdit }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <button className="icon-button detail-close" type="button" onClick={onClose} aria-label="Close details"><X size={19} /></button>
        <div className="detail-profile">
          <div className="avatar avatar-large">{initials(user.name)}</div>
          <span className={`role-pill ${roleClass(user.role)}`}>{user.role || 'MEMBER'}</span>
          <h2 id="detail-title">{user.name || 'Unnamed member'}</h2>
          <p>{user.email}</p>
        </div>
        <div className="detail-list">
          <div><span>Student ID</span><strong>{user.studentId || '—'}</strong></div>
          <div><span>Member record</span><strong className="id-value">{getUserId(user) || 'Unavailable'}</strong></div>
          <div><span>Account role</span><strong>{user.role || '—'}</strong></div>
        </div>
        <button className="button button-primary detail-edit" type="button" onClick={() => onEdit(user)}><UserRound size={16} /> Edit member</button>
      </section>
    </div>
  );
}

function UserManagementPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [sortNewest, setSortNewest] = useState(true);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const result = await request('/users');
      setUsers(Array.isArray(result) ? result : result?.content || result?.data || []);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = users.filter((user) => [user.name, user.studentId, user.email, user.role]
      .some((value) => String(value || '').toLowerCase().includes(query)));
    return sortNewest ? filtered : [...filtered].reverse();
  }, [users, search, sortNewest]);

  async function saveUser(payload) {
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await request('/users', { method: 'POST', body: JSON.stringify(payload) });
        showToast('Member added to your library.');
      } else {
        const id = getUserId(modal.user);
        await request(`/users/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) });
        showToast('Member details updated.');
      }
      setModal(null);
      await loadUsers();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function openDetails(user) {
    const id = getUserId(user);
    if (!id) return setDetailUser(user);
    try {
      const result = await request(`/users/${encodeURIComponent(id)}`);
      setDetailUser(result?.data || result);
    } catch {
      setDetailUser(user);
    }
  }

  async function deleteUser(user) {
    const name = user.name || user.email || 'this member';
    if (!window.confirm(`Remove ${name} from the library? This cannot be undone.`)) return;
    try {
      await request(`/users/${encodeURIComponent(getUserId(user))}`, { method: 'DELETE' });
      showToast('Member removed.');
      if (detailUser && getUserId(detailUser) === getUserId(user)) setDetailUser(null);
      await loadUsers();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  function startEdit(user) {
    setDetailUser(null);
    setModal({ mode: 'edit', user });
  }

  const studentCount = users.filter((user) => String(user.role || '').toLowerCase() === 'student').length;
  const adminCount = users.filter((user) => ['admin', 'librarian'].includes(String(user.role || '').toLowerCase())).length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" aria-label="Page and Pine home">
          <span className="brand-mark"><BookOpen size={21} strokeWidth={1.9} /></span>
          <span className="brand-name">page<span>&</span>pine<small>LIBRARY PORTAL</small></span>
        </a>
        <div className="side-section-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <a className="nav-item" href="#overview"><LibraryBig size={18} /><span>Overview</span></a>
          <a className="nav-item active" href="#members"><UsersRound size={18} /><span>Members</span><span className="nav-count">{users.length}</span></a>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-icon"><CircleHelp size={17} /></span><strong>Need a hand?</strong><p>Manage your library members in one place.</p></div>
          <div className="sidebar-foot"><span className="status-dot" /> API connection <span>•</span> Phase 1</div>
        </div>
      </aside>

      <main className="main-content" id="members">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>Members</strong></div>
          <div className="topbar-right"><span className="topbar-date"><Clock3 size={15} /> Library administration</span><Link className="admin-home-link" to="/admin">Admin home</Link><button className="button button-quiet admin-logout" onClick={() => { logout(); navigate('/login', { replace: true }); }}>Sign out</button></div>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow page-eyebrow">YOUR COMMUNITY</div>
              <h1>Members <span className="heading-period">.</span></h1>
              <p className="page-description">A thoughtful little space to look after your library community.</p>
            </div>
            <button className="button button-primary add-button" onClick={() => setModal({ mode: 'create' })}><Plus size={17} strokeWidth={2.2} /> Add member</button>
          </div>

          <div className="stats-grid">
            <article className="stat-card"><div className="stat-top"><span>Total members</span><span className="stat-icon green"><UsersRound size={17} /></span></div><div className="stat-value">{loading ? '—' : users.length.toLocaleString()}</div><div className="stat-foot">Across your library</div></article>
            <article className="stat-card"><div className="stat-top"><span>Students</span><span className="stat-icon sand"><BookOpen size={17} /></span></div><div className="stat-value">{loading ? '—' : studentCount.toLocaleString()}</div><div className="stat-foot">Student accounts</div></article>
            <article className="stat-card"><div className="stat-top"><span>Library team</span><span className="stat-icon lavender"><ShieldCheck size={17} /></span></div><div className="stat-value">{loading ? '—' : adminCount.toLocaleString()}</div><div className="stat-foot">Admins &amp; librarians</div></article>
            <article className="stat-card stat-note"><div className="note-decoration">“</div><p>Every reader has a story.<br /><strong>Make room for one more.</strong></p><span>THE PAGE &amp; PINE WAY</span></article>
          </div>

          <section className="directory-card" aria-labelledby="directory-title">
            <div className="directory-heading">
              <div><h2 id="directory-title">Member directory</h2><p>Browse and manage everyone in your library.</p></div>
              <span className="directory-total">{filteredUsers.length} {filteredUsers.length === 1 ? 'member' : 'members'}</span>
            </div>
            <div className="table-toolbar">
              <label className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or student ID" aria-label="Search members" />{search && <button type="button" className="search-clear" onClick={() => setSearch('')} aria-label="Clear search"><X size={15} /></button>}</label>
              <button className="button button-outline sort-button" onClick={() => setSortNewest((value) => !value)}><ArrowDownUp size={15} /> {sortNewest ? 'Recently added' : 'Oldest first'}</button>
            </div>

            {loadError ? (
              <div className="load-state error-state"><span className="state-icon"><AlertCircle size={21} /></span><h3>We couldn’t load your members</h3><p>{loadError}</p><button className="button button-outline" onClick={loadUsers}>Try again</button><small>API endpoint: {API_URL}/users</small></div>
            ) : loading ? (
              <div className="load-state"><LoaderCircle className="spin loading-icon" size={24} /><p>Gathering your library members…</p></div>
            ) : filteredUsers.length === 0 ? (
              <div className="load-state empty-state"><span className="state-icon"><UsersRound size={22} /></span><h3>{search ? 'No members match your search' : 'Your directory is waiting'}</h3><p>{search ? 'Try another name, email or student ID.' : 'Add your first member to get your library community started.'}</p>{search ? <button className="button button-outline" onClick={() => setSearch('')}>Clear search</button> : <button className="button button-primary" onClick={() => setModal({ mode: 'create' })}><Plus size={16} /> Add first member</button>}</div>
            ) : (
              <div className="table-scroll">
                <table className="member-table">
                  <thead><tr><th>MEMBER</th><th>STUDENT ID</th><th>ROLE</th><th>STATUS</th><th><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>{filteredUsers.map((user, index) => (
                    <tr key={getUserId(user) || `${user.email}-${index}`}>
                      <td><button className="member-cell" type="button" onClick={() => openDetails(user)}><span className={`avatar avatar-${index % 5}`}>{initials(user.name)}</span><span className="member-copy"><strong>{user.name || 'Unnamed member'}</strong><span><Mail size={13} />{user.email || 'No email provided'}</span></span></button></td>
                      <td><span className="student-id">{user.studentId || '—'}</span></td>
                      <td><span className={`role-pill ${roleClass(user.role)}`}><span className="role-dot" />{user.role || 'MEMBER'}</span></td>
                      <td><span className="status-pill"><span /> Active</span></td>
                      <td><div className="row-actions"><button className="icon-button" onClick={() => openDetails(user)} aria-label={`View ${user.name || 'member'}`} title="View details"><Eye size={16} /></button><button className="icon-button" onClick={() => startEdit(user)} aria-label={`Edit ${user.name || 'member'}`} title="Edit member"><MoreHorizontal size={18} /></button><button className="icon-button delete-action" onClick={() => deleteUser(user)} aria-label={`Delete ${user.name || 'member'}`} title="Delete member"><X size={17} /></button></div></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
            {!loading && !loadError && users.length > 0 && <div className="table-footer"><span>Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> members</span><span><span className="status-dot" /> Synced with your library database</span></div>}
          </section>
          <footer className="page-footer"><span>Made for the love of reading.</span><span>PAGE &amp; PINE <span className="footer-leaf">✳</span> LIBRARY MANAGEMENT</span></footer>
        </section>
      </main>

      {modal && <UserForm key={`${modal.mode}-${getUserId(modal.user)}`} mode={modal.mode} user={modal.user} onClose={() => !saving && setModal(null)} onSave={saveUser} saving={saving} />}
      {detailUser && <DetailModal user={detailUser} onClose={() => setDetailUser(null)} onEdit={startEdit} />}
      {toast && <div className={`toast ${toast.type === 'error' ? 'toast-error' : ''}`} role="status"><span>{toast.type === 'error' ? <AlertCircle size={17} /> : <Check size={17} />}</span>{toast.message}<button className="toast-close" onClick={() => setToast(null)} aria-label="Dismiss notification"><X size={15} /></button></div>}
    </div>
  );
}

export default UserManagementPage;
