import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Edit2, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import SortHeader from '../components/SortHeader';

interface Contract {
  id: number;
  code: string;
  internalId: string | null;
  signatureDate: string | null;
  contractType: string;
  value: number;
  startDate: string | null;
  dueDate: string | null;
  cancellationDate: string | null;
  propaganda: string | null;
  outdoorAddress1: string | null;
  outdoorAddress2: string | null;
  observation: string | null;
  client: { id: number; name: string; code: string };
  _count?: { receivables: number };
}

interface ContractTypeOption {
  id: number;
  name: string;
  label: string;
  active: boolean;
}

export default function Contracts() {
  const { canEdit } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({});
  const [clients, setClients] = useState<any[]>([]);
  const [contractTypes, setContractTypes] = useState<ContractTypeOption[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/contracts', { params: { search, page, limit: 20, contractType: filterType || undefined, sortBy, sortDir } });
      setContracts(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContracts(); }, [page, search, filterType, sortBy, sortDir]);
  useEffect(() => {
    api.get('/clients/all').then((r) => setClients(r.data));
    api.get('/contract-types').then((r) => setContractTypes(r.data));
  }, []);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const formatDate = (d: string | null) => d ? format(parseISO(d), 'dd/MM/yyyy') : '-';
  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getTypeLabel = (name: string) => {
    const found = contractTypes.find((t) => t.name === name);
    return found ? found.label : name;
  };

  const openNew = () => {
    setForm({ internalId: '', clientId: '', contractType: 'ANUAL', value: 0, signatureDate: '', startDate: '', dueDate: '', propaganda: '', outdoorAddress1: '', outdoorAddress2: '', observation: '' });
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (c: Contract) => {
    setForm({
      internalId: c.internalId || '',
      clientId: c.client.id,
      contractType: c.contractType,
      value: c.value,
      signatureDate: c.signatureDate ? c.signatureDate.slice(0, 10) : '',
      startDate: c.startDate ? c.startDate.slice(0, 10) : '',
      dueDate: c.dueDate ? c.dueDate.slice(0, 10) : '',
      propaganda: c.propaganda || '',
      outdoorAddress1: c.outdoorAddress1 || '',
      outdoorAddress2: c.outdoorAddress2 || '',
      observation: c.observation || '',
    });
    setEditingId(c.id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const data = {
        ...form,
        clientId: Number(form.clientId),
        value: Number(form.value),
        signatureDate: form.signatureDate ? new Date(form.signatureDate).toISOString() : null,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      };
      if (editingId) {
        await api.put(`/contracts/${editingId}`, data);
      } else {
        await api.post('/contracts', data);
      }
      setModalOpen(false);
      fetchContracts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao salvar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remover contrato e todos os recebimentos vinculados?')) return;
    try {
      await api.delete(`/contracts/${id}`);
      fetchContracts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao remover');
    }
  };

  const typeColor = (t: string) => {
    switch (t) {
      case 'ANUAL': return 'bg-indigo-100 text-indigo-800';
      case 'MENSAL': return 'bg-cyan-100 text-cyan-800';
      case 'SEMESTRAL': return 'bg-amber-100 text-amber-800';
      case 'TRIMESTRAL': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activeTypes = contractTypes.filter((t) => t.active);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contratos</h1>
          <p className="text-sm text-gray-500">{total} contratos cadastrados</p>
        </div>
        {canEdit && (
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
            <Plus size={16} /> Novo Contrato
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código, identificação ou cliente..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">Todos os tipos</option>
          {activeTypes.map((t) => <option key={t.name} value={t.name}>{t.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <SortHeader label="Código" field="code" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="text-left" />
                <SortHeader label="Identificação" field="internalId" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="text-left" />
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Cliente</th>
                <SortHeader label="Tipo" field="contractType" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="text-center" />
                <SortHeader label="Valor" field="value" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="text-right" />
                <SortHeader label="Início" field="startDate" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="text-center hidden md:table-cell" />
                <SortHeader label="Vencimento" field="dueDate" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="text-center hidden md:table-cell" />
                <th className="text-center py-3 px-4 text-gray-500 font-medium">Receb.</th>
                {canEdit && <th className="text-center py-3 px-4 text-gray-500 font-medium">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">Carregando...</td></tr>
              ) : contracts.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">Nenhum contrato encontrado</td></tr>
              ) : (
                contracts.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs text-gray-500">{c.code}</td>
                    <td className="py-3 px-4 font-medium">{c.internalId || '-'}</td>
                    <td className="py-3 px-4 text-gray-700">{c.client.name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColor(c.contractType)}`}>{getTypeLabel(c.contractType)}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(c.value)}</td>
                    <td className="py-3 px-4 text-center hidden md:table-cell text-gray-600">{formatDate(c.startDate)}</td>
                    <td className="py-3 px-4 text-center hidden md:table-cell text-gray-600">{formatDate(c.dueDate)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">{c._count?.receivables || 0}</span>
                    </td>
                    {canEdit && (
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={15} /></button>
                          <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-500">Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50"><ChevronLeft size={16} /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{editingId ? 'Editar Contrato' : 'Novo Contrato'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Identificação Interna</label>
                <input value={form.internalId} onChange={(e) => setForm({ ...form, internalId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required>
                  <option value="">Selecione...</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contrato</label>
                <select value={form.contractType} onChange={(e) => setForm({ ...form, contractType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  {activeTypes.map((t) => <option key={t.name} value={t.name}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                <input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Assinatura</label>
                <input type="date" value={form.signatureDate} onChange={(e) => setForm({ ...form, signatureDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Início Vigência</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Vencimento</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Propaganda</label>
                <input value={form.propaganda} onChange={(e) => setForm({ ...form, propaganda: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Outdoor 1</label>
                <input value={form.outdoorAddress1} onChange={(e) => setForm({ ...form, outdoorAddress1: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Outdoor 2</label>
                <input value={form.outdoorAddress2} onChange={(e) => setForm({ ...form, outdoorAddress2: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
                <textarea value={form.observation} onChange={(e) => setForm({ ...form, observation: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
