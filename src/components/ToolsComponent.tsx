'use client';

import { useState, useEffect, useRef, Suspense, lazy, ReactNode } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Code2 } from 'lucide-react';
import { FaChartLine, FaChartBar, FaJava, FaSpinner, FaUser } from 'react-icons/fa';
import { SiSolidity, SiPython } from 'react-icons/si';
import { FiEye } from 'react-icons/fi';

// ─── Real component imports ──────────────────────────────────────────────────
import { initializeAuth, getStoredSessionToken, validateToken, consumeTrial,
  clearSession, redirectToNitMiner, fetchUserFromDB, fetchTrialCountByEmail } from '@/lib/jwtAuth';
import NoAccessError from '@/components/NoAccessError';
import { toolsPageTourSteps } from '@/lib/tourSteps';

const CodeEditor   = lazy(() => import('@/components/CodeEditor'));
const TourGuide    = lazy(() => import('@/components/TourGuide'));
const AuthModal    = lazy(() => import('@/components/AuthModals').then(m => ({ default: m.AuthModal })));
const SessionCheckModal = lazy(() => import('@/components/AuthModals').then(m => ({ default: m.SessionCheckModal })));
const OTPVerificationModal = lazy(() => import('@/components/OTPModal').then(m => ({ default: m.OTPVerificationModal })));

// ─── No client-side timeouts ─────────────────────────────────────────────────
// Code execution works like terminal: runs to completion or until server times out.
// Server has 5-minute max (maxDuration = 300s in API routes).
// No artificial delays or misleading timeout messages.

// ─── Analytics Drawer ─────────────────────────────────────────────────────────
function AnalyticsDrawer({
  open, onClose, chartData, chartType, setChartType,
  visualizationTitle, loading, downloadChartRef, onDownloadChart,
}: {
  open: boolean; onClose: () => void; chartData: any[]; chartType: string;
  setChartType: (type: string) => void; visualizationTitle: string;
  loading: boolean; downloadChartRef: any; onDownloadChart: () => void;
}) {
  const hasData = chartData && chartData.length > 0 &&
    !(chartData.length === 1 && chartData[0].name === '✅ Execution Complete');

  return (
    <>
      <div onClick={onClose} style={{
        position:'fixed', inset:0, zIndex:50,
        background:'rgba(15,23,42,0.35)', backdropFilter:'blur(3px)',
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
        transition:'opacity 0.3s ease',
      }} />
      <div style={{
        position:'fixed', top:0, right:0, bottom:0,
        width:'min(42%, 560px)', zIndex:51,
        background:'#ffffff', borderLeft:'1.5px solid #e5e7eb',
        boxShadow:'-8px 0 40px rgba(0,0,0,0.12)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition:'transform 0.38s cubic-bezier(0.16,1,0.3,1)',
        display:'flex', flexDirection:'column', overflow:'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding:'18px 24px 14px', borderBottom:'1.5px solid #f1f5f9',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          flexShrink:0, background:'linear-gradient(135deg,#f8fafc 0%,#f0f4ff 100%)',
        }}>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <div style={{
              width:36, height:36, borderRadius:10,
              background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:16,
              boxShadow:'0 2px 12px rgba(99,102,241,0.3)',
            }}>📊</div>
            <div>
              <div style={{fontSize:15, fontWeight:800, color:'#111827', letterSpacing:'-0.02em', wordBreak:'break-word', whiteSpace:'normal'}}>
                {visualizationTitle || 'Analysis Results'}
              </div>
              <div style={{fontSize:11, color:'#9ca3af', marginTop:1}}>Execution visualization</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width:32, height:32, borderRadius:8, background:'#f1f5f9',
            border:'1.5px solid #e5e7eb', color:'#6b7280', fontSize:20,
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{flex:1, overflowY:'auto', padding:'24px 32px', display:'flex', flexDirection:'column', gap:20, background:'#fafbff'}}>
          {!hasData ? (
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, gap:12, paddingTop:60}}>
              <div style={{fontSize:40}}>📈</div>
              <div style={{fontSize:14, fontWeight:700, color:'#374151'}}>No data to visualize</div>
              <div style={{fontSize:12, color:'#9ca3af', textAlign:'center'}}>Execute a security tool first, then view the analytics here.</div>
            </div>
          ) : (
            <>
              {/* Chart Type Toggle */}
              <div style={{display:'flex', gap:6, background:'#f1f5f9', borderRadius:10, padding:4}}>
                {['pie','bar'].map(t => (
                  <button key={t} onClick={() => setChartType(t)} style={{
                    flex:1, padding:'7px 0', borderRadius:8,
                    background: chartType===t ? '#ffffff' : 'transparent',
                    border: chartType===t ? '1.5px solid #c7d2fe' : '1.5px solid transparent',
                    color: chartType===t ? '#4f46e5' : '#9ca3af',
                    fontSize:12, fontWeight:700, cursor:'pointer',
                    boxShadow: chartType===t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    transition:'all 0.15s',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  }}>
                    {t === 'pie' ? <><FaChartLine size={14} /> Pie Chart</> : <><FaChartBar size={14} /> Bar Chart</>}
                  </button>
                ))}
              </div>

              {/* 100% metric cards */}
              {chartData.filter(d => d.value === 100).length > 0 && (
                <div style={{display:'flex', flexDirection:'column', gap:12, marginBottom:4}}>
                  {chartData.filter(d => d.value === 100).map((item, i) => (
                    <div key={i} style={{background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', border:'1.5px solid #bbf7d0', borderRadius:12, padding:'18px 20px'}}>
                      <div style={{fontSize:12, color:'#15803d', fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em'}}>{item.name}</div>
                      <div style={{fontSize:36, fontWeight:800, color:'#16a34a', lineHeight:1}}>100%</div>
                      <div style={{marginTop:12, height:8, background:'#dcfce7', borderRadius:99, overflow:'hidden'}}>
                        <div style={{width:'100%', height:'100%', background:'#16a34a', borderRadius:99}} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Main Chart */}
              {chartData.filter(d => d.value !== 100).length > 0 && (
                <div style={{background:'#ffffff', border:'1.5px solid #e5e7eb', borderRadius:16, padding:'18px 12px', boxShadow:'0 1px 6px rgba(0,0,0,0.05)'}}>
                  <div style={{fontSize:11, fontWeight:700, color:'#374151', marginBottom:12, letterSpacing:'0.07em', textTransform:'uppercase', display:'flex', alignItems:'center', gap:8}}>
                    <span style={{width:7, height:7, borderRadius:'50%', background:'#6366f1', display:'inline-block'}} />
                    {visualizationTitle || 'Results'}
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    {chartType === 'pie' ? (
                      <PieChart>
                        <Pie
                          data={chartData.filter(d => d.value !== 100)} cx="50%" cy="50%"
                          outerRadius={70} dataKey="value"
                          label={({name, value}) => {
                            const text = `${name}: ${value}`;
                            return text.length > 20 ? text.substring(0, 17) + '...' : text;
                          }}
                          labelLine={{stroke:'#d1d5db', strokeWidth:1}}>
                          {chartData.filter(d => d.value !== 100).map((e,i) => <Cell key={i} fill={e.fill} />)}
                        </Pie>
                        <Tooltip
                          contentStyle={{background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:12, color:'#111827', boxShadow:'0 4px 16px rgba(0,0,0,0.1)', padding:'8px 12px'}}
                          formatter={(value, name, props) => [value, props.payload.name]}
                        />
                        <Legend iconType="circle" wrapperStyle={{fontSize:11, color:'#6b7280', paddingTop:'8px', wordWrap:'break-word'}} />
                      </PieChart>
                    ) : (
                      <BarChart data={chartData.filter(d => d.value !== 100)} barSize={22} margin={{top:10, right:16, left:10, bottom:80}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{fill:'#9ca3af', fontSize:9}} axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={100}/>
                        <YAxis tick={{fill:'#9ca3af', fontSize:10}} axisLine={false} tickLine={false} width={40}/>
                        <Tooltip contentStyle={{background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:12, color:'#111827', boxShadow:'0 4px 16px rgba(0,0,0,0.1)', padding:'8px 12px'}} />
                        <Bar dataKey="value" radius={[6,6,0,0]}>
                          {chartData.filter(d => d.value !== 100).map((e,i) => <Cell key={i} fill={e.fill} />)}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}

              {/* Metrics Grid */}
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, paddingBottom:12}}>
                {chartData.slice(0,4).map((item, i) => (
                  <div key={i} style={{background:'#ffffff', border:'1.5px solid #e5e7eb', borderRadius:12, padding:'14px 14px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                    <div style={{display:'flex', alignItems:'flex-start', gap:8, marginBottom:10}}>
                      <div style={{width:10, height:10, borderRadius:'50%', background:item.fill, flexShrink:0, marginTop:2}} />
                      <span style={{fontSize:11, color:'#6b7280', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', wordBreak:'break-word', whiteSpace:'normal', lineHeight:1.4, flex:1}}>{item.name}</span>
                    </div>
                    <div style={{fontSize:28, fontWeight:800, color:item.fill, lineHeight:1}}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Data Table */}
              <div style={{background:'#ffffff', border:'1.5px solid #e5e7eb', borderRadius:14, padding:'16px 14px', boxShadow:'0 1px 6px rgba(0,0,0,0.05)', marginTop:8}}>
                <div style={{fontSize:11, fontWeight:700, color:'#374151', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.07em', display:'flex', alignItems:'center', gap:8}}>
                  <span style={{width:7, height:7, borderRadius:'50%', background:'#3b82f6', display:'inline-block'}} />
                  Full Data Table
                </div>
                {chartData.map((item, i) => (
                  <div key={i} style={{
                    display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', gap:12,
                    padding:'10px 0', borderBottom: i < chartData.length-1 ? '1px solid #f1f5f9' : 'none',
                  }}>
                    <div style={{display:'flex', alignItems:'center', gap:8, minWidth:0}}>
                      <div style={{width:10, height:10, borderRadius:2, background:item.fill, flexShrink:0}} />
                      <span style={{fontSize:12, color:'#6b7280', wordBreak:'break-word', whiteSpace:'normal'}}>{item.name}</span>
                    </div>
                    <span style={{fontSize:13, color:'#111827', fontWeight:700, flexShrink:0}}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Download Button */}
              <button onClick={onDownloadChart} disabled={loading} style={{
                width:'100%', padding:'13px 0',
                background: loading ? '#e5e7eb' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                border:'none', borderRadius:12,
                color: loading ? '#9ca3af' : '#fff',
                fontSize:13, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.3)',
                marginBottom:4,
              }}>
                {loading ? <><FaSpinner style={{animation:'spin 1s linear infinite'}} size={14} /> Preparing...</> : '⬇ Download Chart'}
              </button>
            </>
          )}
        </div>

        {/* Hidden export container */}
        <div ref={downloadChartRef} style={{
          position:'fixed', left:'-9999px', top:'-9999px', width:'900px',
          background:'#ffffff', padding:'40px', fontFamily:'system-ui,-apple-system,sans-serif',
        }}>
          {open && chartData.length > 0 && (
            <div>
              <h2 style={{textAlign:'center', marginBottom:20, fontSize:18, fontWeight:'bold'}}>{visualizationTitle}</h2>
              <div style={{width:'100%', height:350, marginBottom:30}}>
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'pie' ? (
                    <PieChart>
                      <Pie data={chartData.filter(d => d.value !== 100)} cx="50%" cy="50%"
                        labelLine outerRadius={130} dataKey="value"
                        label={({name,value}) => `${name}: ${value}`}>
                        {chartData.filter(d => d.value !== 100).map((e,i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  ) : (
                    <BarChart data={chartData.filter(d => d.value !== 100)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80}/>
                      <YAxis /><Tooltip />
                      <Bar dataKey="value" radius={[6,6,0,0]}>
                        {chartData.filter(d => d.value !== 100).map((e,i) => <Cell key={i} fill={e.fill} />)}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
              <div style={{padding:20, background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8}}>
                <h3 style={{fontSize:14, fontWeight:600, marginBottom:12}}>Chart Data</h3>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                  {chartData.map((item,i) => (
                    <div key={i} style={{display:'flex', alignItems:'center', gap:8}}>
                      <div style={{width:10,height:10,borderRadius:2,background:item.fill,flexShrink:0}} />
                      <span style={{fontSize:12,color:'#374151'}}>{item.name}: <b>{item.value}</b></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Samples List Modal ────────────────────────────────────────────────────────
function SamplesListModal({ show, title, samples, onSelect, onClose }: {
  show: boolean; title: string;
  samples: Array<{ name: string; content: string }>;
  onSelect: (sample: any) => void; onClose: () => void;
}) {
  if (!show) return null;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',backdropFilter:'blur(4px)',zIndex:60,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'#fff',borderRadius:18,width:'100%',maxWidth:520,maxHeight:'80vh',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.2)',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'18px 24px 14px',borderBottom:'1.5px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center',background:'linear-gradient(135deg,#f8fafc,#f0f4ff)'}}>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:'#111827'}}>Select Sample Program</div>
            <div style={{fontSize:11,color:'#9ca3af',marginTop:1}}>{title}</div>
          </div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:8,background:'#f1f5f9',border:'1.5px solid #e5e7eb',color:'#6b7280',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
        </div>
        <div style={{overflowY:'auto',padding:'16px 24px',display:'flex',flexDirection:'column',gap:8}}>
          {samples.map((s,i) => (
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',background:'#f8fafc',border:'1.5px solid #e5e7eb',borderRadius:12,gap:12}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:32,height:32,borderRadius:8,background:'#eef2ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>📄</div>
                <span style={{fontSize:13,fontWeight:600,color:'#374151'}}>{s.name}</span>
              </div>
              <button onClick={() => onSelect(s)} style={{padding:'7px 16px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',borderRadius:8,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',boxShadow:'0 2px 8px rgba(99,102,241,0.25)'}}>
                Load →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── File Viewer Modal ─────────────────────────────────────────────────────────
function FileViewerModal({ show, content, onClose }: { show: boolean; content: string; onClose: () => void }) {
  if (!show) return null;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',backdropFilter:'blur(4px)',zIndex:60,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'#fff',borderRadius:18,width:'100%',maxWidth:800,maxHeight:'85vh',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.2)',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'18px 24px 14px',borderBottom:'1.5px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center',background:'linear-gradient(135deg,#f8fafc,#f0f4ff)'}}>
          <div style={{fontSize:15,fontWeight:800,color:'#111827'}}>File Content</div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:8,background:'#f1f5f9',border:'1.5px solid #e5e7eb',color:'#6b7280',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
        </div>
        <div style={{overflowY:'auto',padding:'16px 24px'}}>
          <pre style={{fontSize:12,fontFamily:'monospace',whiteSpace:'pre-wrap',wordBreak:'break-word',background:'#f8fafc',border:'1.5px solid #e5e7eb',borderRadius:10,padding:16,color:'#374151',lineHeight:1.6}}>{content}</pre>
        </div>
      </div>
    </div>
  );
}

// ─── Language Mismatch Modal ───────────────────────────────────────────────────
function LanguageMismatchModal({ show, info, onClose }: {
  show: boolean; info: { selected: string; detected: string } | null; onClose: () => void;
}) {
  if (!show || !info) return null;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',backdropFilter:'blur(4px)',zIndex:60,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'#fff',borderRadius:18,width:'100%',maxWidth:420,padding:28,boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
          <div style={{width:44,height:44,borderRadius:12,background:'#fef2f2',border:'1.5px solid #fecaca',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>⚠️</div>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:'#111827',marginBottom:6}}>Language Mismatch</div>
            <p style={{fontSize:13,color:'#6b7280',lineHeight:1.6,marginBottom:10}}>
              You selected the <b style={{color:'#4f46e5'}}>{info.selected.toUpperCase()}</b> tab, but the code appears to be{' '}
              <b style={{color:'#f97316'}}>{info.detected.toUpperCase()}</b>.
            </p>
            <p style={{fontSize:13,color:'#374151'}}>Please write <b>{info.selected.toUpperCase()}</b> code or switch to the correct tab.</p>
          </div>
        </div>
        <button onClick={onClose} style={{width:'100%',marginTop:20,padding:'11px 0',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',borderRadius:10,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 2px 12px rgba(99,102,241,0.3)'}}>
          OK, Got it
        </button>
      </div>
    </div>
  );
}

// ─── Main ToolsContent ─────────────────────────────────────────────────────────
export default function ToolsContent() {
  const [currentTab, setCurrentTab] = useState<'c' | 'java' | 'python' | 'solidity'>('c');
  const [currentFile, setCurrentFile] = useState<{ type: string; file: File } | null>(null);
  const [terminalOutputs, setTerminalOutputs] = useState({ c:'', java:'', python:'', solidity:'' });
  const [downloadableFiles, setDownloadableFiles] = useState<any>({ c:[], java:[], python:[], solidity:[] });

  const [cTool, setCTool] = useState('');
  const [javaTool, setJavaTool] = useState('JBMC');
  const [pythonTool, setPythonTool] = useState('Condition Coverage Fuzzing');
  const [solidityTool, setSolidityTool] = useState('VeriSol');
  const [solidityMode, setSolidityMode] = useState('bmc');

  const [cbmcBound, setCbmcBound] = useState('10');
  const [kleemaValue, setKleemaValue] = useState('1');
  const [gmcovVersion, setGmcovVersion] = useState('4');
  const [gmcovTimebound, setGmcovTimebound] = useState('3600');
  const [gmutantVersion, setGmutantVersion] = useState('4');
  const [gmutantTimebound, setGmutantTimebound] = useState('3600');

  const [showFileViewer, setShowFileViewer] = useState(false);
  const [showSamplesListModal, setShowSamplesListModal] = useState(false);
  const [fileContent, setFileContent] = useState('');
  const [samplesList, setSamplesList] = useState<any[]>([]);
  const [samplesListTitle, setSamplesListTitle] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartType, setChartType] = useState('pie');
  const [visualizationTitle, setVisualizationTitle] = useState('');
  const downloadChartRef = useRef<HTMLDivElement>(null);

  const [inputMode, setInputMode] = useState<'file' | 'code'>('file');
  const [userCode, setUserCode] = useState({
    c:`#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
    java:`public class program {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
    python:`print("Hello, World!")`,
    solidity:`// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract HelloWorld {\n    function greet() public pure returns (string memory) {\n        return "Hello, World!";\n    }\n}`,
  });

  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalReason, setAuthModalReason] = useState<'no_token' | 'invalid_token' | 'session_expired' | 'no_trials' | 'unauthorized'>('no_token');
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showLanguageMismatchModal, setShowLanguageMismatchModal] = useState(false);
  const [languageMismatchInfo, setLanguageMismatchInfo] = useState<{selected:string;detected:string}|null>(null);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [loadingSamples, setLoadingSamples] = useState(false);

  const terminalRef = useRef<HTMLDivElement>(null);
  const fileInputRefs = {
    c: useRef<HTMLInputElement>(null),
    java: useRef<HTMLInputElement>(null),
    python: useRef<HTMLInputElement>(null),
    solidity: useRef<HTMLInputElement>(null),
  };

  // ── Auth init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const userData = await initializeAuth();
        if (!userData) { setIsAuthenticated(false); setAuthModalReason('no_token'); setShowAuthModal(true); }
        else { setUser(userData); setIsAuthenticated(true); setShowAuthModal(false); }
      } catch { setIsAuthenticated(false); setAuthModalReason('invalid_token'); setShowAuthModal(true); }
      setAuthLoading(false);
    })();

    const interval = setInterval(async () => {
      const s = getStoredSessionToken();
      if (s && isAuthenticated) {
        const v = await validateToken(s.token);
        if (v.isValid && v.data?.user) setUser(v.data.user);
        else { clearSession(); setIsAuthenticated(false); setAuthModalReason('session_expired'); setShowAuthModal(true); clearInterval(interval); }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // ── URL token redirect ─────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    const t = p.get('token');
    if (t && !getStoredSessionToken()) {
      setAuthLoading(true);
      (async () => {
        const u = await initializeAuth();
        if (u) { setUser(u); setIsAuthenticated(true); setShowAuthModal(false); window.history.replaceState({}, document.title, window.location.pathname); }
        setAuthLoading(false);
      })();
    }
  }, []);

  // ── Chat widget z-index fix (keep below our modals; hide during tour) ──────
  useEffect(() => {
    const id = 'ti-widget-zfix';
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style') as HTMLStyleElement;
      el.id = id;
      document.head.appendChild(el);
    }
    if (showTour) {
      // Hide chat widgets while tour is active so they don't cover tour steps
      el.textContent = `
        #crisp-chatbox, .crisp-client, [data-id="crisp"],
        #hubspot-messages-iframe-container, .hs-messages-widget,
        .intercom-launcher, .intercom-lightweight-app, .intercom-namespace,
        #fc_frame, #freshchat-container, .freshchat-widget,
        .zsiq_floatmain, #zohohc-asap-web-launcherbox,
        iframe[title*="chat" i], iframe[title*="support" i],
        iframe[src*="crisp"], iframe[src*="intercom"],
        iframe[src*="hubspot"], iframe[src*="freshchat"] {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
      `;
    } else {
      // Restore widgets but keep them below our drawer (z:51) and modals (z:60)
      el.textContent = `
        #crisp-chatbox, .crisp-client, [data-id="crisp"],
        #hubspot-messages-iframe-container, .hs-messages-widget,
        .intercom-launcher, .intercom-lightweight-app,
        #fc_frame, #freshchat-container,
        .zsiq_floatmain, #zohohc-asap-web-launcherbox {
          z-index: 45 !important;
        }
      `;
    }
    return () => { if (el) el.textContent = ''; };
  }, [showTour]);

  // ── Scroll terminal to bottom ──────────────────────────────────────────────
  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [terminalOutputs]);

  // ── Clear solidity output when mode changes ────────────────────────────────
  useEffect(() => {
    if (currentTab === 'solidity') {
      setTerminalOutputs(prev => ({ ...prev, solidity: '' }));
    }
  }, [solidityMode]);

  const switchTab = (tabId: 'c' | 'java' | 'python' | 'solidity') => {
    setCurrentFile(null);
    setTerminalOutputs(prev => ({ ...prev, [tabId]:'' }));
    setInputMode('file');
    setCurrentTab(tabId);
  };

  const browseFile = (type: 'c' | 'java' | 'python' | 'solidity') => fileInputRefs[type]?.current?.click();

  const handleFileSelect = (e: any, type: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setCurrentFile({ type, file });
      setTerminalOutputs(prev => ({ ...prev, [type]: '' }));
    }
  };

  const viewFile = async (type: 'c' | 'java' | 'python' | 'solidity') => {
    if (!currentFile || currentFile.type !== type) { alert('Please select a file first'); return; }
    const reader = new FileReader();
    reader.onload = (e) => { setFileContent((e.target?.result as string) || ''); setShowFileViewer(true); };
    reader.readAsText(currentFile.file);
  };

  const viewServerFile = async (downloadUrl: string, fileName: string) => {
    try {
      const urlParts = downloadUrl.split('/');
      const folderName = urlParts[3];
      const fileNameFromUrl = urlParts.slice(4).join('/');
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/view?filepath=${encodeURIComponent(`/root/Desktop/trustinn-website/${folderName}/${fileNameFromUrl}`)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { const d = await res.json(); setFileContent(d.content); setShowFileViewer(true); }
      else alert('Failed to load file content');
    } catch { alert('Error loading file content'); }
  };

  const getFilteredTerminalOutput = (toolType: string, output: string) => {
    if (!output) return '';
    if (toolType === 'c' && cTool === 'Condition Satisfiability Analysis') {
      const mcdc = output.match(/=+MC\/DC.*?=+Report-Finish=+/i);
      if (mcdc) return mcdc[0];
    }
    if (toolType === 'c' && cTool === 'DSE based Mutation Analyser') {
      const m = output.match(/=+Mutation Score Report=+[\s\S]*?=+Report-Finish=+/i);
      if (m) return m[0];
    }
    if (toolType === 'c' && (cTool === 'Dynamic Symbolic Execution' || cTool === 'Dynamic Symbolic Execution with Pruning')) {
      let f = '';
      const t = output.match(/\|[\s\S]*?Path[\s\S]*?\|-+[\s\S]*?\|-+/); if (t) f += t[0] + '\n\n';
      const b = output.match(/\*+Basic Block Coverage Report[\s\S]*?\*+/); if (b) f += b[0] + '\n\n';
      const c = output.match(/\*+ICMP\/Atomic Condition Coverage Report[\s\S]*?\*+/); if (c) f += c[0] + '\n\n';
      const s = output.match(/KLEE: done:[\s\S]*?(?=rm:|$)/); if (s) f += s[0];
      return f || output;
    }
    if (toolType === 'java' && output.match(/JBMC|Assertion Analysis/i)) {
      let f = '';
      const c = output.match(/Compilation:.*?\n/); if (c) f += c[0] + '\n';
      const a = output.match(/JBMC Assertion Analysis:[\s\S]*?Conditional Coverage:\s*\d+%/); if (a) f += a[0];
      return f || output;
    }
    if (toolType === 'python' && output.match(/Assertion Analysis|assertion violations/i)) {
      let f = '';
      const c = output.match(/Compilation.*?:\s*SUCCESS|FAILURE/i); if (c) f += c[0] + '\n\n';
      const s = output.match(/Total Assertion Failure:[\s\S]*?Conditional Coverage:\s*[\d.]+%/); if (s) f += s[0];
      return f || output;
    }
    if (toolType === 'solidity' && output.match(/Processing Contract|Properties inserted/i)) {
      let f = '';
      const h = output.match(/={10,}[\s\S]*?Processing Contract:[\s\S]*?={10,}/); if (h) f += h[0] + '\n';
      const m = output.match(/Properties inserted[\s\S]*?Total runtime:[\s\S]*?[\d:.]+/); if (m) f += m[0];
      return f || output;
    }
    return output;
  };

  const compileCode = async (language: 'c' | 'java' | 'python' | 'solidity') => {
    setIsCompiling(true);

    try {
      let code = inputMode === 'code' ? userCode[language] : '';
      let displayFilename = 'code';

      // If in file mode, read the file content
      if (inputMode === 'file' && currentFile?.type === language) {
        await new Promise<void>(resolve => {
          const r = new FileReader();
          r.onload = e => { 
            code = e.target?.result as string;
            displayFilename = currentFile!.file.name;
            resolve(); 
          };
          r.readAsText(currentFile.file);
        });
      }

      // Validation: Check if code is not empty
      if (!code?.trim()) {
        setTerminalOutputs(prev => ({ 
          ...prev, 
          [language]: `❌ Error: No code to compile. Please ${inputMode === 'file' ? 'select a file' : 'write some code'}.` 
        }));
        setIsCompiling(false);
        return;
      }

      // Clear previous output and show compilation starting
      setTerminalOutputs(prev => ({ 
        ...prev, 
        [language]: `[Compilation] Compiling ${displayFilename} (${language.toUpperCase()})...\n` 
      }));

      try {
        // Use streaming API for real-time output (no timeout - server handles it)
        const res = await fetch('/api/tools/compile-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            language, 
            code, 
            fileName: displayFilename 
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setTerminalOutputs(prev => ({
            ...prev,
            [language]: (prev[language] || '') + `❌ Server error (${res.status}): ${err.error || res.statusText}\n`,
          }));
          return;
        }

        // Stream SSE events and update terminal in real-time
        const reader = res.body?.getReader();
        if (!reader) throw new Error('Response body is not readable');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');

          // Process complete lines
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              if (dataStr === '[DONE]') {
                break;
              }
              try {
                const event = JSON.parse(dataStr);
                if (event.type === 'output') {
                  // Real-time output streaming
                  setTerminalOutputs(prev => ({
                    ...prev,
                    [language]: (prev[language] || '') + event.message + '\n',
                  }));
                } else if (event.type === 'success') {
                  setTerminalOutputs(prev => ({
                    ...prev,
                    [language]: (prev[language] || '') + `\n✅ ${event.message}\n`,
                  }));
                } else if (event.type === 'error') {
                  setTerminalOutputs(prev => ({
                    ...prev,
                    [language]: (prev[language] || '') + `\n❌ ${event.message}\n`,
                  }));
                } else if (event.type === 'start') {
                  // Just log the start - we already showed it above
                  console.log('[compile] Started:', event.message);
                }
              } catch (parseErr) {
                // Silently ignore parse errors for malformed SSE
                console.error('[compile] SSE parse error:', parseErr);
              }
            }
          }

          // Keep the last incomplete line in buffer
          buffer = lines[lines.length - 1];
        }
      } catch (e: any) {
        const errMsg = e?.message ?? 'Network error';
        setTerminalOutputs(prev => ({
          ...prev,
          [language]: (prev[language] || '') + `\n❌ ${errMsg}\n`,
        }));
      }
    } catch (e: any) {
      setTerminalOutputs(prev => ({
        ...prev,
        [language]: `❌ Compilation error: ${e?.message ?? 'Unknown error'}\n`,
      }));
    } finally {
      setIsCompiling(false);
    }
  };

  const copyToClipboard = () => {
    const out = getFilteredTerminalOutput(currentTab, terminalOutputs[currentTab] || '');
    navigator.clipboard.writeText(out).then(() => alert('Copied!')).catch(() => alert('Failed to copy'));
  };

  const handleOTPVerified = () => {
    setShowOTPModal(false);
    if (user) { setUser({ ...user, isEmailVerified: true }); setIsAuthenticated(true); }
  };

  const detectCodeLanguage = (code: string) => {
    if (code.includes('#include') && (code.includes('int main') || code.includes('void main'))) return 'c';
    if ((code.includes('public class') || code.includes('public static void main')) && code.includes('System.out')) return 'java';
    if (code.toLowerCase().includes('def ') || code.toLowerCase().includes('if __name__') || (code.includes('print(') && !code.includes('#include'))) return 'python';
    if ((code.includes('pragma solidity') || code.includes('contract ')) && code.includes('function')) return 'solidity';
    return null;
  };

  const executeCommand = async (type: 'c' | 'java' | 'python' | 'solidity') => {
    // Check if authenticated
    if (!isAuthenticated || !user) { 
      console.log('[executeCommand] User not authenticated, showing auth modal');
      setAuthModalReason('no_token'); 
      setShowAuthModal(true); 
      return; 
    }

    // Validate input based on input mode
    if (inputMode === 'code') {
      if (!userCode[type] || !userCode[type].trim()) { 
        alert('Please write some code first'); 
        return; 
      }
    } else {
      if (!currentFile || currentFile.type !== type) { 
        alert(`Please select a ${type.toUpperCase()} file first`); 
        return; 
      }
    }

    // Validate tool selection
    const selectedTool = type === 'c' ? cTool : type === 'java' ? javaTool : type === 'python' ? pythonTool : solidityTool;
    if (!selectedTool) { 
      alert(`Please select a tool for ${type.toUpperCase()}`); 
      return; 
    }

    // Fetch fresh user data before execution with error handling
    console.log('[executeCommand] Fetching fresh user data for userId:', user.id);
    const freshUser = await fetchUserFromDB(user.id);
    
    if (!freshUser) { 
      console.warn('[executeCommand] Could not fetch fresh user data, checking if current session is still valid...');
      
      // Try to validate the stored token as fallback
      const storedSession = getStoredSessionToken();
      if (storedSession) {
        console.log('[executeCommand] Validating stored session token...');
        const validation = await validateToken(storedSession.token);
        
        if (validation.isValid && validation.data?.user) {
          console.log('[executeCommand] Using validated user data from token');
          setUser(validation.data.user);
          
          // Check trial/premium status with validated data
          if (!validation.data.user.isPremium && validation.data.user.trialCount <= 0) { 
            console.warn('[executeCommand] No trials remaining');
            setAuthModalReason('no_trials'); 
            setShowAuthModal(true); 
            return; 
          }

          // Continue execution with validated user
          if (inputMode === 'code') {
            const detected = detectCodeLanguage(userCode[type].trim());
            if (detected && detected !== type) { 
              setLanguageMismatchInfo({ selected: type, detected }); 
              setShowLanguageMismatchModal(true); 
              return; 
            }
          }

          console.log('[executeCommand] Starting execution for:', type);
          await performExecution(type, validation.data.user);
          return;
        }
      }
      
      console.error('[executeCommand] Session validation failed, cannot proceed');
      setAuthModalReason('session_expired'); 
      setShowAuthModal(true); 
      return; 
    }

    console.log('[executeCommand] Fresh user data retrieved:', {
      email: freshUser.email,
      trialCount: freshUser.trialCount,
      isPremium: freshUser.isPremium
    });
    
    setUser(freshUser);

    // Check trial/premium status
    if (!freshUser.isPremium && freshUser.trialCount <= 0) { 
      console.warn('[executeCommand] No trials remaining');
      setAuthModalReason('no_trials'); 
      setShowAuthModal(true); 
      return; 
    }

    // Check for language mismatch if in code mode
    if (inputMode === 'code') {
      const detected = detectCodeLanguage(userCode[type].trim());
      if (detected && detected !== type) { 
        setLanguageMismatchInfo({ selected: type, detected }); 
        setShowLanguageMismatchModal(true); 
        return; 
      }
    }

    console.log('[executeCommand] Starting execution for:', type);
    await performExecution(type, freshUser);
  };

  const generateCCommand = () => {
    if (!cTool) { alert('Please select a tool first'); return null; }
    switch (cTool) {
      case 'Condition Satisfiability Analysis': 
        if (!cbmcBound) { alert('Please enter unwind bound'); return null; }
        return `./cbmc_script.sh [FILE] ${cbmcBound}`;
      case 'DSE based Mutation Analyser': 
        return `./kleema.sh [FILE] ${kleemaValue}`;
      case 'Dynamic Symbolic Execution': 
        return `./klee.sh [FILE]`;
      case 'Dynamic Symbolic Execution with Pruning': 
        return `./tracerx.sh [FILE]`;
      case 'Advance Code Coverage Profiler': 
        if (!gmcovVersion || !gmcovTimebound) { alert('Enter version and time bound'); return null; }
        return `./main-gProfiler.sh [FILE] ${gmcovVersion} ${gmcovTimebound}`;
      case 'Mutation Testing Profiler': 
        if (!gmutantVersion || !gmutantTimebound) { alert('Enter version and time bound'); return null; }
        return `./main-gProfiler.sh [FILE] ${gmutantVersion} ${gmutantTimebound}`;
      default: 
        return null;
    }
  };

  const generateJavaCommand = () => {
    if (!javaTool) { alert('Please select a tool first'); return null; }
    return `./shellsc.sh [FILE]`;
  };

  const generatePythonCommand = () => {
    if (!pythonTool) { alert('Please select a tool first'); return null; }
    return `./shellpy.sh [FILE]`;
  };

  const generateSolidityCommand = () => {
    if (!solidityTool) { alert('Please select a tool first'); return null; }
    return `./final.sh [FILE] ${solidityMode}`;
  };

  const performExecution = async (type: string, freshUser: any) => {
    // Security check: ensure tab matches selected type
    if (type !== currentTab) { 
      alert(`Security check failed: Tab mismatch.\nPlease stay on the correct language tab.\nSelected: ${currentTab.toUpperCase()}\nTrying to execute: ${type.toUpperCase()}`); 
      setLoading(false);
      return; 
    }

    // Validation based on input mode
    if (inputMode === 'file') {
      if (!currentFile || currentFile.type !== type) { 
        alert(`Please select a ${type.toUpperCase()} file first.\n\nCurrent file type: ${currentFile?.type || 'none'}\nExpected type: ${type}`); 
        setLoading(false);
        return; 
      }
    } else if (inputMode === 'code') {
      if (!userCode[type as keyof typeof userCode]?.trim()) { 
        alert('Please write some code first'); 
        setLoading(false);
        return; 
      }
      // Validate code language matches selected tab
      const detected = detectCodeLanguage(userCode[type as keyof typeof userCode].trim());
      if (detected && detected !== type) { 
        setLanguageMismatchInfo({ selected: type, detected }); 
        setShowLanguageMismatchModal(true); 
        setLoading(false);
        return; 
      }
    }

    // Ensure tool is selected
    const selectedTool = type === 'c' ? cTool : type === 'java' ? javaTool : type === 'python' ? pythonTool : solidityTool;
    if (!selectedTool) { 
      alert(`Please select a tool for ${type.toUpperCase()} first`); 
      setLoading(false);
      return; 
    }

    setLoading(true);
    setTerminalOutputs(prev => ({ ...prev, [type]: `Executing ${selectedTool}...\n` }));

    const formData = new FormData();
    if (inputMode === 'file') formData.append('file', currentFile!.file);
    else formData.append('code', userCode[type as keyof typeof userCode]);
    formData.append('type', type);
    formData.append('inputMode', inputMode);

    let command: string | null = null;
    
    if (type === 'c') {
      command = generateCCommand();
      if (!command) { setLoading(false); return; }
      formData.append('tool', cTool);
      if (cTool === 'Condition Satisfiability Analysis') formData.append('bound', cbmcBound);
      if (cTool === 'DSE based Mutation Analyser') formData.append('value', kleemaValue);
      if (cTool === 'Dynamic Symbolic Execution') formData.append('toolValue', '1');
      if (cTool === 'Dynamic Symbolic Execution with Pruning') formData.append('toolValue', '2');
      if (cTool === 'Advance Code Coverage Profiler') { formData.append('version', gmcovVersion); formData.append('timebound', gmcovTimebound); }
      if (cTool === 'Mutation Testing Profiler') { formData.append('version', gmutantVersion); formData.append('timebound', gmutantTimebound); }
    } else if (type === 'java') {
      command = generateJavaCommand();
      if (!command) { setLoading(false); return; }
      formData.append('tool', javaTool);
    } else if (type === 'python') {
      command = generatePythonCommand();
      if (!command) { setLoading(false); return; }
      formData.append('tool', pythonTool);
    } else if (type === 'solidity') {
      command = generateSolidityCommand();
      if (!command) { setLoading(false); return; }
      formData.append('tool', solidityTool);
      formData.append('mode', solidityMode);
    }
    
    if (!command) { setLoading(false); return; }
    formData.append('command', command);

    // Consume trial for non-premium users BEFORE execution
    if (!freshUser.isPremium) {
      const trialData = await fetchTrialCountByEmail(freshUser.email);
      if (!trialData || trialData.trialCount <= 0) { 
        alert('⚠️ No trials remaining. Please subscribe to a premium plan to continue.'); 
        setLoading(false); 
        return; 
      }
      
      const trialResult = await consumeTrial(freshUser.id);
      if (!trialResult.consumed) { 
        alert(`Error consuming trial: ${trialResult.error}`); 
        setLoading(false); 
        return; 
      }
      
      // Update user with new trial count
      const updatedUser = await fetchUserFromDB(freshUser.id);
      if (updatedUser) {
        setUser(updatedUser);
      }
    }

    setIsRunning(true);
    const ac = new AbortController();
    abortControllerRef.current = ac;
    const tid = setTimeout(() => ac.abort(), 900_000); // 15-minute max timeout

    try {
      const res = await fetch('/api/tools/execute', {
        method:'POST', 
        body: formData,
        headers: { 
          'x-user-id': freshUser.id, 
          'x-is-premium': freshUser.isPremium ? 'true' : 'false' 
        },
        credentials:'include', 
        signal: ac.signal,
      });
      
      clearTimeout(tid);
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const errorMsg = err.error || res.statusText || 'Unknown server error';
        
        setTerminalOutputs(prev => ({ 
          ...prev, 
          [type]: limitOutput((prev[type] || '') + `❌ Server Error (${res.status}): ${errorMsg}\n`) 
        }));
        setLoading(false);
        setIsRunning(false);
        return;
      }
      
      const d = await res.json();
      if (d.success) {
        const updatedOutput = limitOutput('✅ Command executed successfully!\n\n' + (d.output || ''));
        setTerminalOutputs(prev => ({ ...prev, [type]: updatedOutput }));
        if (d.files?.length > 0) setDownloadableFiles((prev: any) => ({ ...prev, [type]: d.files }));
        try {
          const extracted = extractVisualizationData(updatedOutput, type);
          setChartData(extracted);
          setupChartDefaults(type, d.output || '');
          setDrawerOpen(true);
        } catch (vizErr) {
          console.error('Visualization error:', vizErr);
          setChartData([]);
          setDrawerOpen(true);
        }
      } else {
        setTerminalOutputs(prev => ({ ...prev, [type]: limitOutput((prev[type] || '') + '❌ Error: ' + (d.error || 'Unknown error') + '\n') }));
      }
    } catch (e: any) {
      clearTimeout(tid);
      let msg = '';
      if (e.message === 'The operation was aborted') {
        msg = '⚠️ Execution stopped by user\n';
      } else if (e.message.includes('timeout')) {
        msg = '⏱️ Request timeout: The tool took too long. Try with smaller files or simpler code.\n';
      } else if (e.message.includes('ERR_NETWORK_CHANGED') || e.message.includes('network')) {
        msg = '❌ Network Error: Your network connection changed during execution. Please check your internet connection and try again.\n';
      } else if (e.message.includes('NetworkError') || e.message.includes('Failed to fetch')) {
        msg = '❌ Network Connection Error: Unable to reach the server. Please check your internet connection or try again in a moment.\n';
      } else {
        msg = `❌ Network Error: ${e.message}\n`;
      }
      setTerminalOutputs(prev => ({ ...prev, [type]: limitOutput((prev[type] || '') + msg) }));
    } finally {
      setLoading(false); 
      setIsRunning(false); 
      abortControllerRef.current = null;
    }
  };

  const limitOutput = (o: string) => {
    const lines = o.split('\n');
    if (lines.length > 5000) return `... (${lines.length - 5000} lines truncated) ...\n${lines.slice(-5000).join('\n')}`;
    return o;
  };

  const extractVisualizationData = (output: string, toolType: string) => {
    const data: any[] = [];
    if (!output) return [{ name:'✅ Execution Complete', value:1, fill:'#10b981' }];

    if (toolType === 'c' && output.match(/MC\/DC|feasible MC\/DC sequences/i)) {
      const feasible = parseInt(output.match(/feasible MC\/DC sequences\s*=\s*(\d+)/i)?.[1] || '0');
      const total    = parseInt(output.match(/Total no\. of MC\/DC sequences\s*=\s*(\d+)/i)?.[1] || '0');
      const score    = parseInt(output.match(/MC\/DC Score\s*=\s*(\d+)/i)?.[1] || '0');
      if (feasible > 0) data.push({ name:'Feasible MC/DC Sequences', value:feasible, fill:'#10b981' });
      if (total > 0)    data.push({ name:'Total MC/DC Sequences',   value:total,    fill:'#3b82f6' });
      if (score > 0)    data.push({ name:'MC/DC Score',             value:score,    fill:'#f59e0b' });
      if (!data.length) data.push({ name:'MC/DC Analysis Complete', value:1, fill:'#10b981' });
    } else if (toolType === 'c' && output.match(/Reachable|valid test cases/i)) {
      const r = parseInt(output.match(/Reachable.*?=:\s*(\d+)/i)?.[1] || '0');
      const u = parseInt(output.match(/Unreachable.*?=:\s*(\d+)/i)?.[1] || '0');
      data.push({ name:'Reachable/Valid',     value:r, fill:'#10b981' });
      data.push({ name:'Unreachable/Invalid', value:u, fill:'#ef4444' });
    } else if (toolType === 'c' && output.match(/Mutation Score Report|Killed.*Mutants/i)) {
      const killed = parseInt(output.match(/Killed\s*Mutants?\s*=:?\s*(\d+)/i)?.[1] || '0');
      const alive  = parseInt(output.match(/Alive\s*Mutants?\s*=:?\s*(\d+)/i)?.[1] || '0');
      const score  = parseInt(output.match(/Mutation\s*Score\s*=:?\s*(\d+)/i)?.[1] || '0');
      if (killed > 0) data.push({ name:'Killed Mutants',   value:killed, fill:'#10b981' });
      if (alive > 0)  data.push({ name:'Alive Mutants',    value:alive,  fill:'#ef4444' });
      if (score > 0)  data.push({ name:'Mutation Score %', value:score,  fill:'#f59e0b' });
      if (!data.length) data.push({ name:'Mutation Analysis Complete', value:1, fill:'#10b981' });
    } else if (toolType === 'c' && output.match(/KLEE|Symbolic Execution|Basic Block/i)) {
      const vb = parseInt(output.match(/Visited Basic Blocks:\s*(\d+)/)?.[1] || '0');
      const tb = parseInt(output.match(/Total.*Basic Blocks:\s*(\d+)/)?.[1] || '0');
      const cc = parseInt(output.match(/Covered.*Condition:\s*(\d+)/)?.[1] || '0');
      const tc = parseInt(output.match(/All.*Condition:\s*(\d+)/)?.[1] || '0');
      const cp = parseInt(output.match(/completed paths\s*=\s*(\d+)/)?.[1] || '0');
      const gt = parseInt(output.match(/generated tests\s*=\s*(\d+)/)?.[1] || '0');
      if (vb) data.push({ name:'Visited Basic Blocks', value:vb, fill:'#3b82f6' });
      if (tb) data.push({ name:'Total Basic Blocks',   value:tb, fill:'#06b6d4' });
      if (cc) data.push({ name:'Covered Conditions',   value:cc, fill:'#10b981' });
      if (tc) data.push({ name:'Total Conditions',     value:tc, fill:'#8b5cf6' });
      if (cp) data.push({ name:'Completed Paths',      value:cp, fill:'#ef4444' });
      if (gt) data.push({ name:'Generated Tests',      value:gt, fill:'#ec4899' });
    } else if (toolType === 'java' || toolType === 'python') {
      const af  = parseInt(output.match(/Total Assertion Failure:\s*(\d+)/)?.[1] || '0');
      const aa  = parseInt(output.match(/Total Assertion Added:\s*(\d+)/)?.[1] || '0');
      const cov = Math.round(parseFloat(output.match(/Conditional Coverage:\s*([\d.]+)/)?.[1] || '0'));
      if (af || aa) {
        data.push({ name:'Assertion Failures',      value:af,  fill:'#ef4444' });
        data.push({ name:'Assertions Added',         value:aa,  fill:'#10b981' });
        data.push({ name:'Conditional Coverage %',  value:cov, fill:'#3b82f6' });
      } else data.push({ name:'Analysis Complete', value:1, fill:'#3b82f6' });
    } else if (toolType === 'solidity') {
      const pi = parseInt(output.match(/Properties inserted\s*:\s*(\d+)/)?.[1] || '0');
      const vd = parseInt(output.match(/violation.*dynamic\s*:\s*(\d+)/i)?.[1] || '0');
      const vu = parseInt(output.match(/violation.*unique\s*:\s*(\d+)/i)?.[1] || '0');
      const cc = parseInt(output.match(/Condition Coverage %\s*:\s*(\d+)/)?.[1] || '0');
      data.push({ name:'Properties Inserted',    value:pi, fill:'#3b82f6' });
      data.push({ name:'Violations (Dynamic)',   value:vd, fill:'#ef4444' });
      data.push({ name:'Violations (Unique)',    value:vu, fill:'#f59e0b' });
      if (cc) data.push({ name:'Condition Coverage %', value:cc, fill:'#06b6d4' });
    }

    return data.length ? data : [{ name:'✅ Execution Complete', value:1, fill:'#10b981' }];
  };

  const setupChartDefaults = (type: string, output: string) => {
    let t = 'Execution Results', ct = 'pie';
    if (type === 'c') {
      if (output.match(/feasible MC\/DC sequences/i))  { ct = 'bar'; t = 'MC/DC Coverage Analysis'; }
      else if (output.match(/Killed Mutants|Alive Mutants/i)) { ct = 'bar'; t = 'Mutation Analysis Results'; }
      else if (output.match(/KLEE|Symbolic Execution/i))      { ct = 'bar'; t = 'Dynamic Symbolic Execution Results'; }
      else if (output.match(/Reachable/i))                    { ct = 'pie'; t = 'CBMC Test Case Analysis'; }
    } else if (type === 'java')     { t = 'Java Analysis Results'; }
    else if (type === 'python')     { t = 'Python Analysis Results'; }
    else if (type === 'solidity')   { t = 'Smart Contract Verification Results'; }
    setChartType(ct); setVisualizationTitle(t);
  };

  const openAnalytics = (type: 'c' | 'java' | 'python' | 'solidity') => {
    const output = terminalOutputs[type];
    if (!output?.trim()) { alert('No output to visualize. Execute a tool first.'); return; }
    const data = extractVisualizationData(output, type);
    setChartData(data);
    setupChartDefaults(type, output);
    setDrawerOpen(true);
  };

  const downloadChart = async () => {
    if (!downloadChartRef.current) { alert('Chart not ready'); return; }
    setLoading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(downloadChartRef.current, { backgroundColor:'#ffffff', scale:3, logging:false, useCORS:true });
      canvas.toBlob(blob => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url;
          a.download = `chart-${new Date().toISOString().slice(0,10)}.png`;
          a.click(); URL.revokeObjectURL(url);
        }
        setLoading(false);
      }, 'image/png', 0.95);
    } catch { alert('Error downloading chart.'); setLoading(false); }
  };

  const downloadTerminal = (type: 'c' | 'java' | 'python' | 'solidity') => {
    const output = terminalOutputs[type];
    if (!output?.trim()) { alert('No output to download'); return; }
    const b = new Blob([output], { type:'text/plain' });
    const url = URL.createObjectURL(b);
    const a = document.createElement('a'); a.href = url;
    a.download = `terminal-${type}-${new Date().toISOString().slice(0,10)}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const downloadZip = async (type: 'c' | 'java' | 'python' | 'solidity') => {
    if (!currentFile) { alert('Please select a file first'); return; }
    const folderMap: Record<string,string> = {
      'Condition Satisfiability Analysis':'CBMC','DSE based Mutation Analyser':'KLEEMA',
      'Dynamic Symbolic Execution':'KLEE','Dynamic Symbolic Execution with Pruning':'TX',
      'Advance Code Coverage Profiler':'gMCov','Mutation Testing Profiler':'gMutant',
    };
    let folder = type === 'c' ? folderMap[cTool] : type === 'solidity' ? 'Solc' : type === 'java' ? 'JAVA' : 'python';
    if (!folder) { alert('Please select a C tool first'); return; }
    const inputFile = currentFile.file.name;
    const base = inputFile.replace(/\.[^/.]+$/, '');
    try {
      const token = localStorage.getItem('authToken');
      let q = `fileName=${encodeURIComponent(inputFile)}`;
      if (type === 'solidity') q += `&mode=${encodeURIComponent(solidityMode)}`;
      const res = await fetch(`/api/download-zip/${folder}?${q}`, { headers:{ 'Authorization':`Bearer ${token}` } });
      if (!res.ok) { const e = await res.json(); alert(`Error: ${e.error}`); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${base}.zip`;
      a.click(); URL.revokeObjectURL(url);
    } catch { alert('Failed to download zip file'); }
  };

  const showSampleCode = async (type: 'c' | 'java' | 'python' | 'solidity') => {
    const toolMap: Record<string,string> = {
      'Condition Satisfiability Analysis':'CBMC','DSE based Mutation Analyser':'KLEEMA',
      'Dynamic Symbolic Execution':'KLEE','Dynamic Symbolic Execution with Pruning':'TX',
      'Advance Code Coverage Profiler':'gMCov','Mutation Testing Profiler':'gMutant',
    };
    const tool = type === 'c' ? cTool : type === 'java' ? javaTool : type === 'python' ? pythonTool : solidityTool;
    const toolForAPI = type === 'c' ? (toolMap[tool] || tool) : type === 'java' ? 'JBMC' : type === 'python' ? 'Condition Coverage Fuzzing' : 'VeriSol';
    if (!tool) { alert('Please select a tool first'); return; }
    setLoadingSamples(true);
    try {
      const res = await fetch(`/api/sample-programs?tool=${toolForAPI}&language=${type}`);
      if (!res.ok) throw new Error(res.statusText);
      const d = await res.json();
      if (!d.samples || !Object.keys(d.samples).length) { alert(`No sample programs found for ${tool}`); return; }
      if (Object.keys(d.samples).length === 1) {
        const fn = Object.keys(d.samples)[0];
        const f = new File([new Blob([d.samples[fn]], {type:'text/plain'})], fn, {type:'text/plain'});
        setCurrentFile({ type, file:f });
        alert(`✅ Sample loaded: ${fn}\n\nReady to execute!`);
      } else {
        setSamplesList(Object.keys(d.samples).map(n => ({ name:n, content:d.samples[n] })));
        setSamplesListTitle(tool); setShowSamplesListModal(true);
      }
    } catch (e: any) { alert(`Failed to load samples: ${e.message}`); }
    finally { setLoadingSamples(false); }
  };

  const selectSample = (sample: any) => {
    const f = new File([new Blob([sample.content],{type:'text/plain'})], sample.name, {type:'text/plain'});
    setCurrentFile({ type: currentTab, file: f });
    setTerminalOutputs(prev => ({ ...prev, [currentTab]: '' }));
    setShowSamplesListModal(false);
  };

  const clearTerminal = (type: 'c' | 'java' | 'python' | 'solidity') =>
    setTerminalOutputs(prev => ({ ...prev, [type]:'' }));

  const getLineColor = (line: string) => {
    if (line.match(/❌|ERROR|Error|CRITICAL|critical/)) return '#f87171';
    if (line.match(/⚠️|WARNING|WARN|HIGH|HIGH:/)) return '#fcd34d';
    if (line.match(/✅|SUCCESS|success|completed|Complete/i)) return '#34d399';
    if (line.match(/MEDIUM|Checking|Running|Uploading|Executing/i)) return '#93c5fd';
    return '#9ca3af';
  };

  const getLineBg = (line: string) => {
    if (line.match(/❌|ERROR|Error|CRITICAL/)) return 'rgba(239,68,68,0.06)';
    if (line.match(/✅|SUCCESS|completed/i)) return 'rgba(16,185,129,0.06)';
    if (line.match(/⚠️|WARNING|WARN/)) return 'rgba(251,191,36,0.06)';
    return 'transparent';
  };

  const terminalOutput = getFilteredTerminalOutput(currentTab, terminalOutputs[currentTab] || '');
  const terminalLines  = terminalOutput.split('\n');

  // ─── Shared style helpers ──────────────────────────────────────────────────
  const S = {
    card:       { background:'#ffffff', border:'1.5px solid #e5e7eb', borderRadius:'clamp(10px, 2vw, 16px)', padding:'clamp(10px, 2.5vw, 18px)', marginBottom:'clamp(8px, 2vw, 14px)', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' } as React.CSSProperties,
    label:      { fontSize:'clamp(9px, 1.8vw, 11px)', fontWeight:800, color:'#9ca3af', marginBottom:'clamp(6px, 1.5vw, 10px)', letterSpacing:'0.09em', textTransform:'uppercase' as const, display:'block' },
    select:     { width:'100%', padding:'clamp(7px, 1.5vw, 11px) clamp(10px, 2vw, 14px)', background:'#ffffff', border:'1.5px solid #e5e7eb', borderRadius:9, color:'#374151', fontSize:'clamp(11px, 2vw, 13px)', outline:'none', cursor:'pointer', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' } as React.CSSProperties,
    input:      { width:'100%', padding:'clamp(7px, 1.5vw, 11px) clamp(10px, 2vw, 14px)', background:'#ffffff', border:'1.5px solid #e5e7eb', borderRadius:9, color:'#374151', fontSize:'clamp(11px, 2vw, 13px)', outline:'none', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' } as React.CSSProperties,
    btn:        (color = '#6366f1', textColor = '#fff') => ({ padding:'clamp(6px, 1.5vw, 10px) clamp(10px, 2vw, 16px)', background:color, border:'none', borderRadius:8, color:textColor, fontSize:'clamp(10px, 1.8vw, 12px)', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5, transition:'all 0.15s', whiteSpace:'nowrap' as const }),
    outlineBtn: { padding:'clamp(6px, 1.5vw, 10px) clamp(10px, 2vw, 14px)', background:'#f8fafc', border:'1.5px solid #e5e7eb', borderRadius:8, color:'#6b7280', fontSize:'clamp(10px, 1.8vw, 12px)', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:5, transition:'all 0.15s', whiteSpace:'nowrap' as const },
  };

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (authLoading) return (
    <div style={{position:'fixed',inset:0,background:'rgba(255,255,255,0.95)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}}>
      <div style={{width:48,height:48,borderRadius:'50%',border:'3px solid #e5e7eb',borderTopColor:'#6366f1',animation:'spin 0.8s linear infinite'}} />
      <div style={{fontSize:18,fontWeight:800,color:'#111827'}}>Initializing TrustInn</div>
      <div style={{fontSize:13,color:'#9ca3af'}}>Validating your session...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!isAuthenticated && !showOTPModal) return <NoAccessError />;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'#f8fafc', color:'#111827', overflow:'hidden' }} className="tools-component-root">
      <style>{`
        @media (max-width: 1024px) {
          .tools-component-root > div:nth-child(3) {
            grid-template-columns: 1fr !important;
          }
          .tools-component-root > div:nth-child(3) > div:first-child {
            border-right: none !important;
            border-bottom: 1.5px solid #e5e7eb !important;
          }
        }
        @media (max-width: 768px) {
          .tools-component-root header { flex-direction: column; gap: 8px; }
          .tools-component-root header > div:last-child { width: 100%; justify-content: center; flex-wrap: wrap; }
        }
      `}</style>

      {/* ── Header ── */}
      <header style={{ height:'clamp(50px, 8vh, 70px)', borderBottom:'1.5px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 clamp(12px, 4vw, 24px)', background:'#ffffff', boxShadow:'0 1px 8px rgba(0,0,0,0.06)', flexShrink:0, zIndex:10 }}>
        <div style={{display:'flex',alignItems:'center',gap:'clamp(6px, 2vw, 12px)'}}>
          <img src="/logo.png" alt="TrustInn" style={{height:'clamp(28px, 5vh, 40px)',width:'auto'}} onError={(e:any) => { e.target.style.display='none'; }}/>
          <div>
            <div style={{fontSize:'clamp(12px, 2.5vw, 16px)',fontWeight:800,letterSpacing:'-0.03em',color:'#111827'}}>TrustInn</div>
            <div style={{fontSize:'clamp(8px, 1.8vw, 11px)',color:'#9ca3af'}}>NITMiner Technologies Pvt Ltd</div>
          </div>
        </div>
        {isAuthenticated && user && (
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <button onClick={() => setShowTour(true)} style={{...S.btn('#eef2ff','#4f46e5'), border:'1.5px solid #c7d2fe'}}>? Tour</button>
            <button onClick={() => setShowSessionModal(true)} style={{...S.btn('linear-gradient(135deg,#6366f1,#8b5cf6)')}}>Session Info</button>
            <button
              onClick={() => redirectToNitMiner('/dashboard')}
              style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#3b82f6)',border:'none',color:'#fff',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 10px rgba(99,102,241,0.3)',padding:0}}
            >
              <FaUser size={16} />
            </button>
          </div>
        )}
      </header>

      {/* ── Language Tabs ── */}
      <div style={{ display:'flex', gap:6, padding:'14px 24px', borderBottom:'1.5px solid #e5e7eb', background:'#ffffff', flexShrink:0, flexWrap:'wrap' }}>
        {([{id:'c',label:'C',Icon:Code2,color:'#1572B6'},{id:'java',label:'Java',Icon:FaJava,color:'#F8981D'},{id:'python',label:'Python',Icon:SiPython,color:'#3776ab'},{id:'solidity',label:'Solidity',Icon:SiSolidity,color:'#363636'}] as const).map(tab => (
          <button key={tab.id} onClick={() => switchTab(tab.id)} style={{
            padding:'10px 22px', borderRadius:9,
            background: currentTab===tab.id ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#f8fafc',
            border: currentTab===tab.id ? '1.5px solid #6366f1' : '1.5px solid #e5e7eb',
            color: currentTab===tab.id ? '#fff' : '#6b7280',
            fontSize:'clamp(12px,3vw,16px)', fontWeight:700, cursor:'pointer',
            display:'flex', alignItems:'center', gap:8,
            boxShadow: currentTab===tab.id ? '0 2px 12px rgba(99,102,241,0.25)' : '0 1px 3px rgba(0,0,0,0.04)',
            transition:'all 0.2s',
          }}>
            <span style={{ display:'inline-flex', color: currentTab===tab.id ? '#fff' : tab.color, fontSize:'inherit' }}>
              <tab.Icon size={20} />
            </span>
            <span style={{ whiteSpace:'nowrap' }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Main Layout ── */}
      <div style={{ flex:1, display:'grid', gridTemplateColumns:'clamp(300px, 40%, 600px) 1fr', overflow:'hidden', minHeight:0 }}>

        {/* ─ Left Panel ─ */}
        <div style={{ borderRight:'1.5px solid #e5e7eb', background:'#ffffff', display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 }}>
          <div style={{ flex:1, minHeight:0, overflowY:'auto', padding:'clamp(10px, 2vw, 16px)' }}>

            {/* Upload Card */}
            <div style={S.card}>
              <span style={S.label}>Upload & Configure</span>

              {/* Mode Toggle */}
              <div style={{display:'flex',gap:3,background:'#f1f5f9',borderRadius:9,padding:3,marginBottom:12}}>
                {(['file','code'] as const).map(m => (
                  <button key={m} onClick={() => setInputMode(m)} style={{
                    flex:1, padding:'6px 0', borderRadius:7,
                    background: inputMode===m ? '#ffffff' : 'transparent',
                    border: inputMode===m ? '1.5px solid #c7d2fe' : '1.5px solid transparent',
                    color: inputMode===m ? '#4f46e5' : '#9ca3af',
                    fontSize:11, fontWeight:700, cursor:'pointer',
                    boxShadow: inputMode===m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    transition:'all 0.15s',
                  }}>
                    {m==='file' ? '⬆ Upload File' : '</> Write Code'}
                  </button>
                ))}
              </div>

              {inputMode === 'file' ? (
                <div>
                  <div onClick={() => browseFile(currentTab)} style={{ border:'2px dashed #c7d2fe', borderRadius:12, padding:'18px 12px', textAlign:'center', background:'#eef2ff', cursor:'pointer', marginBottom:10 }}>
                    <div style={{fontSize:22,marginBottom:4}}>☁</div>
                    <div style={{fontSize:11,color:'#6b7280',marginBottom:8}}>Drag & Drop {currentTab.toUpperCase()} file or</div>
                    {currentFile?.type === currentTab ? (
                      <div style={{fontSize:11,color:'#059669',fontWeight:700,background:'#f0fdf4',border:'1.5px solid #bbf7d0',borderRadius:7,padding:'4px 10px',display:'inline-block'}}>✓ {currentFile.file.name}</div>
                    ) : (
                      <div style={{fontSize:11,color:'#6366f1',fontWeight:700,background:'#ffffff',border:'1.5px solid #c7d2fe',borderRadius:7,padding:'5px 14px',display:'inline-block',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>Browse File</div>
                    )}
                  </div>
                  <input ref={fileInputRefs[currentTab]} type="file"
                    accept={currentTab==='solidity'?'.sol':currentTab==='java'?'.java':currentTab==='python'?'.py':'.c'}
                    onChange={e => handleFileSelect(e, currentTab)} style={{display:'none'}} />

                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:6}}>
                    <button onClick={() => showSampleCode(currentTab)} disabled={loadingSamples} style={{...S.outlineBtn, justifyContent:'center'}}>
                      {loadingSamples ? <FaSpinner style={{animation:'spin 1s linear infinite'}} /> : '📂'} Load Sample
                    </button>
                    <button onClick={() => viewFile(currentTab)} style={{...S.outlineBtn, justifyContent:'center', display:'flex', alignItems:'center', gap:6}}>
                      <FiEye size={14} /> View File
                    </button>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                    <button onClick={() => executeCommand(currentTab)} disabled={loading}
                      style={{...S.btn(loading?'#d1fae5':'linear-gradient(135deg,#059669,#10b981)',loading?'#059669':'#fff'), justifyContent:'center', padding:'9px 0', opacity:loading?0.8:1}}>
                      {loading ? <><FaSpinner style={{animation:'spin 1s linear infinite'}} size={14}/> Running...</> : '▶ Execute'}
                    </button>
                    <button onClick={() => compileCode(currentTab)} disabled={loading||isCompiling}
                      style={{...S.btn(isCompiling?'#fed7aa':'linear-gradient(135deg,#ea580c,#f97316)',isCompiling?'#c2410c':'#fff'), justifyContent:'center', padding:'9px 0', opacity:isCompiling?0.8:1}}>
                      {isCompiling ? <><FaSpinner style={{animation:'spin 1s linear infinite'}} size={14}/> Compiling...</> : '⚙ Compile'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{background:'#fffbeb',border:'1.5px solid #fcd34d',borderRadius:9,padding:'8px 12px',marginBottom:10,fontSize:11,color:'#92400e',lineHeight:1.5}}>
                    ⚠️ <b>Note:</b> User input (scanf, input()) is disabled during execution.
                  </div>
                  <Suspense fallback={<div style={{height:180,background:'#f1f5f9',borderRadius:10}}/>}>
                    <CodeEditor
                      code={userCode[currentTab]}
                      language={currentTab}
                      onCodeChange={code => setUserCode(prev => ({ ...prev, [currentTab]:code }))}
                      onExecute={() => executeCommand(currentTab)}
                      isExecuting={loading}
                      terminalOutput={terminalOutputs[currentTab] || ''}
                      toolSelected={currentTab==='c'?!!cTool:currentTab==='java'?!!javaTool:currentTab==='python'?!!pythonTool:!!solidityTool}
                      onCompile={() => compileCode(currentTab)}
                      isCompiling={isCompiling}
                    />
                  </Suspense>
                </div>
              )}
            </div>

            {/* Tool Configuration */}
            <div style={S.card}>
              <span style={S.label}>Tool Configuration</span>
              <div style={{marginBottom:10}}>
                <label style={{fontSize:11,color:'#6b7280',fontWeight:600,display:'block',marginBottom:5}}>Security Tool</label>
                <select
                  value={currentTab==='c'?cTool:currentTab==='java'?javaTool:currentTab==='python'?pythonTool:solidityTool}
                  onChange={e => {
                    if (currentTab==='c') setCTool(e.target.value);
                    else if (currentTab==='java') setJavaTool(e.target.value);
                    else if (currentTab==='python') setPythonTool(e.target.value);
                    else setSolidityTool(e.target.value);
                  }}
                  style={S.select}
                >
                  <option value="">Select a tool</option>
                  {currentTab==='c' && <>
                    <option value="Condition Satisfiability Analysis">CC-Bounded Model Checker</option>
                    <option value="DSE based Mutation Analyser">CC-DSE Mutation Analyser</option>
                    <option value="Dynamic Symbolic Execution">CC-Dynamic Symbolic Execution</option>
                    <option value="Dynamic Symbolic Execution with Pruning">CC-DSE with Pruning</option>
                    <option value="Advance Code Coverage Profiler">Advance Code Coverage Profiler</option>
                    <option value="Mutation Testing Profiler">Mutation Testing Profiler</option>
                  </>}
                  {currentTab==='java'     && <option value="JBMC">JBMC - Java Bounded Model Checker</option>}
                  {currentTab==='python'   && <option value="Condition Coverage Fuzzing">Condition Coverage Fuzzing</option>}
                  {currentTab==='solidity' && <option value="VeriSol">VeriSol - Smart Contract Verifier</option>}
                </select>
              </div>

              {/* Parameters */}
              {currentTab==='c' && cTool==='Condition Satisfiability Analysis' && (
                <div style={{background:'#eff6ff',border:'1.5px solid #bfdbfe',borderRadius:10,padding:'12px'}}>
                  <label style={{fontSize:11,color:'#1d4ed8',fontWeight:600,display:'block',marginBottom:6}}>Unwind Bound</label>
                  <input type="number" value={cbmcBound} onChange={e=>setCbmcBound(e.target.value)} style={S.input}/>
                </div>
              )}
              {currentTab==='c' && cTool==='DSE based Mutation Analyser' && (
                <div style={{background:'#eff6ff',border:'1.5px solid #bfdbfe',borderRadius:10,padding:'12px'}}>
                  <label style={{fontSize:11,color:'#1d4ed8',fontWeight:600,display:'block',marginBottom:6}}>Tool Value</label>
                  <select value={kleemaValue} onChange={e=>setKleemaValue(e.target.value)} style={S.select}>
                    <option value="1">1</option><option value="2">2</option>
                  </select>
                </div>
              )}
              {currentTab==='c' && (cTool==='Advance Code Coverage Profiler' || cTool==='Mutation Testing Profiler') && (
                <div style={{background:'#eff6ff',border:'1.5px solid #bfdbfe',borderRadius:10,padding:'12px',display:'flex',flexDirection:'column',gap:8}}>
                  <div>
                    <label style={{fontSize:11,color:'#1d4ed8',fontWeight:600,display:'block',marginBottom:5}}>Version</label>
                    <select value={cTool==='Advance Code Coverage Profiler'?gmcovVersion:gmutantVersion}
                      onChange={e=>cTool==='Advance Code Coverage Profiler'?setGmcovVersion(e.target.value):setGmutantVersion(e.target.value)} style={S.select}>
                      <option value="4">4</option>
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:11,color:'#1d4ed8',fontWeight:600,display:'block',marginBottom:5}}>Time Bound (s)</label>
                    <input type="number" value={cTool==='Advance Code Coverage Profiler'?gmcovTimebound:gmutantTimebound}
                      onChange={e=>cTool==='Advance Code Coverage Profiler'?setGmcovTimebound(e.target.value):setGmutantTimebound(e.target.value)} style={S.input}/>
                  </div>
                  {cTool==='Mutation Testing Profiler' && (
                    <div style={{background:'#fffbeb',border:'1.5px solid #fcd34d',borderRadius:8,padding:'8px 10px',fontSize:10,color:'#92400e',lineHeight:1.5}}>
                      ⚠️ Generates mutants from C source. Requires <code style={{background:'#fef3c7',padding:'1px 4px',borderRadius:3}}>main()</code> function.
                    </div>
                  )}
                </div>
              )}
              {currentTab==='solidity' && solidityTool==='VeriSol' && (
                <div style={{background:'#eff6ff',border:'1.5px solid #bfdbfe',borderRadius:10,padding:'12px'}}>
                  <label style={{fontSize:11,color:'#1d4ed8',fontWeight:600,display:'block',marginBottom:6}}>Verification Mode</label>
                  <select value={solidityMode} onChange={e=>setSolidityMode(e.target.value)} style={S.select}>
                    <option value="bmc">Bounded Model Checker</option>
                    <option value="chc">Constrained Horn Clauses</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─ Terminal Panel ─ */}
        <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', background:'#f8fafc', minHeight:0 }}>

          {/* Toolbar */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'clamp(8px, 1.5vw, 12px) clamp(12px, 2.5vw, 18px)', borderBottom:'1.5px solid #e5e7eb', flexShrink:0, background:'#ffffff', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', gap:'clamp(6px, 1.5vw, 10px)', flexWrap:'wrap' }}>
            <div style={{display:'flex',alignItems:'center',gap:'clamp(5px, 1vw, 8px)'}}>
              {['#ef4444','#f59e0b','#10b981'].map((c,i)=><div key={i} style={{width:'clamp(8px, 1.5vw, 12px)',height:'clamp(8px, 1.5vw, 12px)',borderRadius:'50%',background:c,opacity:0.7}}/>)}
              <span style={{fontSize:'clamp(9px, 1.6vw, 11px)',color:'#9ca3af',marginLeft:'clamp(2px, 0.5vw, 4px)',letterSpacing:'0.09em',fontWeight:700}}>TERMINAL OUTPUT</span>
            </div>
            <div style={{display:'flex',gap:'clamp(4px, 1vw, 6px)',flexWrap:'wrap'}}>
              <button onClick={copyToClipboard} style={S.outlineBtn}>⧉ Copy</button>
              <button
                onClick={() => { if (isRunning && abortControllerRef.current) abortControllerRef.current.abort(); }}
                disabled={!isRunning}
                style={{...S.btn(isRunning?'#ef4444':'#f1f5f9',isRunning?'#fff':'#d1d5db'), opacity:isRunning?1:0.5, cursor:isRunning?'pointer':'not-allowed'}}>
                ⏹ Stop
              </button>
              <button onClick={() => downloadZip(currentTab)} disabled={!currentFile}
                style={{...S.outlineBtn, opacity:currentFile?1:0.5, cursor:currentFile?'pointer':'not-allowed'}}>
                🗜 ZIP
              </button>
              <button onClick={() => clearTerminal(currentTab)} style={S.outlineBtn}>✕ Clear</button>
              <button onClick={() => openAnalytics(currentTab)} style={{
                padding:'6px 14px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                border:'none', borderRadius:8, color:'#fff', fontSize:11, fontWeight:800, cursor:'pointer',
                display:'flex', alignItems:'center', gap:6, boxShadow:'0 2px 12px rgba(99,102,241,0.3)',
                letterSpacing:'0.02em',
              }}>
                📊 View Analytics →
              </button>
            </div>
          </div>

          {/* Terminal Output */}
          <div ref={terminalRef} style={{
            flex:1, minHeight:0, overflowY:'auto', padding:'14px 18px',
            fontFamily:"'DM Mono','Fira Code',monospace", fontSize:12, lineHeight:1.75,
            background:'#1a1f2e',
          }}>
            {loading ? (
              <div style={{height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:14}}>
                <div style={{display:'flex',gap:6}}>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{width:10,height:10,borderRadius:'50%',background:(['#10b981','#6366f1','#f59e0b'] as const)[i],animation:`bounce 1s ${i*0.2}s infinite`}}/>
                  ))}
                </div>
                <div style={{fontSize:13,color:'#6b7280'}}>Processing your request, please wait...</div>
              </div>
            ) : terminalLines.some(l => l.trim()) ? (
              terminalLines.map((line, i) => (
                <div key={i} style={{
                  display:'flex', gap:12, padding:'2px 6px', borderRadius:4, marginBottom:1,
                  background: getLineBg(line),
                }}>
                  <span style={{color:'#4b5563',flexShrink:0,userSelect:'none',fontSize:10,marginTop:2}}>
                    {String(i+1).padStart(3,'0')}
                  </span>
                  <span style={{color: getLineColor(line)}}>{line}</span>
                </div>
              ))
            ) : (
              <div style={{color:'#374151',padding:'40px 0',textAlign:'center'}}>
                <div style={{color:'#4b5563',fontSize:13}}>Terminal ready. Select a file and execute a tool.</div>
                <div style={{color:'#374151',fontSize:11,marginTop:6}}>Output will appear here after execution.</div>
              </div>
            )}
            {isRunning && (
              <div style={{display:'flex',gap:4,marginTop:10,paddingLeft:46}}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{width:5,height:5,borderRadius:'50%',background:'#6366f1',animation:`bounce 1s ${i*0.2}s infinite`}}/>
                ))}
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div style={{ display:'flex', alignItems:'center', gap:'clamp(10px, 2vw, 16px)', padding:'clamp(6px, 1.5vw, 10px) clamp(14px, 2.5vw, 20px)', borderTop:'1.5px solid #e5e7eb', background:'#ffffff', flexShrink:0, fontSize:'clamp(9px, 1.8vw, 11px)', color:'#9ca3af', flexWrap:'wrap' }}
          >
            <span style={{display:'flex',alignItems:'center',gap:5,fontWeight:700,color:isRunning?'#059669':'#9ca3af'}}>
              <span style={{width:'clamp(5px, 1vw, 7px)',height:'clamp(5px, 1vw, 7px)',borderRadius:'50%',background:isRunning?'#10b981':'#d1d5db',display:'inline-block'}}/>
              {isRunning ? 'RUNNING' : 'IDLE'}
            </span>
            <span style={{fontWeight:600}}>
              {currentTab.toUpperCase()} · {(currentTab==='c'?cTool:currentTab==='java'?javaTool:currentTab==='python'?pythonTool:solidityTool) || 'No tool selected'}
            </span>
            {currentFile?.type===currentTab && <span style={{color:'#6366f1',fontWeight:600}}>📄 {currentFile.file.name}</span>}
            <span style={{marginLeft:'auto',color:user?.isPremium?'#059669':'#f97316',fontWeight:700}}>
              {user?.isPremium ? '✓ Premium' : `${user?.trialCount ?? 0} trials left`}
            </span>
          </div>
        </div>
      </div>

      {/* Downloadable Files */}
      {downloadableFiles[currentTab]?.length > 0 && (
        <div style={{background:'#ffffff',borderTop:'1.5px solid #e5e7eb',padding:'12px 20px',flexShrink:0}}>
          <div style={{fontSize:12,fontWeight:800,color:'#374151',marginBottom:10,letterSpacing:'0.05em',textTransform:'uppercase',display:'flex',alignItems:'center',gap:8}}>
            <span>⬇</span> Generated Output Files
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {downloadableFiles[currentTab].map((file: any, i: number) => (
              <div key={i} style={{background:'#f8fafc',border:'1.5px solid #e5e7eb',borderRadius:10,padding:'8px 12px',display:'flex',alignItems:'center',gap:8,minWidth:160}}>
                <div style={{fontSize:14}}>📄</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:700,color:'#374151',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{file.displayName||file.name}</div>
                  {file.size && <div style={{fontSize:10,color:'#9ca3af'}}>{(file.size/1024).toFixed(1)} KB</div>}
                </div>
                <div style={{display:'flex',gap:4}}>
                  <button onClick={() => viewServerFile(file.downloadUrl, file.name)} style={{...S.btn('#10b981'), padding:'5px 9px', fontSize:10}}>👁</button>
                  <a href={file.downloadUrl} download style={{...S.btn('#6366f1'), padding:'5px 9px', fontSize:10, textDecoration:'none'}}>⬇</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{background:'#ffffff',borderTop:'1.5px solid #e5e7eb',padding:'clamp(8px, 1.5vw, 12px) clamp(14px, 2.5vw, 22px)',flexShrink:0,textAlign:'center',fontSize:'clamp(10px, 1.8vw, 12px)',color:'#9ca3af'}}>
        © 2026 <b style={{color:'#374151'}}>NITMiner Technologies Private Limited.</b> All rights reserved.
      </footer>

      {/* ─ Analytics Drawer ─ */}
      <AnalyticsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        chartData={chartData}
        chartType={chartType}
        setChartType={setChartType}
        visualizationTitle={visualizationTitle}
        loading={loading}
        downloadChartRef={downloadChartRef}
        onDownloadChart={downloadChart}
      />

      {/* ─ Modals ─ */}
      <FileViewerModal show={showFileViewer} content={fileContent} onClose={() => { setShowFileViewer(false); setFileContent(''); }} />
      <SamplesListModal show={showSamplesListModal} title={samplesListTitle} samples={samplesList} onSelect={selectSample} onClose={() => setShowSamplesListModal(false)} />
      <LanguageMismatchModal show={showLanguageMismatchModal} info={languageMismatchInfo} onClose={() => setShowLanguageMismatchModal(false)} />

      {showAuthModal && (
        <Suspense fallback={null}>
          <AuthModal isOpen={showAuthModal} reason={authModalReason} onClose={() => setShowAuthModal(false)} />
        </Suspense>
      )}
      {showOTPModal && user && (
        <Suspense fallback={null}>
          <OTPVerificationModal isOpen={showOTPModal} email={user.email} userId={user.id} onVerified={handleOTPVerified} onClose={() => setShowOTPModal(false)} />
        </Suspense>
      )}
      {showSessionModal && user && (
        <Suspense fallback={null}>
          <SessionCheckModal
            isOpen={showSessionModal}
            user={user}
            onClose={() => setShowSessionModal(false)}
            onRefresh={(refreshedUser) => {
              // Update user state with refreshed data from validate-nitminer-token
              console.log('[ToolsComponent] Updating user from session refresh:', {
                email: refreshedUser.email,
                trialCount: refreshedUser.trialCount,
                isPremium: refreshedUser.isPremium
              });
              setUser(refreshedUser);
            }}
          />
        </Suspense>
      )}

      {/* Tour — z-index 9999 so it always renders above the FAQ/chat widget */}
      {showTour && (
        <div style={{position:'fixed', inset:0, zIndex:9999, pointerEvents:'none'}}>
          <Suspense fallback={null}>
            <TourGuide
              steps={toolsPageTourSteps}
              onComplete={() => setShowTour(false)}
              autoStart={false}
              forceStart={showTour}
              storageKey="trustinn-tools-tour-completed"
            />
          </Suspense>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #c7d2fe; border-radius: 4px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
        button:hover:not(:disabled) { opacity: 0.88; }
        select option { background: #fff; color: #374151; }
      `}</style>
    </div>
  );
}