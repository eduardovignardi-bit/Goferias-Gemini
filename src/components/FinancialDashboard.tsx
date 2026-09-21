import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, TrendingUp, Wallet, ArrowUpRight, Building2, CheckCircle2 } from 'lucide-react';

interface BookingRecord {
  id: string;
  total_price: number;
  check_in: string;
  created_at: string;
  properties?: {
    title: string;
    city: string;
  };
}

export const FinancialDashboard: React.FC = () => {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('id, total_price, check_in, created_at, properties(title, city)');

      if (error) throw error;
      if (data) setBookings(data);
    } catch (err) {
      console.error('Erro ao carregar dados financeiros:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cálculos financeiros consolidados
  const totalRevenue = bookings.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
  const platformCommission = totalRevenue * 0.15; // 15% de comissão estimada da plataforma
  const ownerPayouts = totalRevenue - platformCommission;

  if (loading) {
    return <div className="text-center py-12 text-slate-400">A calcular dados financeiros...</div>;
  }

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-6 gap-4">
        <div>
          <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Gestão Financeira
          </span>
          <h3 className="text-2xl font-extrabold text-slate-800 mt-2">Dashboard & Repasses</h3>
          <p className="text-xs text-slate-500 mt-1">Acompanhe o faturamento geral, comissões e repasses aos proprietários em tempo real.</p>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 text-white p-6 rounded-3xl shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-200">Faturamento Bruto Total</span>
            <DollarSign className="w-5 h-5 text-teal-200" />
          </div>
          <h4 className="text-3xl font-extrabold">R$ {totalRevenue.toFixed(2)}</h4>
          <p className="text-xs text-teal-100">Baseado em {bookings.length} reservas registadas</p>
        </div>

        <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Comissão da Plataforma (15%)</span>
            <TrendingUp className="w-5 h-5 text-teal-600" />
          </div>
          <h4 className="text-3xl font-extrabold text-slate-800">R$ {platformCommission.toFixed(2)}</h4>
          <p className="text-xs text-slate-500">Receita operacional do GoFérias</p>
        </div>

        <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total a Repassar (Proprietários)</span>
            <Wallet className="w-5 h-5 text-blue-600" />
          </div>
          <h4 className="text-3xl font-extrabold text-slate-800">R$ {ownerPayouts.toFixed(2)}</h4>
          <p className="text-xs text-slate-500">Líquido pendente de repasse</p>
        </div>
      </div>

      {/* Histórico Detalhado de Receitas por Reserva */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Extrato Consolidado de Reservas</h4>

        {bookings.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Nenhuma transação financeira registada até o momento.
          </div>
        ) : (
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-bold">
                <tr>
                  <th className="p-4">Imóvel</th>
                  <th className="p-4">Data da Reserva</th>
                  <th className="p-4">Check-in</th>
                  <th className="p-4 text-right">Valor Bruto</th>
                  <th className="p-4 text-right">Comissão (15%)</th>
                  <th className="p-4 text-right">Repasse Líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => {
                  const val = Number(b.total_price) || 0;
                  const comm = val * 0.15;
                  const net = val - comm;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-teal-600" />
                        {b.properties?.title || 'Imóvel'}
                      </td>
                      <td className="p-4 text-xs text-slate-500">{new Date(b.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className="p-4 text-xs font-medium">{new Date(b.check_in).toLocaleDateString('pt-BR')}</td>
                      <td className="p-4 text-right font-bold text-slate-800">R$ {val.toFixed(2)}</td>
                      <td className="p-4 text-right text-teal-700 font-semibold">R$ {comm.toFixed(2)}</td>
                      <td className="p-4 text-right text-blue-700 font-extrabold">R$ {net.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};