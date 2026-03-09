'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart3, DollarSign, Users, Activity, Settings, CreditCard, LogOut,
  ChevronDown, Package, Mail, FileText, Zap, Menu, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  activeTab: 'overview' | 'pricing' | 'users' | 'analytics' | 'payment-details' | 'settings';
  onTabChange: (tab: 'overview' | 'pricing' | 'users' | 'analytics' | 'payment-details' | 'settings') => void;
  onLogout: () => void;
}

export default function AdminSidebar({ activeTab, onTabChange, onLogout }: SidebarProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();

  const menuSections = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      items: [
        { id: 'overview', label: 'Overview', icon: BarChart3 }
      ]
    },
    {
      id: 'products',
      label: 'Products & Pricing',
      icon: Package,
      items: [
        { id: 'pricing', label: 'Pricing Plans', icon: DollarSign },
        { id: 'payment-details', label: 'Payment Details', icon: CreditCard }
      ]
    },
    {
      id: 'users',
      label: 'Users & Subscriptions',
      icon: Users,
      items: [
        { id: 'users', label: 'User Management', icon: Users }
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: Activity,
      items: [
        { id: 'analytics', label: 'Analytics & Reports', icon: Activity }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      items: [
        { id: 'settings', label: 'Admin Settings', icon: Settings }
      ]
    }
  ];

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId as any);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Header Section */}
        <div className={`border-b border-slate-800 p-4 transition-all duration-300 ${collapsed ? 'flex justify-center' : ''}`}>
          {!collapsed && (
            <>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                TrustInn
              </h2>
              <p className="text-slate-500 text-xs mt-1">Admin Dashboard</p>
            </>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">
              T
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto ${collapsed ? 'px-2' : 'px-4'} py-6 space-y-2`}>
          {menuSections.map(section => {
            const SectionIcon = section.icon;
            const isExpanded = expandedSection === section.id;

            return (
              <div key={section.id}>
                <button
                  onClick={() => !collapsed && setExpandedSection(isExpanded ? null : section.id)}
                  title={collapsed ? section.label : ''}
                  className={`w-full flex items-center transition-all duration-200 ${
                    collapsed ? 'justify-center py-3' : 'justify-between px-4 py-3'
                  } text-slate-300 hover:bg-slate-800 rounded-lg group`}
                >
                  <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
                    <SectionIcon size={20} className="group-hover:text-blue-400 transition-colors" />
                    {!collapsed && <span className="text-sm font-medium">{section.label}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>

                {/* Submenu - Only show when not collapsed */}
                {!collapsed && isExpanded && (
                  <div className="ml-4 mt-2 space-y-1 animate-in fade-in duration-200">
                    {section.items.map(item => {
                      const ItemIcon = item.icon;
                      const isActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => onTabChange(item.id as any)}
                          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium shadow-lg shadow-blue-500/25'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                          }`}
                        >
                          <ItemIcon size={16} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Collapsed View - Icon only buttons */}
                {collapsed && expandedSection === section.id && (
                  <div className="mt-2 space-y-2">
                    {section.items.map(item => {
                      const ItemIcon = item.icon;
                      const isActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => onTabChange(item.id as any)}
                          title={item.label}
                          className={`w-full flex justify-center py-2 rounded-lg transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                          }`}
                        >
                          <ItemIcon size={16} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="border-t border-slate-800" />

        {/* Quick Links */}
        <div className={`${collapsed ? 'px-2' : 'px-4'} py-4 space-y-2`}>
          {!collapsed && (
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-3">
              Quick Links
            </h3>
          )}
          <Link
            href="/tools"
            title="View Website"
            className={`flex ${collapsed ? 'justify-center' : 'items-center gap-3'} px-4 py-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-all duration-200 group`}
          >
            <Zap size={18} className="group-hover:scale-110 transition-transform" />
            {!collapsed && <span className="text-sm">View Website</span>}
          </Link>
          <Link
            href="/contact"
            title="Contact"
            className={`flex ${collapsed ? 'justify-center' : 'items-center gap-3'} px-4 py-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-all duration-200 group`}
          >
            <Mail size={18} className="group-hover:scale-110 transition-transform" />
            {!collapsed && <span className="text-sm">Contact</span>}
          </Link>
        </div>

        {/* Logout & Collapse Toggle */}
        <div className={`border-t border-slate-800 ${collapsed ? 'px-2' : 'px-4'} py-4 space-y-2`}>
          <button
            onClick={onLogout}
            title="Logout"
            className={`w-full flex ${collapsed ? 'justify-center' : 'items-center gap-3'} px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition-all duration-200 font-medium group`}
          >
            <LogOut size={18} className="group-hover:scale-110 transition-transform" />
            {!collapsed && <span className="text-sm">Logout</span>}
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-full flex justify-center py-3 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-all duration-200"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800 flex items-center px-4 z-40">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="ml-4 text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          TrustInn Admin
        </h1>
      </div>

      {/* Mobile Sidebar Menu */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 mt-16"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-16 bottom-0 w-64 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 z-40 overflow-y-auto">
            <nav className="px-4 py-6 space-y-2">
              {menuSections.map(section => {
                const SectionIcon = section.icon;
                const isExpanded = expandedSection === section.id;

                return (
                  <div key={section.id}>
                    <button
                      onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg transition text-sm font-medium"
                    >
                      <div className="flex items-center gap-3">
                        <SectionIcon size={18} />
                        <span>{section.label}</span>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="ml-4 mt-2 space-y-1">
                        {section.items.map(item => {
                          const ItemIcon = item.icon;
                          const isActive = activeTab === item.id;

                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                onTabChange(item.id as any);
                                setMobileOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition ${
                                isActive
                                  ? 'bg-blue-600 text-white font-medium'
                                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <ItemIcon size={16} />
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Mobile Quick Links */}
            <div className="px-4 py-6 border-t border-slate-800">
              <Link
                href="/tools"
                className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition text-sm mb-2"
              >
                <Zap size={16} />
                <span>View Website</span>
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition text-sm mb-4"
              >
                <Mail size={16} />
                <span>Contact</span>
              </Link>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition text-sm font-medium"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
