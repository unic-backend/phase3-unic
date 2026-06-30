import { ArrowUpDown } from 'lucide-react'

export default function SortSelect({ value, onChange, options, dark = false }) {
  return (
    <div className="relative inline-block">
      <ArrowUpDown size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${dark ? 'text-[#4A5B73]' : 'text-gray-400'}`} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`pl-8 pr-3 py-2 rounded-2xl text-sm font-semibold appearance-none cursor-pointer outline-none ${
          dark
            ? 'bg-[#0C1829] border border-[rgba(255,255,255,0.06)] text-[#8899B4] focus:border-[#F6C344]'
            : 'bg-white border-2 border-gray-200 text-gray-600 focus:border-[#1A3FA0]'
        }`}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
