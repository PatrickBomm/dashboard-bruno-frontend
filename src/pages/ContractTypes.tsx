import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit2, Trash2, X, Tag } from 'lucide-react';

interface ContractType {
  id: number;
  name: string;
  label: string;
  active: boolean;
  createdAt: string;
}

export default function ContractTypes() {
  const { isAdmin } = useAuth();
  const [types, setTypes] = useState<ContractType[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', label: '' });
  const [contractCounts, setContractCounts] = useState<Record<string, number>>({});

  const fetchTypes = async () => {
    const res = await api.get('/contract-types');
    setTypes(res.data);
  };

  const fetchCounts = async () => {
    try {
      const res = await api.get('/contracts', { params: { limit: 1 } });
      const allContracts = await api.get('/contracts', { params: { limit: res.data.total } });
      const counts: Record<string, number> = {};
      allContracts.data.data.forEach((c: any) => {
        counts[c.contractType] = (counts[c.contractType] || 0) + 1;
      });
      setContractCounts(counts);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchTypes(); fetchCounts(); }, []);

  const openNew = () => { setForm({ name: '', label: '' }); setEditingId(null); setModalOpen(true); };
  const openEdit = (t: ContractType) => { setForm({ name: t.name, label: t.label }); setEditingId(t.id); setModalOpen(true); };

  const handleSave = async () => {
    try {
      if (editingId) {
        await api.put(`/contract-types/${editingId}`, { label: form.label });
      } else {
        if (!form.name || !form.label) { alert('Nome e rótulo são obrigatórios'); return; }
        await api.post('/contract-types', form);
      }
      setModalOpen(false);
      fetchTypes();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao salvar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remover este tipo de contrato?')) return;
    try {
      await api.delete(`/contract-types/${id}`);
      fetchTypes();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao remover');
    }
  };

  const toggleActive = async (t: ContractType) => {
    try {
      await api.put(`/contract-types/${t.id}`, { active: !t.active });
      fetchTypes();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro');
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tipos de Contrato</h1>
          <p className="text-sm text-gray-500">Gerencie os tipos disponíveis para contratos</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus size={16} /> Novo Tipo
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Nome (chave)</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Rótulo (exibição)</th>
              <th className="text-center py-3 px-4 text-gray-500 font-medium">Contratos</th>
              <th className="text-center py-3 px-4 text-gray-500 font-medium">Status</th>
              <th className="text-center py-3 px-4 text-gray-500 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {types.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Nenhum tipo cadastrado</td></tr>
            ) : (
              types.map((t) => (
                <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-indigo-500" />
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{t.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">{t.label}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {contractCounts[t.name] || 0}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => toggleActive(t)} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${t.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                      {t.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(t)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={15} /></button>
                      {isAdmin && (
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{editingId ? 'Editar Tipo' : 'Novo Tipo de Contrato'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome (chave) *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  placeholder="Ex: BIMESTRAL"
                  disabled={!!editingId}
                />
                {!editingId && (
                  <p className="text-xs text-gray-400 mt-1">Identificador único, será convertido para maiúsculas</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rótulo (exibição) *
                </label>
                <input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: Bimestral"
                />
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
