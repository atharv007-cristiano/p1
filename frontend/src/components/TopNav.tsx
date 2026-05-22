import React from 'react';
import { useStore } from '../store';
import { 
  IconShieldCheck, 
  IconBell, 
  IconSun, 
  IconMoon,
  IconFingerprint,
  IconDeviceAnalytics,
  IconApi,
  IconHistory,
  IconSettings
} from '@tabler/icons-react';
import { cn } from './shared';

export const TopNav: React.FC = () => {
  const { activeTab, setActiveTab, theme, setTheme, alerts } = useStore();

  const unreadAlerts = alerts.filter(a => !a.read).length;

  const navItems = [
    { id: 'detect', label: 'Detect', icon: IconFingerprint },
    { id: 'history', label: 'Audit Trail', icon: IconHistory },
    { id: 'alerts', label: 'Alert Centre', icon: IconBell },
    { id: 'api', label: 'API Reference', icon: IconApi },
    { id: 'settings', label: 'Configuration', icon: IconSettings },
  ] as const;

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-40 w-full h-[60px] bg-white/80 dark:bg-[#111111]/80 backdrop-blur-md border-b border-[#E5E5E5]/60 dark:border-[#2C2C2C]/60 flex items-center justify-between px-6 transition-colors duration-200">
      {/* Brand Logo & Wordmark */}
      <div className="flex items-center gap-2 select-none">
        <IconShieldCheck className="w-6 h-6 text-[#0C447C] dark:text-blue-400 stroke-[1.5]" />
        <div className="flex flex-col">
          <span className="text-sm font-medium tracking-tight text-[#111111] dark:text-white uppercase leading-none">DeepShield</span>
          <span className="text-[9px] text-[#888888] tracking-widest font-medium uppercase mt-0.5">Beyond the illusion</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="hidden md:flex items-center gap-1.5 h-full">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'relative flex items-center gap-1.5 px-3 py-1.5 rounded-elem text-xs transition-colors select-none font-medium',
                isActive 
                  ? 'bg-[#0C447C]/10 text-[#0C447C] dark:bg-[#0C447C]/20 dark:text-[#E0E0E0]' 
                  : 'text-[#666666] dark:text-[#A0A0A0] hover:text-[#111111] dark:hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 stroke-[1.5]" />
              {item.label}
              
              {item.id === 'alerts' && unreadAlerts > 0 && (
                <span className="absolute -top-1.5 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#A32D2D] text-[9px] font-medium text-white ring-2 ring-white dark:ring-[#111111]">
                  {unreadAlerts}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Action / Controls Group */}
      <div className="flex items-center gap-4">
        {/* Live Status Indicator */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-pill bg-[#0F6E56]/10 border border-[#0F6E56]/20">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F6E56] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#0F6E56]"></span>
          </span>
          <span className="text-[10px] text-[#0F6E56] font-medium uppercase tracking-wider select-none">Live</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle active theme"
          className="p-2 rounded-elem hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-thin-gray transition-all text-[#666666] dark:text-[#A0A0A0]"
        >
          {theme === 'dark' ? (
            <IconSun className="w-4 h-4 stroke-[1.5]" />
          ) : (
            <IconMoon className="w-4 h-4 stroke-[1.5]" />
          )}
        </button>

        {/* Notification Bell (Mobile fallback indicator) */}
        <button
          onClick={() => setActiveTab('alerts')}
          className="relative p-2 md:hidden rounded-elem hover:bg-black/5 dark:hover:bg-white/5 text-[#666666] dark:text-[#A0A0A0]"
        >
          <IconBell className="w-4 h-4 stroke-[1.5]" />
          {unreadAlerts > 0 && (
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#A32D2D]"></span>
          )}
        </button>

        {/* User Profile Badge */}
        <div className="h-7 w-7 rounded-full bg-[#0C447C]/10 border border-[#0C447C]/20 flex items-center justify-center select-none cursor-pointer hover:bg-[#0C447C]/20 transition-all">
          <span className="text-[10px] font-medium text-[#0C447C] dark:text-blue-400">SA</span>
        </div>
      </div>
    </header>
  );
};
