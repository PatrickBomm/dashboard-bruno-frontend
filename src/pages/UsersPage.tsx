import { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, X, Shield, ShieldCheck, Eye } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

const ROLES = [
  { value: 'ADMIN', label: 'Administrador', icon: ShieldCheck, color: 'bg-red-100 text-red-800' },
  { value: 'MANAGER', label: 'Gerente', icon: Shield, color: 'bg-indigo-100 text-indigo-800' },
  { value: 'VIEWER', label: 'Visualizador', icon: Eye, color: 'bg-gray-100 text-gray-800' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'VIEWER' });

  const fetchUsers = () => api.get('/users').then((r) => setUsers(r.data));
  useEffect(() => { fetchUsers(); }, []);

  const getRoleInfo = (role: string) => ROLES.find((r) => r.value === role) || ROLES[2];

  const openNew = () => { setForm({ name: '', email: '', password: '', role: 'VIEWER' }); setEditingId(null); setModalOpen(true); };
  const openEdit = (u: User) => { setForm({ name: u.name, email: u.email, password: '', role: u.role }); setEditingId(u.id); setModalOpen(true); };

  const handleSave = async () => {
    try {
      const data: any = { ...form };
      if (!data.password) delete data.password;
      if (editingId) {
        await api.put(`/users/${editingId}`, data);
      } else {
        if (!data.password) { alert('Senha obrigatória para novo usuário'); return; }
        await api.post('/users', data);
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao salvar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remover este usuário?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao remover');
    }
  };

  const toggleActive = async (u: User) => {
    try {
      await api.put(`/users/${u.id}`, { active: !u.active });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-sm text-gray-500">Gerenciamento de acesso ao sistema</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus size={16} /> Novo Usuário
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ROLES.map((role) => (
          <div key={role.value} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${role.color} rounded-lg flex items-center justify-center`}>
              <role.icon size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{role.label}</p>
              <p className="text-xl font-bold">{users.filter((u) => u.role === role.value).length}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Nome</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">E-mail</th>
              <th className="text-center py-3 px-4 text-gray-500 font-medium">Nível</th>
              <th className="text-center py-3 px-4 text-gray-500 font-medium">Status</th>
              <th className="text-center py-3 px-4 text-gray-500 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const roleInfo = getRoleInfo(u.role);
              return (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{u.email}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => toggleActive(u)} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${u.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                      {u.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(u.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha {editingId ? '(deixe vazio para manter)' : '*'}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nível de Acesso</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {form.role === 'ADMIN' && 'Acesso total: gerencia tudo, incluindo usuários'}
                  {form.role === 'MANAGER' && 'Pode criar/editar clientes, contratos e recebimentos'}
                  {form.role === 'VIEWER' && 'Apenas visualização e exportação de dados'}
                </p>
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
