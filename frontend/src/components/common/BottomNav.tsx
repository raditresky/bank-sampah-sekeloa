import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, Scale, Package, ReceiptText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const BottomNav: React.FC = () => {
  const { isAdmin } = useAuth();

  const navItems = [
    {
      to: '/',
      label: 'Beranda',
      icon: LayoutGrid,
    },
    ...(isAdmin
      ? [
          {
            to: '/timbangan',
            label: 'Timbangan',
            icon: Scale,
          },
        ]
      : []),
    {
      to: '/katalog',
      label: 'Katalog',
      icon: Package,
    },
    {
      to: '/riwayat',
      label: 'Riwayat',
      icon: ReceiptText,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 safe-bottom">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                  isActive
                    ? 'text-forest-900 font-bold scale-105'
                    : 'text-gray-400 hover:text-gray-600 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className={`w-5 h-5 transition ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-forest-900"></span>
                    )}
                  </div>
                  <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

