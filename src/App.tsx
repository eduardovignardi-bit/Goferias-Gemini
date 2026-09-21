import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import { Marketplace } from './components/marketplace/Marketplace'; // Corrigido para importação nomeada
import { OwnerPanel } from './components/panel/OwnerPanel';
import { AuthModal } from './components/panel/AuthModal';
import { supabase } from './lib/supabase';

export function App() {
  const [currentView, setCurrentView] = useState<'marketplace' | 'panel'>('marketplace');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        view={currentView}
        onNavigate={setCurrentView}
        user={user}
        onAuthClick={handleAuthClick}
      />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'marketplace' ? <Marketplace /> : <OwnerPanel />}
      </main>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}

export default App;