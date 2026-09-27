import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Armchair, ArrowRight, BookOpen, Check, CircleHelp, DoorOpen, LibraryBig, LoaderCircle, LogOut, Plus, RefreshCw, ShieldCheck, Trash2, UsersRound, X } from 'lucide-react';
import { API_URL, apiRequest } from './api.js';
import { useAuth } from './AuthContext.jsx';

function unwrapList(result) {
  if (Array.isArray(result)) return result;
  return result?.content || result?.seats || result?.availableSeats || result?.data || [];
}

function seatId(seat) {
  return seat?.id ?? seat?._id ?? seat?.seatId ?? '';
}

function seatLabel(seat, index) {
  return seat?.seatNumber || seat?.number || seat?.name || seat?.label || `Seat ${index + 1}`;
}

function AppHeader({ title, links = [] }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  function signOut() {
    logout();
    navigate('/login', { replace: true, state: { message: 'You have been signed out.' } });
  }
  return (
    <header className="workspace-topbar">
      <Link className="workspace-brand" to={role === 'ADMIN' ? '/admin' : '/student'}><span><BookOpen size={19} /></span> page<span className="ampersand">&amp;</span>pine</Link>
      <nav className="workspace-links" aria-label="Dashboard navigation">{links.map((link) => <Link key={link.to} to={link.to}>{link.label}</Link>)}</nav>
      <div className="workspace-user"><span className="workspace-user-copy"><strong>{user.name || user.studentId || 'Library member'}</strong><small>{role || 'Member'}</small></span><button className="button button-quiet signout-button" onClick={signOut}><LogOut size={15} /> Sign out</button></div>
      <span className="sr-only">{title}</span>
    </header>
  );
}

function WorkspaceFrame({ title, subtitle, links, children }) {
  return <div className="workspace-screen"><AppHeader title={title} links={links} /><main className="workspace-main"><div className="workspace-eyebrow">PAGE &amp; PINE LIBRARY</div><h1>{title}<span className="heading-period">.</span></h1><p className="workspace-subtitle">{subtitle}</p>{children}</main><footer className="workspace-footer">Made for the love of reading <span>✳</span></footer></div>;
}

export function StudentDashboard() {
  const { user } = useAuth();
  const [available, setAvailable] = useState(null);
  useEffect(() => {
    let active = true;
    apiRequest('/seats/available').then((result) => {
      if (active) setAvailable(unwrapList(result).length);
    }).catch(() => { if (active) setAvailable(null); });
    return () => { active = false; };
  }, []);

  return (
    <WorkspaceFrame title={`Hello${user.name ? `, ${user.name.split(' ')[0]}` : ''}`} subtitle="Your library, your space. Find a quiet corner and make something of the day." links={[{ to: '/student', label: 'Dashboard' }, { to: '/student/seats', label: 'Available seats' }, { to: '/student/profile', label: 'My profile' }]}>
      <section className="welcome-panel"><span className="welcome-art"><BookOpen size={58} strokeWidth={1.25} /></span><span className="eyebrow">A GOOD DAY TO READ</span><h2>There’s always room<br />for one more chapter.</h2><p>Settle into your next study session. Your library is waiting.</p><Link className="button button-primary" to="/student/seats"><Armchair size={16} /> Find an available seat <ArrowRight size={15} /></Link></section>
      <div className="workspace-card-grid">
        <Link to="/student/seats" className="workspace-action-card"><span className="action-card-icon"><Armchair size={19} /></span><span><strong>Available seats</strong><small>{available === null ? 'See what’s open right now' : `${available} seat${available === 1 ? '' : 's'} available right now`}</small></span><ArrowRight size={16} /></Link>
        <Link to="/student/profile" className="workspace-action-card"><span className="action-card-icon action-sand"><ShieldCheck size={19} /></span><span><strong>My profile</strong><small>Check your library account details</small></span><ArrowRight size={16} /></Link>
      </div>
      <section className="workspace-note"><CircleHelp size={18} /><p><strong>Bookings are coming later.</strong><br />For now, you can check seat availability and manage your profile.</p></section>
    </WorkspaceFrame>
  );
}

export function StudentProfile() {
  const { user, role } = useAuth();
  return <WorkspaceFrame title="My profile" subtitle="Your library account details." links={[{ to: '/student', label: 'Dashboard' }, { to: '/student/seats', label: 'Available seats' }, { to: '/student/profile', label: 'My profile' }]}>
    <section className="profile-card"><div className="profile-avatar">{(user.name || user.studentId || 'M').slice(0, 1).toUpperCase()}</div><span className="role-pill role-student">{role || 'STUDENT'}</span><h2>{user.name || 'Library member'}</h2><p>{user.email || 'No email in the login response'}</p><div className="profile-details"><div><span>Student ID</span><strong>{user.studentId || 'Not provided by backend'}</strong></div><div><span>Account role</span><strong>{role || 'Not provided by backend'}</strong></div><div><span>Account reference</span><strong>{user.id || 'Not provided by backend'}</strong></div></div></section>
  </WorkspaceFrame>;
}

export function AdminDashboard() {
  const [counts, setCounts] = useState({ users: null, seats: null });
  useEffect(() => {
    let active = true;
    Promise.allSettled([apiRequest('/users'), apiRequest('/seats')]).then(([users, seats]) => {
      if (!active) return;
      setCounts({
        users: users.status === 'fulfilled' ? unwrapList(users.value).length : null,
        seats: seats.status === 'fulfilled' ? unwrapList(seats.value).length : null,
      });
    });
    return () => { active = false; };
  }, []);
  return <WorkspaceFrame title="Admin dashboard" subtitle="A clear view of your library community and spaces." links={[{ to: '/admin', label: 'Dashboard' }, { to: '/admin/users', label: 'Manage users' }, { to: '/admin/seats', label: 'Manage seats' }]}>
    <div className="admin-welcome"><span className="welcome-art"><LibraryBig size={56} strokeWidth={1.3} /></span><span className="eyebrow">LIBRARY OPERATIONS</span><h2>Good things grow<br />in a well-loved library.</h2><p>Manage your community and keep the study spaces ready.</p></div>
    <div className="admin-stats"><article><span><UsersRound size={18} /></span><small>Library members</small><strong>{counts.users ?? '—'}</strong></article><article><span><Armchair size={18} /></span><small>Registered seats</small><strong>{counts.seats ?? '—'}</strong></article></div>
    <div className="workspace-card-grid"><Link to="/admin/users" className="workspace-action-card"><span className="action-card-icon"><UsersRound size={19} /></span><span><strong>Manage users</strong><small>Create, update, search, and remove accounts</small></span><ArrowRight size={16} /></Link><Link to="/admin/seats" className="workspace-action-card"><span className="action-card-icon action-sand"><Armchair size={19} /></span><span><strong>Manage seats</strong><small>Review availability and maintain seat records</small></span><ArrowRight size={16} /></Link></div>
  </WorkspaceFrame>;
}

function SeatForm({ seat, onCancel, onSave, saving }) {
  const [seatNumber, setSeatNumber] = useState(seat?.seatNumber || seat?.number || '');
  const [location, setLocation] = useState(seat?.location || seat?.floor || '');
  const [status, setStatus] = useState(seat?.status || 'AVAILABLE');
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    if (!seatNumber.trim()) return setError('Seat number is required.');
    await onSave({ seatNumber: seatNumber.trim(), location: location.trim(), status }, setError);
  }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}><section className="modal-card seat-modal" role="dialog" aria-modal="true" aria-labelledby="seat-form-title"><div className="modal-heading"><button className="icon-button close-button" type="button" onClick={onCancel} aria-label="Close"><X size={19} /></button><p className="eyebrow">SEAT RECORD</p><h2 id="seat-form-title">{seat ? 'Edit seat' : 'Add a seat'}</h2><p className="modal-subtitle">Seat fields may need adjustment to match the backend model.</p></div><form className="user-form" onSubmit={submit}><div className="seat-form-fields"><label className="field"><span>Seat number</span><input autoFocus value={seatNumber} onChange={(event) => setSeatNumber(event.target.value)} placeholder="e.g. A-12" /></label><label className="field"><span>Location / floor</span><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="e.g. First floor" /></label><label className="field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="AVAILABLE">Available</option><option value="UNAVAILABLE">Unavailable</option></select></label>{error && <small className="field-error">{error}</small>}</div><div className="form-footer"><span className="secure-note"><ShieldCheck size={15} /> Admin action</span><div className="form-actions"><button className="button button-quiet" type="button" onClick={onCancel}>Cancel</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}{saving ? 'Saving…' : 'Save seat'}</button></div></div></form></section></div>;
}

export function SeatDirectory({ admin = false }) {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const loadSeats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest(admin ? '/seats' : '/seats/available');
      setSeats(unwrapList(result));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [admin]);

  useEffect(() => { loadSeats(); }, [loadSeats]);

  async function saveSeat(payload) {
    const id = seatId(modal?.seat);
    setSaving(true);
    try {
      await apiRequest(id ? `/seats/${encodeURIComponent(id)}` : '/seats', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      setModal(null);
      setNotice(id ? 'Seat updated.' : 'Seat added.');
      await loadSeats();
    } catch (saveError) {
      setNotice(saveError.message);
    } finally {
      setSaving(false);
      window.setTimeout(() => setNotice(''), 4000);
    }
  }

  async function deleteSeat(seat) {
    const id = seatId(seat);
    if (!id || !window.confirm(`Delete ${seat.seatNumber || seat.number || 'this seat'}? This cannot be undone.`)) return;
    try {
      await apiRequest(`/seats/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setNotice('Seat deleted.');
      await loadSeats();
    } catch (deleteError) {
      setNotice(deleteError.message);
    }
    window.setTimeout(() => setNotice(''), 4000);
  }

  async function viewSeat(seat) {
    const id = seatId(seat);
    if (!id) {
      setSelectedSeat(seat);
      return;
    }
    try {
      const result = await apiRequest(`/seats/${encodeURIComponent(id)}`);
      setSelectedSeat(result?.data || result);
    } catch (detailError) {
      setNotice(detailError.message);
      window.setTimeout(() => setNotice(''), 4000);
    }
  }

  return <WorkspaceFrame title={admin ? 'Manage seats' : 'Available seats'} subtitle={admin ? 'Maintain the library’s study spaces.' : 'Find an open place for your next study session.'} links={admin ? [{ to: '/admin', label: 'Dashboard' }, { to: '/admin/users', label: 'Manage users' }, { to: '/admin/seats', label: 'Manage seats' }] : [{ to: '/student', label: 'Dashboard' }, { to: '/student/seats', label: 'Available seats' }, { to: '/student/profile', label: 'My profile' }]}>
    <section className="seat-directory"><div className="seat-directory-head"><div><h2>{admin ? 'Seat directory' : 'Ready when you are'}</h2><p>{admin ? 'Add, edit, or remove library seat records.' : 'These seats are currently marked available.'}</p></div><div className="seat-head-actions"><button className="button button-outline" onClick={loadSeats}><RefreshCw size={15} /> Refresh</button>{admin && <button className="button button-primary" onClick={() => setModal({ seat: null })}><Plus size={16} /> Add seat</button>}</div></div>
      {notice && <div className="seat-notice" role="status">{notice}</div>}
      {error ? <div className="load-state error-state"><span className="state-icon"><X size={20} /></span><h3>Couldn’t load seats</h3><p>{error}</p><small>API endpoint: {API_URL}{admin ? '/seats' : '/seats/available'}</small><button className="button button-outline" onClick={loadSeats}>Try again</button></div> : loading ? <div className="load-state"><LoaderCircle className="spin loading-icon" size={24} /><p>Checking the library seats…</p></div> : seats.length === 0 ? <div className="load-state empty-state"><span className="state-icon"><Armchair size={21} /></span><h3>{admin ? 'No seats yet' : 'No seats are available right now'}</h3><p>{admin ? 'Add the first seat record to start managing library spaces.' : 'Check back soon or ask the library team for help.'}</p>{admin && <button className="button button-primary" onClick={() => setModal({ seat: null })}><Plus size={16} /> Add first seat</button>}</div> : <div className="seat-grid">{seats.map((seat, index) => {
        const id = seatId(seat) || `${seatLabel(seat, index)}-${index}`;
        const available = String(seat.status || seat.availability || 'AVAILABLE').toUpperCase().includes('AVAILABLE') && !String(seat.status || '').toUpperCase().includes('UNAVAILABLE');
        return <article className="seat-card" key={id}><span className={`seat-icon ${available ? '' : 'seat-busy'}`}><Armchair size={21} /></span><div className="seat-status"><i className={available ? 'available' : ''} />{seat.status || seat.availability || (available ? 'AVAILABLE' : 'OCCUPIED')}</div><h3>{seatLabel(seat, index)}</h3><p><DoorOpen size={14} />{seat.location || seat.floor || seat.zone || 'Library floor'}</p><div className="seat-card-actions"><button className="button button-quiet" onClick={() => viewSeat(seat)}>View details</button>{admin && <><button className="button button-quiet" onClick={() => setModal({ seat })}>Edit</button><button className="button button-quiet delete-seat" onClick={() => deleteSeat(seat)} aria-label={`Delete ${seatLabel(seat, index)}`}><Trash2 size={15} /></button></>}</div></article>;
      })}</div>}
    </section>
    {modal && <SeatForm key={seatId(modal.seat) || 'new'} seat={modal.seat} onCancel={() => !saving && setModal(null)} onSave={saveSeat} saving={saving} />}
    {selectedSeat && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedSeat(null)}><section className="modal-card seat-detail-modal" role="dialog" aria-modal="true" aria-labelledby="seat-detail-title"><button className="icon-button detail-close" type="button" onClick={() => setSelectedSeat(null)} aria-label="Close details"><X size={19} /></button><div className="detail-profile"><div className="avatar-large seat-detail-avatar"><Armchair size={25} /></div><span className="eyebrow">LIBRARY SPACE</span><h2 id="seat-detail-title">{selectedSeat.seatNumber || selectedSeat.number || selectedSeat.name || selectedSeat.label || 'Seat details'}</h2><p>Seat record from the library system</p></div><div className="detail-list">{Object.entries(selectedSeat).filter(([key, value]) => !['_id', 'id', '__v'].includes(key) && value !== null && typeof value !== 'object').map(([key, value]) => <div key={key}><span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())}</span><strong>{String(value)}</strong></div>)}</div></section></div>}
  </WorkspaceFrame>;
}
