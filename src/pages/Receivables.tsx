import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Edit2, Trash2, X, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import SortHeader from '../components/SortHeader';

interface Receivable {
  id: number;
  code: string;
  dueDate: string;
  paymentDate: string | null;
  value: number;
  contract: { id: number; code: string; internalId: string | null; client: { id: number; name: string } };
}

export default function Receivables() {
  const { canEdit } = useAuth();
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({});
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReceivables = async () => {
    setLoading(true);
    try {
      const res = await api.get('/receivables', { params: { search, page, limit: 20, status: statusFilter || undefined, startDate: startDate || undefined, endDate: endDate || undefined, sortBy, sortDir } });
      setReceivables(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReceivables(); }, [page, search, statusFilter, startDate, endDate, sortBy, sortDir]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  useEffect(() => {
    api.get('/contracts', { params: { limit: 999 } }).then((r) => setContracts(r.data.data));
  }, []);

  const formatDate = (d: string | null) => d ? format(parseISO(d), 'dd/MM/yyyy') : '-';
  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getStatus = (r: Receivable) => {
    if (r.paymentDate) return { label: 'Pago', color: 'bg-emerald-100 text-emerald-800' };
    if (new Date(r.dueDate) < new Date()) return { label: 'Vencido', color: 'bg-red-100 text-red-800' };
    return { label: 'Pendente', color: 'bg-amber-100 text-amber-800' };
  };

  const openNew = () => {
    setForm({ contractId: '', dueDate: '', paymentDate: '', value: 0 });
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (r: Receivable) => {
    setForm({
      contractId: r.contract.id,
      dueDate: r.dueDate.slice(0, 10),
      paymentDate: r.paymentDate ? r.paymentDate.slice(0, 10) : '',
      value: r.value,
    });
    setEditingId(r.id);
    setModalOpen(true);
  };

  const markAsPaid = async (id: number) => {
    try {
      await api.put(`/receivables/${id}`, { paymentDate: new Date().toISOString() });
      fetchReceivables();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro');
    }
  };

  const handleSave = async () => {
    try {
      const data = {
        contractId: Number(form.contractId),
        dueDate: new Date(form.dueDate).toISOString(),
        paymentDate: form.paymentDate ? new Date(form.paymentDate).toISOString() : null,
        value: Number(form.value),
      };
      if (editingId) {
        await api.put(`/receivables/${editingId}`, data);
      } else {
        await api.post('/receivables', data);
      }
      setModalOpen(false);
      fetchReceivables();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao salvar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remover este recebimento?')) return;
    try {
      await api.delete(`/receivables/${id}`);
      fetchReceivables();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao remover');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recebimentos</h1>
          <p className="text-sm text-gray-500">{total} recebimentos cadastrados</p>
        </div>
        {canEdit && (
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
            <Plus size={16} /> Novo Recebimento
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código, contrato ou cliente..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">Todos os status</option>
          <option value="paid">Pago</option>
          <option value="pending">Pendente</option>
          <option value="overdue">Vencido</option>
        </select>
        <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Data início" />
        <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Data fim" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <SortHeader label="Código" field="code" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="text-left" />
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Contrato</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium hidden md:table-cell">Cliente</th>
                <SortHeader label="Vencimento" field="dueDate" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="text-center" />
                <SortHeader label="Pagamento" field="paymentDate" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="text-center" />
                <SortHeader label="Valor" field="value" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="text-right" />
                <th className="text-center py-3 px-4 text-gray-500 font-medium">Status</th>
                {canEdit && <th className="text-center py-3 px-4 text-gray-500 font-medium">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Carregando...</td></tr>
              ) : receivables.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Nenhum recebimento encontrado</td></tr>
              ) : (
                receivables.map((r) => {
                  const status = getStatus(r);
                  return (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-xs text-gray-500">{r.code}</td>
                      <td className="py-3 px-4 font-medium">{r.contract?.internalId || r.contract?.code}</td>
                      <td className="py-3 px-4 hidden md:table-cell text-gray-700">{r.contract?.client?.name}</td>
                      <td className="py-3 px-4 text-center">{formatDate(r.dueDate)}</td>
                      <td className="py-3 px-4 text-center">{formatDate(r.paymentDate)}</td>
                      <td className="py-3 px-4 text-right font-medium">{formatCurrency(r.value)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
                      </td>
                      {canEdit && (
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            {!r.paymentDate && (
                              <button onClick={() => markAsPaid(r.id)} title="Marcar como pago" className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"><CheckCircle size={15} /></button>
                            )}
                            <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={15} /></button>
                            <button onClick={() => handleDelete(r.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{editingId ? 'Editar Recebimento' : 'Novo Recebimento'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contrato *</label>
                <select value={form.contractId} onChange={(e) => setForm({ ...form, contractId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required>
                  <option value="">Selecione...</option>
                  {contracts.map((c: any) => <option key={c.id} value={c.id}>{c.internalId || c.code} - {c.client?.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Vencimento *</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Pagamento</label>
                <input type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
                <input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />
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
