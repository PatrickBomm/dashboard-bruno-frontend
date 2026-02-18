import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Edit2, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import SortHeader from '../components/SortHeader';

interface Client {
  id: number;
  code: string;
  name: string;
  cpfCnpj: string | null;
  contact: string | null;
  email: string | null;
  address: string | null;
  _count?: { contracts: number };
}

interface FormData {
  name: string;
  cpfCnpj: string;
  contact: string;
  email: string;
  address: string;
}

const emptyForm: FormData = { name: '', cpfCnpj: '', contact: '', email: '', address: '' };

export default function Clients() {
  const { canEdit } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clients', { params: { search, page, limit: 20, sortBy, sortDir } });
      setClients(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, [page, search, sortBy, sortDir]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const openNew = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (c: Client) => {
    setForm({ name: c.name, cpfCnpj: c.cpfCnpj || '', contact: c.contact || '', email: c.email || '', address: c.address || '' });
    setEditingId(c.id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await api.put(`/clients/${editingId}`, form);
      } else {
        await api.post('/clients', form);
      }
      setModalOpen(false);
      fetchClients();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao salvar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover este cliente?')) return;
    try {
      await api.delete(`/clients/${id}`);
      fetchClients();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao remover');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">{total} clientes cadastrados</p>
        </div>
        {canEdit && (
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
            <Plus size={16} /> Novo Cliente
          </button>
        )}
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome, CPF/CNPJ, código ou e-mail..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <SortHeader label="Código" field="code" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="text-left" />
                <SortHeader label="Nome / Razão Social" field="name" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="text-left" />
                <SortHeader label="CPF / CNPJ" field="cpfCnpj" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="text-left hidden md:table-cell" />
                <SortHeader label="Contato" field="contact" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="text-left hidden lg:table-cell" />
                <SortHeader label="E-mail" field="email" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="text-left hidden lg:table-cell" />
                <th className="text-center py-3 px-4 text-gray-500 font-medium">Contratos</th>
                {canEdit && <th className="text-center py-3 px-4 text-gray-500 font-medium">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Carregando...</td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Nenhum cliente encontrado</td></tr>
              ) : (
                clients.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-gray-500">{c.code}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{c.name}</td>
                    <td className="py-3 px-4 hidden md:table-cell text-gray-600">{c.cpfCnpj || '-'}</td>
                    <td className="py-3 px-4 hidden lg:table-cell text-gray-600">{c.contact || '-'}</td>
                    <td className="py-3 px-4 hidden lg:table-cell text-gray-600">{c.email || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {c._count?.contracts || 0}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 size={15} /></button>
                          <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
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
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={16} /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { key: 'name', label: 'Nome / Razão Social', required: true },
                { key: 'cpfCnpj', label: 'CPF / CNPJ' },
                { key: 'contact', label: 'Contato' },
                { key: 'email', label: 'E-mail', type: 'email' },
                { key: 'address', label: 'Endereço' },
              ].map(({ key, label, required, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
                  <input
                    type={type || 'text'}
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                    required={required}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
