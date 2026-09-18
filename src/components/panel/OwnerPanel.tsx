import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { StatCard } from './StatCard';
import { PropertyRow } from './PropertyRow';
import { PricingCard } from './PricingCard';
import { AuthModal } from './AuthModal';
import { InspectionPanel } from './InspectionPanel';
import { Building2, DollarSign, Percent, Plus, LogOut, User as UserIcon, X, Upload, Calendar, UserCheck, ClipboardCheck, LayoutDashboard } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  location: string;
  current_price: number;
  suggested_price: number;
  occupancy_rate: number;
  monthly_revenue: number;
  status: 'active' | 'maintenance';
  image_url?: string;
  price?: number;
}

export const OwnerPanel: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Estado para alternar entre as abas do painel
  const [activeTab, setActiveTab] = useState<'properties' | 'inspection'>('properties');

  // Campos do formulário de cadastro de imóvel e endereço
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState('Apartamento');
  
  // Endereço detalhado
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('Ingleses');
  const [city, setCity] = useState('Florianópolis');
  const [state, setState] = useState('SC');

  // Características
  const [bedrooms, setBedrooms] = useState('2');
  const [bathrooms, setBathrooms] = useState('1');
  const [price, setPrice] = useState('');
  
  // Múltiplas fotos
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // Verifica usuário logado
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProperties(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProperties(session.user.id);
      } else {
        setProperties([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Busca imóveis do usuário no Supabase
  const fetchProperties = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', userId);

    if (error) {
      console.error('Erro ao buscar imóveis:', error);
    } else {
      const formatted = (data || []).map((item: any) => {
        const itemPrice = item.price || 350;
        const occupancy = item.occupancy_rate || 85;
        const calculatedRevenue = Math.round(itemPrice * 30 * (occupancy / 100));
        return {
          ...item,
          current_price: itemPrice,
          suggested_price: item.suggested_price || Math.round(itemPrice * 1.2),
          occupancy_rate: occupancy,
          monthly_revenue: item.monthly_revenue || calculatedRevenue,
          status: item.status || 'active'
        };
      });
      setProperties(formatted);
    }
    setLoading(false);
  };

  // Manipula múltiplos arquivos selecionados de uma vez
  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newImageUrls = filesArray.map(file => URL.createObjectURL(file));
      setSelectedImages(prev => [...prev, ...newImageUrls]);
    }
  };

  // Remove foto específica da pré-visualização
  const handleRemoveImage = (indexToRemove: number) => {
    setSelectedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // Adiciona novo imóvel evitando colunas inexistentes na cache do banco
  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const priceNum = parseFloat(price) || 350;
    const fullLocation = street 
      ? `${street}, ${number ? number + ' - ' : ''}${neighborhood}, ${city} - ${state}`
      : `${neighborhood}, ${city} - ${state}`;
      
    const finalImage = selectedImages.length > 0 
      ? selectedImages[0] 
      : 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80';

    const propertyData: any = {
      owner_id: user.id,
      title: `${propertyType} - ${title}`,
      location: fullLocation,
      price: priceNum,
      bedrooms: parseInt(bedrooms) || 1,
      bathrooms: parseInt(bathrooms) || 1,
      image_url: finalImage,
      status: 'active'
    };

    const { error } = await supabase.from('properties').insert([propertyData]);

    if (error) {
      alert('Erro ao cadastrar imóvel: ' + error.message);
    } else {
      setTitle('');
      setStreet('');
      setNumber('');
      setPrice('');
      setSelectedImages([]);
      setShowAddModal(false);
      fetchProperties(user.id);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Cálculos dinâmicos consolidados para o dashboard financeiro
  const totalProperties = properties.length;
  const activeProperties = properties.filter((p) => p.status === 'active').length;
  const maintenanceProperties = properties.filter((p) => p.status === 'maintenance').length;
  
  const totalRevenue = properties.reduce((acc, curr) => {
    const p = curr.price || curr.current_price || 350;
    const occ = curr.occupancy_rate || 85;
    return acc + Math.round(p * 30 * (occ / 100));
  }, 0);

  const avgOccupancy = totalProperties > 0 
    ? Math.round(properties.reduce((acc, curr) => acc + Number(curr.occupancy_rate || 85), 0) / totalProperties) 
    : 0;

  // Mock inteligente de próximas reservas baseado nos imóveis cadastrados
  const mockReservations = properties.slice(0, 3).map((prop, index) => {
    const guests = ['Carlos Eduardo Silva', 'Mariana Costa', 'Roberto de Souza', 'Fernanda Lima'];
    const checkIns = ['Hoje, 14:00', 'Amanhã, 15:00', '22/09/2026', '25/09/2026'];
    const nights = [3, 5, 2, 7];
    const daily = prop.price || prop.current_price || 350;
    
    return {
      id: `res-${index}-${prop.id}`,
      propertyTitle: prop.title,
      guestName: guests[index % guests.length],
      checkIn: checkIns[index % checkIns.length],
      nights: nights[index % nights.length],
      totalValue: daily * nights[index % nights.length],
      status: index === 0 ? 'Check-in Hoje' : 'Confirmada'
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Barra Superior do Painel com Seletor de Abas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Painel do Proprietário</h1>
          <p className="text-slate-500 text-sm">
            {user ? `Conectado como: ${user.email}` : 'Gerencie seus imóveis e acompanhe a precificação por IA.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {user && (
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('properties')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'properties' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" /> Gestão & IA
              </button>
              <button
                onClick={() => setActiveTab('inspection')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'inspection' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ClipboardCheck className="w-4 h-4" /> Vistorias
              </button>
            </div>
          )}

          {user ? (
            <>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-medium transition shadow-md shadow-teal-600/10 text-sm"
              >
                <Plus className="w-4 h-4" /> Adicionar Imóvel
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium transition text-sm"
                title="Sair da Conta"
              >
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-medium transition shadow-md shadow-teal-600/10"
            >
              <UserIcon className="w-4 h-4" /> Entrar / Cadastrar
            </button>
          )}
        </div>
      </div>

      {!user ? (
        <div className="bg-gradient-to-r from-teal-900 to-slate-900 rounded-3xl p-10 text-white text-center space-y-6 shadow-xl">
          <h2 className="text-3xl font-bold">Faça login para gerenciar sua carteira de imóveis</h2>
          <p className="text-teal-200 max-w-xl mx-auto">
            Acompanhe a ocupação em tempo real, visualize relatórios financeiros e utilize nossa IA de precificação integrada ao banco de dados.
          </p>
          <button
            onClick={() => setIsAuthOpen(true)}
            className="bg-white text-teal-900 hover:bg-teal-50 font-bold px-8 py-3 rounded-xl transition shadow-lg"
          >
            Acessar Minha Conta Agora
          </button>
        </div>
      ) : activeTab === 'inspection' ? (
        /* Aba do Módulo de Vistorias */
        <InspectionPanel />
      ) : (
        /* Aba Principal de Gestão e Imóveis */
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Taxa de Ocupação Média"
              value={`${avgOccupancy}%`}
              trend="+4,2%"
              trendUp={true}
              icon={Percent}
              description="vs. mês anterior"
            />
            <StatCard
              title="Receita Total do Mês"
              value={`R$ ${totalRevenue.toLocaleString('pt-BR')}`}
              trend="+12,8%"
              trendUp={true}
              icon={DollarSign}
              description="Projetada com base nas diárias"
            />
            <StatCard
              title="Imóveis Ativos"
              value={activeProperties}
              trend={`${maintenanceProperties} em manutenção`}
              trendUp={false}
              icon={Building2}
              description={`Total de ${totalProperties} cadastrados`}
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Precificação Inteligente por IA</h2>
            {properties.length > 0 ? (
              <PricingCard 
                property={properties[0]} 
                onPriceUpdated={() => user && fetchProperties(user.id)} 
              />
            ) : (
              <div className="bg-white p-8 rounded-2xl text-center border border-dashed border-slate-200 text-slate-500">
                Nenhum imóvel cadastrado ainda. Clique em "Adicionar Imóvel" acima para começar.
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Seus Imóveis Cadastrados</h2>
            {loading ? (
              <p className="text-slate-400 py-4 text-center">Carregando imóveis...</p>
            ) : properties.length === 0 ? (
              <p className="text-slate-400 py-4 text-center">Você ainda não possui imóveis cadastrados no sistema.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {properties.map((prop) => (
                  <PropertyRow 
                    key={prop.id} 
                    property={prop} 
                    onUpdated={() => user && fetchProperties(user.id)} 
                  />
                ))}
              </div>
            )}
          </div>

          {properties.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Próximas Reservas & Operação</h2>
                  <p className="text-xs text-slate-500">Acompanhe os próximos check-ins e o fluxo de hóspedes na sua carteira</p>
                </div>
                <span className="bg-teal-50 text-teal-700 text-xs font-bold px-3 py-1 rounded-full border border-teal-100">
                  {mockReservations.length} Confirmadas
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {mockReservations.map((res) => (
                  <div key={res.id} className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl space-y-3 hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        res.status === 'Check-in Hoje' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {res.status}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{res.nights} noites</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{res.propertyTitle}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" /> {res.guestName}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" /> {res.checkIn}
                      </span>
                      <span className="font-bold text-slate-800">R$ {res.totalValue.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de Adicionar Imóvel */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Cadastrar Novo Imóvel</h3>
            <form onSubmit={handleAddProperty} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tipo de Imóvel</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 bg-white text-sm"
                  >
                    <option value="Apartamento">Apartamento</option>
                    <option value="Casa">Casa</option>
                    <option value="Cobertura">Cobertura</option>
                    <option value="Chalé">Chalé</option>
                    <option value="Kitnet">Kitnet / Studio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Título / Descrição</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Vista para o Mar"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 text-sm"
                  />
                </div>
              </div>

              {/* Seção de Endereço */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Endereço do Imóvel</span>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Rua / Avenida</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Ex: R. das Gaivotas"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Número</label>
                    <input
                      type="text"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="Ex: 1200"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Bairro</label>
                    <input
                      type="text"
                      required
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Ingleses"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Cidade</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 bg-white text-sm"
                    >
                      <option value="Florianópolis">Florianópolis</option>
                      <option value="Balneário Camboriú">Balneário Camboriú</option>
                      <option value="Bombinhas">Bombinhas</option>
                      <option value="Itapema">Itapema</option>
                      <option value="Curitiba">Curitiba</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Estado</label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 bg-white text-sm"
                    >
                      <option value="SC">SC</option>
                      <option value="PR">PR</option>
                      <option value="RS">RS</option>
                      <option value="SP">SP</option>
                      <option value="RJ">RJ</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Quartos, Banheiros e Preço */}
              <div className="border-t border-slate-100 pt-3 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Quartos</label>
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 bg-white text-sm"
                  >
                    <option value="1">1 Quarto</option>
                    <option value="2">2 Quartos</option>
                    <option value="3">3 Quartos</option>
                    <option value="4">4+ Quartos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Banheiros</label>
                  <select
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 bg-white text-sm"
                  >
                    <option value="1">1 Banheiro</option>
                    <option value="2">2 Banheiros</option>
                    <option value="3">3+ Banheiros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Diária (R$)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="350"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 text-sm"
                  />
                </div>
              </div>

              {/* Seção Múltiplas Fotos */}
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <label className="block text-xs font-bold text-teal-700 uppercase tracking-wider">Fotos do Imóvel (Múltiplas)</label>
                
                <div className="flex flex-wrap gap-2">
                  {selectedImages.map((imgUrl, index) => (
                    <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                      <img src={imgUrl} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-80 hover:opacity-100 transition shadow"
                        title="Remover foto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl cursor-pointer bg-slate-50 hover:bg-teal-50/50 transition text-slate-500 hover:text-teal-600">
                    <Upload className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium">Adicionar</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImagesChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-slate-400">Selecione várias fotos de uma vez segurando Ctrl ou arrastando.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-medium transition text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl font-medium transition shadow-md shadow-teal-600/20 text-sm"
                >
                  Salvar Imóvel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};