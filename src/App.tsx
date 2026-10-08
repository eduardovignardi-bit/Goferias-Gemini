import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import { Marketplace } from './components/marketplace/Marketplace'; // Corrigido para importação nomeada
import { OwnerPanel } from './components/panel/OwnerPanel';
import { AuthModal } from './components/panel/AuthModal';
import { PropertyDetails } from './components/marketplace/PropertyDetails';
import { MyTrips } from './components/MyTrips';
import type { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import type { View } from './components/Navbar';

export function App() {
  const [currentView, setCurrentView] = useState<View>('marketplace');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [propertyId, setPropertyId] = useState(() => new URLSearchParams(window.location.search).get('imovel'));

  // Monitora o estado de autenticação do usuário no Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Lida com cliques de Entrar / Sair da Navbar
  const handleAuthClick = async () => {
    if (user) {
      await supabase.auth.signOut();
    } else {
      setIsAuthOpen(true);
    }
  };

  const clearPropertyRoute = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('imovel');
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
    setPropertyId(null);
  };

  const handleNavigate = (view: View) => {
    if (view === 'trips' && !user) {
      setIsAuthOpen(true);
      return;
    }
    clearPropertyRoute();
    setCurrentView(view);
  };

  const handleOpenProperty = (id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('imovel', id);
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
    setPropertyId(id);
  };

  useEffect(() => {
    const syncPropertyRoute = () => {
      setPropertyId(new URLSearchParams(window.location.search).get('imovel'));
      setCurrentView('marketplace');
    };

    window.addEventListener('popstate', syncPropertyRoute);
    return () => window.removeEventListener('popstate', syncPropertyRoute);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        view={currentView}
        onNavigate={handleNavigate}
        user={user}
        onAuthClick={handleAuthClick}
      />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'panel' ? (
          <OwnerPanel />
        ) : propertyId ? (
          <PropertyDetails
            propertyId={propertyId}
            guest={user}
            onBack={() => handleNavigate('marketplace')}
            onRequireLogin={() => setIsAuthOpen(true)}
          />
        ) : currentView === 'trips' ? (
          <MyTrips />
        ) : (
          <Marketplace onOpenProperty={handleOpenProperty} />
        )}
      </main>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}

export default App;