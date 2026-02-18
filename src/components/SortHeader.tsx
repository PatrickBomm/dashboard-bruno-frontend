import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface SortHeaderProps {
  label: string;
  field: string;
  currentSort: string;
  currentDir: 'asc' | 'desc';
  onSort: (field: string) => void;
  className?: string;
}

export default function SortHeader({ label, field, currentSort, currentDir, onSort, className = '' }: SortHeaderProps) {
  const isActive = currentSort === field;

  return (
    <th
      className={`py-3 px-4 text-gray-500 font-medium cursor-pointer select-none hover:text-gray-900 hover:bg-gray-100 transition-colors ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {isActive ? (
          currentDir === 'asc' ? <ArrowUp size={14} className="text-indigo-600" /> : <ArrowDown size={14} className="text-indigo-600" />
        ) : (
          <ArrowUpDown size={14} className="text-gray-300" />
        )}
      </div>
    </th>
  );
}
