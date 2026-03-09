'use client';

import dynamic from 'next/dynamic';

/**
 * Tools Page - /tools Route
 * 
 * This page dynamically imports and renders the ToolsComponent.
 * The ToolsComponent contains the complete UI implementation for:
 * - Code upload and configuration
 * - Security tool execution (CBMC, JBMC, VeriSol, etc.)
 * - Terminal output display
 * - Analytics dashboard with charts and metrics
 * 
 * Location: src/components/ToolsComponent.tsx
 */

const ToolsComponent = dynamic(() => import('@/components/ToolsComponent'), {
  loading: () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontSize: 18,
      color: '#9ca3af',
      background: '#f8fafc',
      fontFamily: "'DM Mono', 'Fira Code', 'Cascadia Code', monospace"
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⟳</div>
        Loading Tools Interface...
      </div>
    </div>
  ),
  ssr: false
});

export default function ToolsPage() {
  return <ToolsComponent />;
}
