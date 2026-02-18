import { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, FileText, DollarSign, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Stats {
  totalClients: number;
  totalContracts: number;
  activeContracts: number;
  totalReceivables: number;
  overdueReceivables: number;
  paidThisMonth: number;
  pendingTotal: number;
  monthlyRevenue: number;
}

const COLORS = ['#4f46e5', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

function StatCard({ icon: Icon, label, value, color, sub }: { icon: any; label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [contractTypes, setContractTypes] = useState<any[]>([]);
  const [receivableStatus, setReceivableStatus] = useState<any[]>([]);
  const [topClients, setTopClients] = useState<any[]>([]);
  const [upcomingDue, setUpcomingDue] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/revenue-by-month'),
      api.get('/dashboard/contracts-by-type'),
      api.get('/dashboard/receivables-status'),
      api.get('/dashboard/top-clients'),
      api.get('/dashboard/upcoming-due'),
    ]).then(([s, r, c, rs, tc, ud]) => {
      setStats(s.data);
      setRevenueData(r.data);
      setContractTypes(c.data);
      setReceivableStatus(rs.data);
      setTopClients(tc.data);
      setUpcomingDue(ud.data);
    });
  }, []);

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Clientes" value={stats.totalClients} color="bg-indigo-600" />
        <StatCard icon={FileText} label="Contratos Ativos" value={stats.activeContracts} color="bg-cyan-600" sub={`${stats.totalContracts} total`} />
        <StatCard icon={DollarSign} label="Receita do Mês" value={formatCurrency(stats.monthlyRevenue)} color="bg-emerald-600" sub={`${stats.paidThisMonth} pagamentos`} />
        <StatCard icon={AlertTriangle} label="Vencidos" value={stats.overdueReceivables} color="bg-red-500" sub={formatCurrency(stats.pendingTotal) + ' pendente'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-600" />
            Receita Mensal
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} dot={{ fill: '#4f46e5', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Status dos Recebimentos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={receivableStatus} dataKey="value" nameKey="status" cx="50%" cy="50%" outerRadius={100} label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}>
                {receivableStatus.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Top 10 Clientes (Valor)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topClients} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Contratos por Tipo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={contractTypes} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={100} label={({ type, count }) => `${type} (${count})`}>
                {contractTypes.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-amber-500" />
          Próximos Vencimentos (30 dias)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Código</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Contrato</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Cliente</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Vencimento</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {upcomingDue.map((r: any) => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3 font-mono text-xs">{r.code}</td>
                  <td className="py-2 px-3">{r.contract?.internalId}</td>
                  <td className="py-2 px-3">{r.contract?.client?.name}</td>
                  <td className="py-2 px-3">{format(parseISO(r.dueDate), 'dd/MM/yyyy', { locale: ptBR })}</td>
                  <td className="py-2 px-3 text-right font-medium">{formatCurrency(r.value)}</td>
                </tr>
              ))}
              {upcomingDue.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Nenhum vencimento próximo</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
