import React from 'react';
import { Home, LayoutDashboard, User, LogOut } from 'lucide-react';

export type View = 'marketplace' | 'panel';

interface NavbarProps {
  view: View;
  onNavigate: (view: View) => void;
  user: any;
  onAuthClick: () => void;
}

export default function Navbar({ view, onNavigate, user, onAuthClick }: NavbarProps) {
  // Procura o nome em diferentes locais possíveis dos metadados do Supabase ou usa o e-mail como fallback
  const metadata = user?.user_metadata || {};
  const rawName = metadata.full_name || metadata.name || metadata.display_name;
  const displayName = rawName ? rawName.split(' ')[0] : (user?.email ? user.email.split('@')[0] : '');

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => onNavigate('marketplace')}
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white">
            <Home className="h-5 w-5" />
          </span>
          <span>Go<span className="text-teal-600">Férias</span></span>
        </button>

        <nav className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('marketplace')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              view === 'marketplace'
                ? 'bg-teal-50 text-teal-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Marketplace</span>
          </button>
          
          <button
            onClick={() => onNavigate('panel')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              view === 'panel'
                ? 'bg-teal-50 text-teal-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Painel do Proprietário</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-200">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
                <User className="h-3.5 w-3.5 text-teal-600" />
                <span className="truncate max-w-[120px]">{displayName}</span>
              </div>
              <button
                onClick={onAuthClick}
                className="flex items-center gap-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 text-sm font-medium transition-colors"
                title="Sair da conta"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onAuthClick}
              className="ml-2 rounded-lg bg-teal-600 hover:bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors shadow-sm"
            >
              Entrar
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}