import { useState } from 'react';
import api from '../services/api';
import { Download, FileText, FileSpreadsheet, Check } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ENTITY_CONFIG: Record<string, { label: string; endpoint: string; columns: { key: string; label: string }[] }> = {
  clients: {
    label: 'Clientes',
    endpoint: '/export/clients',
    columns: [
      { key: 'code', label: 'Código' },
      { key: 'name', label: 'Nome / Razão Social' },
      { key: 'cpfCnpj', label: 'CPF / CNPJ' },
      { key: 'contact', label: 'Contato' },
      { key: 'email', label: 'E-mail' },
      { key: 'address', label: 'Endereço' },
    ],
  },
  contracts: {
    label: 'Contratos',
    endpoint: '/export/contracts',
    columns: [
      { key: 'code', label: 'Código' },
      { key: 'internalId', label: 'Identificação Interna' },
      { key: 'signatureDate', label: 'Data Assinatura' },
      { key: 'clientName', label: 'Cliente' },
      { key: 'contractType', label: 'Tipo de Contrato' },
      { key: 'value', label: 'Valor' },
      { key: 'startDate', label: 'Data Início' },
      { key: 'dueDate', label: 'Data Vencimento' },
      { key: 'propaganda', label: 'Propaganda' },
      { key: 'outdoorAddress1', label: 'Endereço Outdoor 1' },
      { key: 'outdoorAddress2', label: 'Endereço Outdoor 2' },
      { key: 'observation', label: 'Observação' },
    ],
  },
  receivables: {
    label: 'Recebimentos',
    endpoint: '/export/receivables',
    columns: [
      { key: 'code', label: 'Código' },
      { key: 'contractName', label: 'Contrato' },
      { key: 'clientName', label: 'Cliente' },
      { key: 'dueDate', label: 'Data Vencimento' },
      { key: 'paymentDate', label: 'Data Pagamento' },
      { key: 'value', label: 'Valor' },
      { key: 'status', label: 'Status' },
    ],
  },
};

export default function Export() {
  const [entity, setEntity] = useState('clients');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');
  const [loading, setLoading] = useState(false);

  const config = ENTITY_CONFIG[entity];

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const selectAll = () => {
    if (selectedColumns.length === config.columns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(config.columns.map((c) => c.key));
    }
  };

  const handleExport = async () => {
    const cols = selectedColumns.length > 0 ? selectedColumns : config.columns.map((c) => c.key);
    setLoading(true);

    try {
      if (format === 'csv') {
        const res = await api.post(config.endpoint, { columns: cols, format: 'csv' }, { responseType: 'blob' });
        const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${entity}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const res = await api.post(config.endpoint, { columns: cols, format: 'json' });
        const { headers, rows } = res.data;

        const doc = new jsPDF({ orientation: cols.length > 5 ? 'landscape' : 'portrait' });
        doc.setFontSize(16);
        doc.text(`Nova Visão - ${config.label}`, 14, 15);
        doc.setFontSize(8);
        doc.text(`Exportado em ${new Date().toLocaleDateString('pt-BR')}`, 14, 22);

        autoTable(doc, {
          head: [headers],
          body: rows,
          startY: 28,
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 250, 252] },
        });

        doc.save(`${entity}.pdf`);
      }
    } catch (err) {
      alert('Erro ao exportar dados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Exportar Dados</h1>
        <p className="text-sm text-gray-500 mt-1">Selecione os dados e colunas que deseja exportar</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Dados para exportar</label>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(ENTITY_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => { setEntity(key); setSelectedColumns([]); }}
                className={`p-3 rounded-lg border-2 text-center text-sm font-medium transition-colors ${
                  entity === key ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Colunas</label>
            <button onClick={selectAll} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
              {selectedColumns.length === config.columns.length ? 'Desmarcar todas' : 'Selecionar todas'}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {config.columns.map((col) => {
              const isSelected = selectedColumns.includes(col.key) || selectedColumns.length === 0;
              return (
                <button
                  key={col.key}
                  onClick={() => toggleColumn(col.key)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm text-left transition-colors ${
                    isSelected
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                  }`}>
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                  {col.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Formato</label>
          <div className="flex gap-3">
            <button
              onClick={() => setFormat('csv')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                format === 'csv' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <FileSpreadsheet size={18} />
              CSV (Excel)
            </button>
            <button
              onClick={() => setFormat('pdf')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                format === 'pdf' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <FileText size={18} />
              PDF
            </button>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50"
        >
          <Download size={18} />
          {loading ? 'Exportando...' : 'Exportar'}
        </button>
      </div>
    </div>
  );
}
