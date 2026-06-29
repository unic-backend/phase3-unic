import { useNavigate, useLocation } from 'react-router-dom'

// Barre de navigation mobile premium (style Linear/Revolut)
// Les icônes sont passées en props (composants Lucide)
export default function MobileBottomNav({ items }) {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => location.pathname === path
  const activeIndex = items.findIndex((item) => isActive(item.path))
  const n = items.length

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative flex justify-around items-stretch h-16">
        {/* Indicateur unique qui glisse d'un onglet à l'autre (calcul 100% pur CSS) */}
        {activeIndex >= 0 && (
          <span
            className="absolute top-0 h-1 rounded-full bg-[#F2C200] transition-transform duration-300 ease-out"
            style={{
              width: `${100 / n}%`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
        )}
        {items.map((item) => {
          const active = isActive(item.path)
          const Icon = item.icon
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center flex-1 gap-1 transition-all duration-200 active:scale-90"
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.4 : 1.8}
                className={`transition-colors duration-200 ${active ? 'text-[#1A3FA0]' : 'text-gray-400'}`}
              />
              <span
                className={`text-[10px] font-medium transition-colors duration-200 ${active ? 'text-[#1A3FA0]' : 'text-gray-400'}`}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
