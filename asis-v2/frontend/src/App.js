import { useState } from 'react';
import { AppProvider, useApp } from './AppContext';
import LoginPage   from './pages/LoginPage';
import AppShell    from './components/AppShell';
import './index.css';

function Root() {
  const { user } = useApp();
  return user ? <AppShell /> : <LoginPage />;
}

export default function App() {
  return <AppProvider><Root /></AppProvider>;
}
