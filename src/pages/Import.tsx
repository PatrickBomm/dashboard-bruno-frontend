import { useState, useRef } from 'react';
import api from '../services/api';
import {
  Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle,
  ArrowRight, RotateCcw, Eye, Loader2
} from 'lucide-react';

interface SheetPreview {
  headers: string[];
  rows: number;
  sample: any[][];
}

interface ImportResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

type Step = 'upload' | 'preview' | 'importing' | 'done';

export default function Import() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [sheets, setSheets] = useState<Record<string, SheetPreview>>({});
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [previewSheet, setPreviewSheet] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ImportResult>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', f);
      const res = await api.post('/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSheetNames(res.data.sheetNames);
      setSheets(res.data.sheets);
      setSelectedSheets(res.data.sheetNames);
      setPreviewSheet(res.data.sheetNames[0] || null);
      setStep('preview');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao processar arquivo');
    } finally {
      setLoading(false);
    }
  };

  const toggleSheet = (name: string) => {
    setSelectedSheets((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const handleImport = async () => {
    if (!file || selectedSheets.length === 0) return;
    setStep('importing');
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sheets', JSON.stringify(selectedSheets));
      const res = await api.post('/import/execute', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResults(res.data.results);
      setStep('done');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao importar dados');
      setStep('preview');
    }
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setSheetNames([]);
    setSheets({});
    setSelectedSheets([]);
    setPreviewSheet(null);
    setResults({});
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const sheetIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('cliente')) return 'text-indigo-600 bg-indigo-100';
    if (n.includes('contrato')) return 'text-cyan-600 bg-cyan-100';
    if (n.includes('recebimento')) return 'text-emerald-600 bg-emerald-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Importar Dados</h1>
        <p className="text-sm text-gray-500 mt-1">
          Importe dados de uma planilha Excel (.xlsx). Registros existentes serão atualizados, novos serão inseridos.
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-sm">
        {(['upload', 'preview', 'done'] as const).map((s, idx) => {
          const labels = ['Upload', 'Pré-visualização', 'Resultado'];
          const isActive = step === s || (step === 'importing' && s === 'done');
          const isPast = ['upload', 'preview', 'importing', 'done'].indexOf(step) > ['upload', 'preview', 'importing', 'done'].indexOf(s);
          return (
            <div key={s} className="flex items-center gap-2">
              {idx > 0 && <div className={`w-8 h-px ${isPast ? 'bg-indigo-400' : 'bg-gray-300'}`} />}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium ${
                isActive ? 'bg-indigo-100 text-indigo-700' :
                isPast ? 'bg-indigo-600 text-white' :
                'bg-gray-100 text-gray-400'
              }`}>
                {isPast ? <CheckCircle2 size={14} /> : <span className="w-4 text-center">{idx + 1}</span>}
                {labels[idx]}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2">
          <XCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors cursor-pointer"
            onClick={() => fileRef.current?.click()}
          >
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={40} className="text-indigo-500 animate-spin" />
                <p className="text-gray-600 font-medium">Processando arquivo...</p>
              </div>
            ) : (
              <>
                <Upload size={40} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-700 font-medium mb-1">Clique para selecionar ou arraste o arquivo</p>
                <p className="text-sm text-gray-400">Formatos aceitos: .xlsx, .xls (máx. 10MB)</p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Formato esperado da planilha:</p>
                <ul className="space-y-1 text-amber-700">
                  <li><strong>Clientes:</strong> ID, Nome/Razão Social, CPF/CNPJ, Contato, E-mail, Endereço</li>
                  <li><strong>Contratos:</strong> ID, Identificação, Data Assinatura, Cliente, Tipo, Valor, Início, Propaganda, Vencimento, ...</li>
                  <li><strong>Recebimentos:</strong> ID, Contrato, Data Vencimento, Data Pagamento, Valor</li>
                </ul>
                <p className="mt-2">Registros com código existente serão <strong>atualizados</strong>. Novos registros serão <strong>inseridos</strong>.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <FileSpreadsheet size={20} className="text-indigo-600" />
              <div>
                <p className="font-medium text-gray-900">{file?.name}</p>
                <p className="text-xs text-gray-400">{(file!.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>

            <p className="text-sm font-medium text-gray-700 mb-3">Selecione as abas para importar:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {sheetNames.map((name) => {
                const info = sheets[name];
                const selected = selectedSheets.includes(name);
                return (
                  <button
                    key={name}
                    onClick={() => toggleSheet(name)}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      selected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sheetIcon(name)}`}>
                        <FileSpreadsheet size={16} />
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                      }`}>
                        {selected && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                    </div>
                    <p className="font-medium text-gray-900 text-sm">{name}</p>
                    <p className="text-xs text-gray-500 mt-1">{info?.rows || 0} registros encontrados</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-200 bg-gray-50">
              <Eye size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Pré-visualização</span>
              <div className="flex gap-1 ml-auto">
                {sheetNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => setPreviewSheet(name)}
                    className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                      previewSheet === name
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {previewSheet && sheets[previewSheet] && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {sheets[previewSheet].headers.map((h, idx) => (
                        <th key={idx} className="text-left py-2 px-3 text-gray-500 font-medium whitespace-nowrap">
                          {h || `Col ${idx + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sheets[previewSheet].sample.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-gray-100 hover:bg-gray-50">
                        {sheets[previewSheet].headers.map((_, cIdx) => (
                          <td key={cIdx} className="py-2 px-3 text-gray-700 whitespace-nowrap max-w-[200px] truncate">
                            {row[cIdx] != null ? String(row[cIdx]) : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
                  Mostrando {sheets[previewSheet].sample.length} de {sheets[previewSheet].rows} registros
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button onClick={reset} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <RotateCcw size={16} />
              Escolher outro arquivo
            </button>
            <button
              onClick={handleImport}
              disabled={selectedSheets.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Importar {selectedSheets.length} aba{selectedSheets.length !== 1 ? 's' : ''}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step: Importing */}
      {step === 'importing' && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Loader2 size={48} className="mx-auto text-indigo-600 animate-spin mb-4" />
          <p className="text-lg font-medium text-gray-900">Importando dados...</p>
          <p className="text-sm text-gray-500 mt-1">
            Verificando registros existentes e processando {selectedSheets.join(', ')}
          </p>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="space-y-4">
          {Object.entries(results).map(([sheetName, result]) => {
            const total = result.inserted + result.updated;
            const hasErrors = result.errors.length > 0;
            return (
              <div key={sheetName} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    hasErrors ? 'bg-amber-100' : 'bg-emerald-100'
                  }`}>
                    {hasErrors ? <AlertTriangle size={20} className="text-amber-600" /> : <CheckCircle2 size={20} className="text-emerald-600" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{sheetName}</p>
                    <p className="text-sm text-gray-500">{total} registros processados</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-emerald-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-700">{result.inserted}</p>
                    <p className="text-xs text-emerald-600 font-medium">Inseridos</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-700">{result.updated}</p>
                    <p className="text-xs text-blue-600 font-medium">Atualizados</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-500">{result.skipped}</p>
                    <p className="text-xs text-gray-500 font-medium">Ignorados</p>
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-red-700 mb-1">Erros ({result.errors.length}):</p>
                    <ul className="text-xs text-red-600 space-y-0.5 max-h-32 overflow-y-auto">
                      {result.errors.slice(0, 20).map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                      {result.errors.length > 20 && (
                        <li className="font-medium">... e mais {result.errors.length - 20} erros</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}

          <button onClick={reset} className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
            <RotateCcw size={16} />
            Nova importação
          </button>
        </div>
      )}
    </div>
  );
}
