import { Search, X } from 'lucide-react'

export default function SearchBar({ value, onChange, placeholder = 'Rechercher...', dark = false }) {
  return (
    <div className="relative">
      <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${dark ? 'text-[#4A5B73]' : 'text-gray-400'}`} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-11 pr-10 py-3 rounded-2xl transition-colors text-sm outline-none ${
          dark
            ? 'bg-[#0C1829] border border-[rgba(255,255,255,0.06)] text-white placeholder-[#4A5B73] focus:border-[#F6C344]'
            : 'bg-gray-50 border-2 border-gray-200 text-gray-900 focus:border-[#1A3FA0] focus:bg-white'
        }`}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className={`absolute right-3 top-1/2 -translate-y-1/2 btn-press ${dark ? 'text-[#4A5B73] hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
          aria-label="Effacer"
        >
          <X size={18} />
        </button>
      )}
    </div>
  )
}
