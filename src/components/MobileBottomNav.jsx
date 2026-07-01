import { useNavigate, useLocation } from 'react-router-dom'

export default function MobileBottomNav({ items }) {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'var(--dark-surface, #0C1829)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex justify-around items-center h-16 px-2">
        {items.map((item) => {
          const active = isActive(item.path)
          const Icon = item.icon
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center flex-1 gap-0.5 transition-all duration-200 active:scale-90"
            >
              {/* Pill arrondi derrière l'icône active */}
              {active && (
                <span
                  className="absolute inset-x-1.5 top-1.5 h-8 rounded-full"
                  style={{ background: 'rgba(242,194,0,0.15)' }}
                />
              )}
              <span className="relative">
                {/* Badge notification */}
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white z-10"
                    style={{ background: '#F87171' }}>
                    {item.badge}
                  </span>
                )}
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.8}
                  style={{ color: active ? '#F2C200' : '#4A5B73' }}
                />
              </span>
              <span
                className="text-[10px] font-medium relative"
                style={{ color: active ? '#F2C200' : '#4A5B73' }}
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
