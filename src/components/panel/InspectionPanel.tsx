import React, { useState } from 'react';
import { ClipboardCheck, Camera, CheckCircle, AlertTriangle, Plus, Trash2, FileText, Check, X } from 'lucide-react';

interface InspectionItem {
  id: string;
  room: string;
  item: string;
  status: 'ok' | 'damage' | 'maintenance';
  observation: string;
}

export const InspectionPanel: React.FC = () => {
  const [selectedProperty, setSelectedProperty] = useState('Apartamento Vista Mar - Ingleses');
  const [inspectionType, setInspectionType] = useState<'checkin' | 'checkout' | 'routine'>('checkin');
  
  // Lista padrão de itens de vistoria imobiliária
  const [items, setItems] = useState<InspectionItem[]>([
    { id: '1', room: 'Sala de Estar', item: 'Pintura e Paredes', status: 'ok', observation: 'Sem avarias' },
    { id: '2', room: 'Sala de Estar', item: 'Ar Condicionado / Climatização', status: 'ok', observation: 'Funcionando perfeitamente' },
    { id: '3', room: 'Cozinha', item: 'Geladeira e Eletrodomésticos', status: 'ok', observation: 'Limpa e higienizada' },
    { id: '4', room: 'Banheiro', item: 'Registros e Chuveiro', status: 'ok', observation: 'Sem vazamentos' },
    { id: '5', room: 'Quarto Principal', item: 'Colchão e Roupa de Cama', status: 'ok', observation: 'Em bom estado' },
  ]);

  const [newItemName, setNewItemName] = useState('');
  const [newRoom, setNewRoom] = useState('Sala de Estar');
  const [reportGenerated, setReportGenerated] = useState(false);

  const handleStatusChange = (id: string, status: 'ok' | 'damage' | 'maintenance') => {
    setItems(items.map(i => i.id === id ? { ...i, status } : i));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: InspectionItem = {
      id: Date.now().toString(),
      room: newRoom,
      item: newItemName,
      status: 'ok',
      observation: 'Novo item verificado'
    };

    setItems([...items, newItem]);
    setNewItemName('');
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleGenerateReport = () => {
    setReportGenerated(true);
    setTimeout(() => setReportGenerated(false), 4000);
  };

  const okCount = items.filter(i => i.status === 'ok').length;
  const alertCount = items.length - okCount;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho do Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold mb-2">
            <ClipboardCheck className="w-3.5 h-3.5" /> Módulo de Vistoria Profissional
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Inspeção e Checklists</h1>
          <p className="text-slate-500 text-sm">Realize vistorias detalhadas por ambiente com validação de status e fotos.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-medium transition shadow-md shadow-teal-600/10 text-sm"
          >
            <FileText className="w-4 h-4" /> {reportGenerated ? 'Relatório Gerado!' : 'Gerar Laudo PDF'}
          </button>
        </div>
      </div>

      {/* Seletor de Imóvel e Tipo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Selecione o Imóvel</label>
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 bg-white text-sm font-medium"
          >
            <option value="Apartamento Vista Mar - Ingleses">Apartamento Vista Mar - Ingleses</option>
            <option value="Cobertura Duplex - Jurerê">Cobertura Duplex - Jurerê</option>
            <option value="Chalé de Montanha - Campeche">Chalé de Montanha - Campeche</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tipo de Inspeção</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setInspectionType('checkin')}
              className={`py-2.5 px-3 rounded-xl font-medium text-xs transition border ${
                inspectionType === 'checkin' ? 'bg-teal-600 text-white border-teal-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Check-in
            </button>
            <button
              type="button"
              onClick={() => setInspectionType('checkout')}
              className={`py-2.5 px-3 rounded-xl font-medium text-xs transition border ${
                inspectionType === 'checkout' ? 'bg-teal-600 text-white border-teal-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Check-out
            </button>
            <button
              type="button"
              onClick={() => setInspectionType('routine')}
              className={`py-2.5 px-3 rounded-xl font-medium text-xs transition border ${
                inspectionType === 'routine' ? 'bg-teal-600 text-white border-teal-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Manutenção
            </button>
          </div>
        </div>
      </div>

      {/* Resumo Rápido da Vistoria */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold">Total de Itens</p>
            <p className="text-xl font-extrabold text-slate-800">{items.length}</p>
          </div>
          <div className="p-3 bg-slate-100 rounded-xl text-slate-600"><ClipboardCheck className="w-5 h-5" /></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-600 uppercase font-bold">Aprovados (OK)</p>
            <p className="text-xl font-extrabold text-emerald-700">{okCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><CheckCircle className="w-5 h-5" /></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-600 uppercase font-bold">Atenção / Avarias</p>
            <p className="text-xl font-extrabold text-amber-700">{alertCount}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><AlertTriangle className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Lista de Itens do Checklist */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Itens de Verificação do Imóvel</h2>
          <span className="text-xs text-slate-400">Clique para alternar o status do item</span>
        </div>

        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 px-3 rounded-xl transition">
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">{item.room}</span>
                <h4 className="font-semibold text-slate-800 text-sm">{item.item}</h4>
                <p className="text-xs text-slate-400">{item.observation}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(item.id, 'ok')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      item.status === 'ok' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(item.id, 'damage')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      item.status === 'damage' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Avaria
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(item.id, 'maintenance')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      item.status === 'maintenance' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Manutenção
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-slate-300 hover:text-red-600 transition"
                  title="Remover item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Adicionar novo item ao checklist */}
        <form onSubmit={handleAddItem} className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <select
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 bg-white text-sm"
            >
              <option value="Sala de Estar">Sala de Estar</option>
              <option value="Cozinha">Cozinha</option>
              <option value="Quarto Principal">Quarto Principal</option>
              <option value="Banheiro">Banheiro</option>
              <option value="Área Externa">Área Externa / Sacada</option>
            </select>
          </div>
          <div>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Nome do item (ex: TV, Sofá, Microondas)"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 text-sm"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl font-medium transition text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" /> Adicionar Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};