'use client';

import { useState } from 'react';
import { FiTarget, FiZap, FiGlobe, FiArrowRight, FiAward, FiUsers, FiTrendingUp, FiBriefcase, FiBook, FiLock, FiCompass } from 'react-icons/fi';
import Link from 'next/link';

const metadata = {
  title: 'About TrustInn - Code Verification Platform',
  description: 'Learn about TrustInn - a comprehensive code verification and security analysis platform for C, Java, Python, and Solidity.',
};

export default function AboutTrustInnPage() {
  const [activeTab, setActiveTab] = useState('mission');

  const milestones = [
    { number: '100+', label: 'Tools Deployed', icon: FiBriefcase },
    { number: '10,000+', label: 'Projects Analyzed', icon: FiBook },
    { number: '99.9%', label: 'Uptime', icon: FiLock },
    { number: '50K+', label: 'Active Users', icon: FiUsers }
  ];

  const values = [
    {
      title: 'Security',
      description: 'Advanced verification and analysis to ensure code safety and correctness',
      icon: FiLock,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Reliability',
      description: 'Enterprise-grade tools with proven track record in code verification',
      icon: FiAward,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Innovation',
      description: 'Cutting-edge verification techniques and continuous improvements',
      icon: FiZap,
      color: 'from-blue-600 to-indigo-600'
    },
    {
      title: 'Accessibility',
      description: 'Easy-to-use interface making advanced tools available to everyone',
      icon: FiUsers,
      color: 'from-indigo-500 to-purple-600'
    }
  ];

  const visionPoints = [
    { title: 'Global Security', icon: FiGlobe, color: 'text-purple-600' },
    { title: 'Code Excellence', icon: FiCompass, color: 'text-purple-600' },
    { title: 'Continuous Innovation', icon: FiZap, color: 'text-purple-600' }
  ];

  return (
    <div className="w-full bg-white">
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-40"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full blur-3xl opacity-40"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
            About <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">TrustInn</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Trusted by developers worldwide for secure, comprehensive code verification and analysis across multiple programming languages
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300">
              Get Started
              <FiArrowRight />
            </Link>
            <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 border-2 border-slate-300 text-slate-700 font-bold rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all duration-300">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* MISSION, VISION, VALUES TABS SECTION */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 text-center mb-12 sm:mb-16">Our Foundation</h2>
          
          {/* Tab buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12">
            {[
              { id: 'mission', label: 'Mission', icon: FiTarget },
              { id: 'vision', label: 'Vision', icon: FiZap },
              { id: 'values', label: 'Values', icon: FiGlobe }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-lg transition-all flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 sm:p-12 border-2 border-blue-200 shadow-lg">
            {activeTab === 'mission' && (
              <div className="text-center">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4">Our Mission</h3>
                <p className="text-lg text-slate-700 leading-relaxed max-w-3xl mx-auto">
                  To provide developers and enterprises with the most advanced code verification and security analysis tools. We empower teams to write secure, reliable code and deploy with confidence across C, Java, Python, and Solidity smart contracts.
                </p>
              </div>
            )}

            {activeTab === 'vision' && (
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-8 text-center">Our Vision</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {visionPoints.map((point, idx) => {
                    const Icon = point.icon;
                    return (
                      <div key={idx} className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                        <Icon className={`w-12 h-12 ${point.color} mx-auto mb-3`} />
                        <h4 className="font-bold text-slate-900 text-lg">{point.title}</h4>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'values' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {values.map((value, idx) => {
                  const Icon = value.icon;
                  return (
                    <div key={idx} className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${value.color} flex items-center justify-center mb-4 text-white`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-lg mb-2">{value.title}</h4>
                      <p className="text-slate-600">{value.description}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* MILESTONES SECTION */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 text-center mb-12 sm:mb-16">Our Achievements</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {milestones.map((milestone, idx) => {
              const Icon = milestone.icon;
              return (
                <div key={idx} className="bg-white rounded-xl p-6 sm:p-8 text-center hover:shadow-xl transition-all hover:scale-105 border-2 border-blue-200">
                  <Icon className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                  <div className="text-3xl sm:text-4xl font-black text-blue-600 mb-2">{milestone.number}</div>
                  <p className="text-sm sm:text-base font-bold text-slate-700">{milestone.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* LANGUAGES SUPPORT SECTION */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 text-center mb-12 sm:mb-16">Languages We Support</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: 'C',
                desc: 'Complete verification with CBMC and KLEE tools',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                name: 'Java',
                desc: 'Advanced analysis and testing frameworks',
                color: 'from-orange-500 to-red-500'
              },
              {
                name: 'Python',
                desc: 'Comprehensive coverage and fuzzing analysis',
                color: 'from-emerald-500 to-teal-500'
              },
              {
                name: 'Solidity',
                desc: 'Smart contract security and verification',
                color: 'from-purple-500 to-pink-500'
              }
            ].map((lang, idx) => (
              <div key={idx} className={`bg-gradient-to-br ${lang.color} rounded-xl p-8 text-white shadow-lg hover:shadow-2xl transition-shadow`}>
                <h3 className="text-3xl font-black mb-2">{lang.name}</h3>
                <p className="text-white/90">{lang.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">Ready to Verify Your Code?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Start with our free trial - no credit card required
          </p>
          <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300">
            Get Started Today
            <FiArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
}
