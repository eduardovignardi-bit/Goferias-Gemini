import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ClipboardCheck, CheckCircle2, AlertTriangle, Save, FileText, History, Plus, Trash2, Printer } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  city: string;
  state: string;
}

interface InspectionRecord {
  id: string;
  property_id: string;
  inspector_name: string;
  inspection_type: string;
  created_at: string;
  checklist_items: any[];
  properties?: {
    title: string;
    city: string;
    street?: string;
    neighborhood?: string;
  };
}

export const InspectionPanel: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [inspectionsList, setInspectionsList] = useState<InspectionRecord[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'new' | 'history'>('new');

  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [inspectionType, setInspectionType] = useState<'Check-in (Entrada)' | 'Check-out (Saída)'>('Check-in (Entrada)');
  const [loading, setLoading] = useState(true);
  
  // Mensagem suspensa (Toast)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Estado para novos itens personalizados
  const [newItemName, setNewItemName] = useState('');

  const [checklist, setChecklist] = useState([
    { item: 'Paredes e Pintura', status: 'Bom', notes: '' },
    { item: 'Pisos e Rodapés', status: 'Bom', notes: '' },
    { item: 'Instalações Elétricas (Tomadas e Interruptores)', status: 'Bom', notes: '' },
    { item: 'Instalações Hidráulicas (Torneiras e Descargas)', status: 'Bom', notes: '' },
    { item: 'Esquadrias, Portas e Janelas', status: 'Bom', notes: '' },
    { item: 'Vidros e Fechaduras', status: 'Bom', notes: '' }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: propData } = await supabase
        .from('properties')
        .select('id, title, city, state')
        .order('created_at', { ascending: false });

      if (propData && propData.length > 0) {
        setProperties(propData);
        setSelectedPropertyId(propData[0].id);
      }

      const { data: inspData, error: inspError } = await supabase
        .from('inspections')
        .select('*, properties(title, city, street, neighborhood)')
        .order('created_at', { ascending: false });

      if (!inspError && inspData) {
        setInspectionsList(inspData);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (index: number, status: string) => {
    const updated = [...checklist];
    updated[index].status = status;
    setChecklist(updated);
  };

  const handleNotesChange = (index: number, notes: string) => {
    const updated = [...checklist];
    updated[index].notes = notes;
    setChecklist(updated);
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    setChecklist([...checklist, { item: newItemName.trim(), status: 'Bom', notes: '' }]);
    setNewItemName('');
    showToast('Item adicionado ao checklist!', 'success');
  };

  const handleRemoveItem = (index: number) => {
    const updated = checklist.filter((_, idx) => idx !== index);
    setChecklist(updated);
  };

  const handleSaveInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!selectedPropertyId) {
        showToast('Selecione um imóvel para realizar a vistoria.', 'error');
        return;
      }

      const inspectionData = {
        property_id: selectedPropertyId,
        inspector_name: inspectorName || 'Vistoriador Responsável',
        inspection_type: inspectionType,
        checklist_items: checklist,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('inspections').insert([inspectionData]);
      
      if (error) throw error;

      showToast(`Laudo de ${inspectionType} salvo com sucesso!`, 'success');
      setInspectorName('');
      fetchData();
      setActiveSubTab('history');
    } catch (err: any) {
      console.error('Erro ao salvar vistoria:', err);
      showToast('Erro ao salvar no banco. Verifique a tabela inspections.', 'error');
    }
  };

  // Função para abrir a janela de impressão formatada em PDF do Laudo
  const handlePrintPdf = (insp: InspectionRecord) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Permita pop-ups no navegador para gerar o PDF.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Laudo de Vistoria - GoFérias</title>
        <style>
          body { font-family: Arial, sans-serif; color: #333; margin: 40px; line-height: 1.5; }
          .header { border-bottom: 2px solid #0f766e; padding-bottom: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .logo { font-size: 24px; font-weight: bold; color: #0f766e; }
          .badge { background: #ccfbf1; color: #115e59; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .info-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .info-box p { margin: 5px 0; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 13px; }
          th { background-color: #f1f5f9; color: #334155; text-transform: uppercase; font-size: 11px; }
          .status-bom { color: #047857; font-weight: bold; }
          .status-regular { color: #b45309; font-weight: bold; }
          .status-danificado { color: #b91c1c; font-weight: bold; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          .signature { margin-top: 60px; text-align: center; border-top: 1px solid #333; width: 250px; margin-left: auto; margin-right: auto; padding-top: 5px; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">GoFérias Marketplace</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Plataforma de Gestão de Imóveis de Temporada</div>
          </div>
          <div>
            <span class="badge">${insp.inspection_type || 'Vistoria'}</span>
          </div>
        </div>

        <div class="info-box">
          <p><strong>Imóvel:</strong> ${insp.properties?.title || 'Imóvel Registrado'}</p>
          <p><strong>Localidade:</strong> ${insp.properties?.city || ''}</p>
          <p><strong>Vistoriador Responsável:</strong> ${insp.inspector_name}</p>
          <p><strong>Data da Inspeção:</strong> ${new Date(insp.created_at).toLocaleString('pt-BR')}</p>
        </div>

        <h3>Itens Analisados e Checklist Técnico</h3>
        <table>
          <thead>
            <tr>
              <th>Item Analisado</th>
              <th>Estado / Condição</th>
              <th>Observações e Avarias</th>
            </tr>
          </thead>
          <tbody>
            ${(insp.checklist_items || []).map((item: any) => `
              <tr>
                <td><strong>${item.item}</strong></td>
                <td>
                  <span class="${item.status === 'Bom' ? 'status-bom' : item.status === 'Regular' ? 'status-regular' : 'status-danificado'}">
                    ${item.status}
                  </span>
                </td>
                <td>${item.notes || 'Nenhuma observação registrada.'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="signature">
          ${insp.inspector_name}
          <div style="font-size: 11px; color: #64748b;">Assinatura do Vistoriador</div>
        </div>

        <div class="footer">
          <span>GoFérias - Sistema Integrado de Gestão</span>
          <span>Emitido em ${new Date().toLocaleDateString('pt-BR')}</span>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400">A carregar painel de vistorias...</div>;
  }

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6 relative">
      
      {/* Mensagem Suspensa (Toast Flutuante) */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold text-white transition-all transform animate-bounce ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-6 gap-4">
        <div>
          <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Controlo Técnico
          </span>
          <h3 className="text-2xl font-extrabold text-slate-800 mt-2">Painel de Vistorias & Laudos</h3>
          <p className="text-xs text-slate-500 mt-1">Realize novas inspeções ou aceda ao histórico de laudos salvos.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('new')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'new' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            + Nova Vistoria
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'history' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 Histórico ({inspectionsList.length})
          </button>
        </div>
      </div>

      {activeSubTab === 'new' ? (
        <form onSubmit={handleSaveInspection} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tipo de Vistoria</label>
              <select
                value={inspectionType}
                onChange={(e) => setInspectionType(e.target.value as any)}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-white text-sm font-bold text-teal-800 focus:ring-2 focus:ring-teal-500"
              >
                <option value="Check-in (Entrada)">Check-in (Entrada)</option>
                <option value="Check-out (Saída)">Check-out (Saída)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Selecionar Imóvel</label>
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-white text-sm font-medium focus:ring-2 focus:ring-teal-500"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.city} - {p.state})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Vistoriador / Responsável</label>
              <input
                type="text"
                required
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                placeholder="Ex: Eduardo Vignardi"
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" /> Itens de Inspeção ({inspectionType})
            </h4>
            
            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-bold">
                  <tr>
                    <th className="p-4">Item Analisado</th>
                    <th className="p-4">Estado / Condição</th>
                    <th className="p-4">Observações e Avarias</th>
                    <th className="p-4 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {checklist.map((chk, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-bold text-slate-800">{chk.item}</td>
                      <td className="p-4">
                        <select
                          value={chk.status}
                          onChange={(e) => handleStatusChange(index, e.target.value)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border ${
                            chk.status === 'Bom' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            chk.status === 'Regular' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          <option value="Bom">Bom</option>
                          <option value="Regular">Regular</option>
                          <option value="Danificado">Danificado</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <input
                          type="text"
                          value={chk.notes}
                          onChange={(e) => handleNotesChange(index, e.target.value)}
                          placeholder="Descreva avarias ou detalhes..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                          title="Remover item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Formulário para Adicionar Novo Item Customizado */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Ex: Ar condicionado, Geladeira, Mobília da sala..."
                className="flex-1 px-4 py-3 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={handleAddCustomItem}
                className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-2xl font-bold transition flex items-center gap-2 text-sm shadow-sm"
              >
                <Plus className="w-4 h-4" /> Adicionar Item
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-2xl font-bold transition shadow-lg flex items-center gap-2 text-sm"
            >
              <Save className="w-4 h-4" /> Salvar Laudo de {inspectionType}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Laudos Salvos no Sistema</h4>
          
          {inspectionsList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              Nenhum laudo de vistoria gerado até o momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {inspectionsList.map((insp) => (
                <div key={insp.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        insp.inspection_type?.includes('Entrada') ? 'bg-teal-100 text-teal-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {insp.inspection_type || 'Vistoria'}
                      </span>
                      <span className="text-xs text-slate-400">📅 {new Date(insp.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                    <h5 className="text-base font-bold text-slate-800">{insp.properties?.title || 'Imóvel'}</h5>
                    <p className="text-xs text-slate-500">Vistoriador: <span className="font-semibold text-slate-700">{insp.inspector_name}</span></p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                      ✓ {insp.checklist_items?.length || 0} itens inspecionados
                    </span>
                    <button
                      onClick={() => handlePrintPdf(insp)}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2"
                      title="Gerar e Imprimir PDF"
                    >
                      <Printer className="w-4 h-4" /> Gerar PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};