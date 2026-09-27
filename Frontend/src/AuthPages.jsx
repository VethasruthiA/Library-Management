import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, BookOpen, Check, LoaderCircle, ShieldCheck } from 'lucide-react';
import { apiRequest, extractSession } from './api.js';
import { useAuth } from './AuthContext.jsx';

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <main className="auth-screen">
      <div className="auth-decoration auth-decoration-one" />
      <div className="auth-decoration auth-decoration-two" />
      <Link to="/login" className="auth-brand"><span><BookOpen size={21} /></span><strong>page<span>&</span>pine</strong></Link>
      <section className="auth-card">
        <div className="auth-heading"><span className="auth-kicker">YOUR LIBRARY, YOUR SPACE</span><h1>{title}</h1><p>{subtitle}</p></div>
        {children}
        <div className="auth-switch">{footer}</div>
      </section>
      <div className="auth-footnote"><ShieldCheck size={14} /> A welcoming place for every reader</div>
    </main>
  );
}

function AuthMessage({ children, type = 'error' }) {
  if (!children) return null;
  return <div className={`auth-message ${type}`} role="alert">{type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}{children}</div>;
}

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(location.state?.message || '');

  if (isAuthenticated) return <Navigate to={role === 'ADMIN' ? '/admin' : '/student'} replace />;

  async function submit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!studentId.trim() || !password) {
      setError('Enter your student ID and password.');
      return;
    }
    setLoading(true);
    try {
      const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ studentId: studentId.trim(), password }),
      });
      const session = extractSession(result);
      login(session.token, session.user);
      navigate(session.user.role === 'ADMIN' ? '/admin' : '/student', { replace: true });
    } catch (submitError) {
      setError(submitError.message || 'Unable to sign in. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to find your place in the library." footer={<>New to Page &amp; Pine? <Link to="/register">Create an account</Link></>}>
      <AuthMessage>{error}</AuthMessage>
      <AuthMessage type="success">{message}</AuthMessage>
      <form className="auth-form" onSubmit={submit}>
        <label className="field"><span>Student ID</span><input autoFocus autoComplete="username" value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="Enter your student ID" /></label>
        <label className="field"><span>Password</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /></label>
        <button className="button button-primary auth-submit" type="submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={17} /> : null}{loading ? 'Signing in…' : 'Sign in'}{!loading && <ArrowRight size={16} />}</button>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState({ studentId: '', name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    if (Object.values(values).some((value) => !value.trim())) {
      setError('Please complete every field.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (values.password.length < 8) {
      setError('Your password must be at least 8 characters.');
      return;
    }
    if (values.password !== values.confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({
          studentId: values.studentId.trim(),
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password,
          role: 'STUDENT',
        }),
      });
      navigate('/login', { replace: true, state: { message: 'Your account is ready. Sign in to continue.' } });
    } catch (submitError) {
      setError(submitError.message || 'Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Join the community" subtitle="Create your student account to get started." footer={<>Already have an account? <Link to="/login">Sign in</Link></>}>
      <AuthMessage>{error}</AuthMessage>
      <form className="auth-form" onSubmit={submit}>
        <label className="field"><span>Student ID</span><input autoFocus autoComplete="username" value={values.studentId} onChange={(event) => update('studentId', event.target.value)} placeholder="e.g. STU-2048" /></label>
        <label className="field"><span>Full name</span><input autoComplete="name" value={values.name} onChange={(event) => update('name', event.target.value)} placeholder="Your name" /></label>
        <label className="field"><span>Email address</span><input type="email" autoComplete="email" value={values.email} onChange={(event) => update('email', event.target.value)} placeholder="you@school.edu" /></label>
        <div className="auth-form-row">
          <label className="field"><span>Password</span><input type="password" autoComplete="new-password" value={values.password} onChange={(event) => update('password', event.target.value)} placeholder="At least 8 characters" /></label>
          <label className="field"><span>Confirm password</span><input type="password" autoComplete="new-password" value={values.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} placeholder="Repeat password" /></label>
        </div>
        <button className="button button-primary auth-submit" type="submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={17} /> : null}{loading ? 'Creating account…' : 'Create student account'}{!loading && <ArrowRight size={16} />}</button>
      </form>
    </AuthShell>
  );
}
