'use client';

import React, { useState, useMemo } from 'react';
import { MessageSquare, X, ChevronLeft, ChevronDown, ChevronUp, Search, Headphones, AlertCircle } from 'lucide-react';

// FAQ Data
const FAQ_DATA = [
  {
    section: 'What is TrustInn?',
    questions: [
      {
        q: 'What is TrustInn and what does it do?',
        a: 'TrustInn is a software verification and testing tool that uses advanced techniques like Dynamic Symbolic Execution (DSE), Bounded Model Checking, and Condition Coverage to mathematically verify that your code is safe and bug-free.'
      },
      {
        q: 'Why should I use TrustInn?',
        a: 'TrustInn finds bugs that traditional testing misses by exploring every possible execution path in your code mathematically. It\'s perfect for safety-critical systems where failures are not acceptable.'
      },
      {
        q: 'What programming languages does TrustInn support?',
        a: 'TrustInn supports C/C++, Java, and Python. Each language has specialized tools optimized for maximum code verification accuracy.'
      }
    ]
  },
  {
    section: 'Technical Concepts',
    questions: [
      {
        q: 'What is JBMC (Java Bounded Model Checker)?',
        a: 'JBMC is a formal verification tool for Java that checks Java bytecode for bugs like memory violations, overflow errors, and logical failures by converting code into mathematical logic and checking all possible paths.'
      },
      {
        q: 'What is Dynamic Symbolic Execution (DSE)?',
        a: 'DSE is a hybrid technique that runs code with real inputs while tracking logic mathematically. It automatically finds inputs that trigger bugs by using a constraint solver to explore different code paths.'
      },
      {
        q: 'What is Condition Coverage?',
        a: 'Condition Coverage ensures every atomic part of a logical condition is tested. Instead of just checking if an if-statement is true/false, it verifies each component of complex logical expressions independently.'
      },
      {
        q: 'What is Mutation Testing?',
        a: 'Mutation Testing intentionally injects small bugs (mutations) into code to verify that your test suite can catch them. A high mutation score means your tests are effective at finding real errors.'
      }
    ]
  },
  {
    section: 'TrustInn Java Workflow',
    questions: [
      {
        q: 'How do I start analyzing Java code with TrustInn?',
        a: 'Step 1: Select TrustInn Tool for Java Language. Step 2: Select the Tool (e.g., Bounded Model Checker - JBMC) from the dropdown menu. Step 3: Upload your Java program or write code directly in TrustInn. Step 4: Click Execute to analyze and get results.'
      },
      {
        q: 'How do I upload a Java program to TrustInn?',
        a: 'After selecting JBMC tool: (Option A) Browse and upload your .java file, (Option B) Click "Load Sample Code" to choose a pre-built Java program for testing, (Option C) Click "Write Code" to write Java code directly in the editor. Before uploading, ensure your tool is selected.'
      },
      {
        q: 'What can I do with the uploaded Java file?',
        a: 'Once uploaded: View the code in the file viewer, Edit the code inline, Execute the analysis by clicking "Execute" button. The tool will compile the Java code to bytecode and run verification. You\'ll see output results showing what was found.'
      },
      {
        q: 'How do I execute the Java code analysis?',
        a: 'After uploading or writing code: Click the green "Execute" button. TrustInn will compile your Java program to bytecode and run JBMC analysis. The system shows a loading indicator while processing. Results appear in seconds to minutes depending on code complexity.'
      },
      {
        q: 'What output options are available after execution?',
        a: 'After analysis completes, you can: (Copy) Copy the output text to clipboard, (Chart) Display results as pie/bar charts, (Download Chart) Save chart images, (ZIP) Download a zip file containing the Java source file and output document, (Clear) Clear results and start fresh.'
      },
      {
        q: 'What does the ZIP file contain?',
        a: 'The downloaded ZIP includes: Your original .java source file, The compiled .class bytecode file, The output document with analysis results. This is useful for archiving, sharing with team members, or importing into other tools.'
      },
      {
        q: 'How do I understand Java analysis results?',
        a: 'In the results section, look for: "Compilation: SUCCESS/FAILED", "JBMC Assertion Analysis" showing passed/failed checks, "Conditional Coverage %" showing test coverage (e.g., 25%), and "Detected Issues" listing specific problems found. A green checkmark means no bugs detected.'
      }
    ]
  },
  {
    section: 'Understanding Java Results',
    questions: [
      {
        q: 'What does "Compilation: SUCCESS" mean in the output?',
        a: 'It means your Java code was successfully converted to bytecode (.class file). Compilation is a required step before JBMC can analyze the code. If compilation fails, fix the Java syntax errors shown in the output.'
      },
      {
        q: 'What is "JBMC Assertion Analysis"?',
        a: 'JBMC Assertion Analysis tests all assertions in your Java code and checks for logical failures. It reports how many assertions passed, how many failed, and the specific conditions that caused failures. This helps identify logical errors in your code.'
      },
      {
        q: 'What does Conditional Coverage percentage mean?',
        a: 'A Conditional Coverage of 25% means TrustInn tested 25% of all possible Boolean conditions in your code. Higher percentages mean more thorough testing. Aim for 80%+ coverage to detect most hidden bugs. Low coverage indicates untested code paths.'
      },
      {
        q: 'Why is Java Conditional Coverage important?',
        a: 'Java Conditional Coverage helps reduce hidden bugs by ensuring every decision point in control structures (if, else, while, for) is tested in both true and false states. In production systems, it increases confidence that all code paths work correctly.'
      },
      {
        q: 'How does Java coverage differ from Python coverage?',
        a: 'Both measure Conditional Coverage the same way, but Java compiles to .class files while Python uses syntax checking instead. Java bytecode is faster to analyze. ZIP files for Java include .class files; Python includes only .py files. Both help identify untested logic paths.'
      }
    ]
  },
  {
    section: 'TrustInn Python Workflow',
    questions: [
      {
        q: 'How do I start analyzing Python code with TrustInn?',
        a: 'Step 1: Select TrustInn Tool for Python Language. Step 2: Select the Tool (e.g., Fuzzer or Symbolic Executor) from the dropdown menu. Step 3: Upload your Python program or write code directly in TrustInn. Step 4: Click Execute to analyze and get results.'
      },
      {
        q: 'How do I upload a Python program to TrustInn?',
        a: 'After selecting a Python tool: (Option A) Browse and upload your .py file, (Option B) Click "Load Sample Code" to choose a pre-built Python program for testing, (Option C) Click "Write Code" to write Python code directly in the editor. Before uploading, ensure your tool is selected.'
      },
      {
        q: 'What can I do with the uploaded Python file?',
        a: 'Once uploaded: View the code in the file viewer, Edit the code inline, Execute the analysis by clicking "Execute" button. The tool will perform syntax checking and run verification. You\'ll see output results showing what was found.'
      },
      {
        q: 'How do I execute the Python code analysis?',
        a: 'After uploading or writing code: Click the green "Execute" button. TrustInn will perform syntax checking on your Python program and run the verification tool. The system shows a loading indicator while processing. Results appear in seconds to minutes depending on code complexity.'
      },
      {
        q: 'What output options are available after Python execution?',
        a: 'After analysis completes, you can: (Copy) Copy the output text to clipboard, (Chart) Display results as pie/bar charts, (Download Chart) Save chart images, (ZIP) Download a zip file containing the Python source file and output document, (Clear) Clear results and start fresh.'
      },
      {
        q: 'What does the Python ZIP file contain?',
        a: 'The downloaded ZIP includes: Your original .py source file, The output document with analysis results. Unlike Java, Python does not generate .class files. This is useful for archiving, sharing with team members, or importing into other tools.'
      },
      {
        q: 'How do I understand Python analysis results?',
        a: 'In the results section, look for: "Syntax Check: SUCCESS/FAILED", "Assertion Summary" showing passed/failed checks, "Conditional Coverage %" showing test coverage (e.g., 95%), and "Detected Issues" listing specific problems found. A green checkmark means no bugs detected.'
      }
    ]
  },
  {
    section: 'Understanding Python Results',
    questions: [
      {
        q: 'What does "Syntax Check: SUCCESS" mean for Python?',
        a: 'It means your Python code has valid syntax and can be executed. Syntax checking is a required step before verification can analyze the code. If syntax check fails, fix the Python errors shown in the output (indentation, brackets, etc.).'
      },
      {
        q: 'What is "Assertion Summary"?',
        a: 'The Assertion Summary tests all assertions in your Python code and checks for logical failures. It reports how many assertions passed, how many failed, and the specific conditions that caused failures. This helps identify logical errors in your code.'
      },
      {
        q: 'What does Conditional Coverage percentage mean for Python?',
        a: 'Conditional Coverage measures whether each Boolean expression (true/false) in control structures (if, while, for) has been tested as both true and false. A 95% coverage means almost all logical conditions were fully tested. Higher coverage proves thorough testing.'
      },
      {
        q: 'Why is Python Conditional Coverage important?',
        a: 'Python Conditional Coverage helps reduce hidden bugs in complex logic by ensuring every decision point is tested in both states. In production systems, it ensures data processing logic works correctly. In data science, it validates algorithm logic. Higher coverage increases confidence in code reliability.'
      },
      {
        q: 'How does Python coverage differ from Java coverage?',
        a: 'Python skips compilation to bytecode (uses syntax check instead), and doesn\'t generate .class files. The ZIP file for Python contains only the Python program and output document. Both measure Conditional Coverage percentage the same way and help identify untested logic paths.'
      }
    ]
  },
  {
    section: 'Getting Started',
    questions: [
      {
        q: 'How do I get started with TrustInn?',
        a: 'For Java: Follow TrustInn Java Workflow section. For Python: Follow TrustInn Python Workflow section. For other languages: Upload your source code to the TrustInn platform. Our system will automatically analyze it using advanced verification techniques and provide detailed reports.'
      },
      {
        q: 'What file formats does TrustInn accept?',
        a: 'TrustInn accepts C/C++ source files (.c, .cpp), Java source files (.java), Java bytecode (.class, .jar), and Python scripts (.py) depending on your project type.'
      },
      {
        q: 'How long does analysis take?',
        a: 'Analysis time depends on code complexity. Simple Java programs typically complete in seconds to minutes. Simple Python scripts complete in seconds. Complex safety-critical systems may take hours. Most analyses run in the background while you work.'
      },
      {
        q: 'Can I write code directly in TrustInn without uploading?',
        a: 'Yes. Click "Write Code" to access the code editor where you can write Java or Python code directly in TrustInn. After writing, you can execute the code and get analysis results immediately.'
      },
      {
        q: 'What if I don\'t have code to test?',
        a: 'Click "Load Sample Code" to choose pre-built programs (Java or Python) for testing and learning. This helps you understand how TrustInn works without needing to write code from scratch.'
      }
    ]
  },
  {
    section: 'Results & Reports',
    questions: [
      {
        q: 'What information does TrustInn provide in reports?',
        a: 'Reports include: Code coverage metrics (Conditional Coverage %), Detection of failed assertions with locations, JBMC/Fuzzing analysis results, test cases that trigger each issue, Mutation scores, and formal verification results for safety-critical code.'
      },
      {
        q: 'What does a Mutation Score mean?',
        a: 'A higher mutation score means your code is more robust. A score of 80% means your tests caught 80% of the injected fake bugs, indicating good test coverage and code reliability. Mutation testing verifies your test quality.'
      },
      {
        q: 'Can I export the analysis results?',
        a: 'Yes. TrustInn supports multiple export options: Download as ZIP with program/output files, Download charts as images, Copy output to clipboard, and export reports in PDF, JSON, and HTML formats.'
      },
      {
        q: 'What do pie charts and bar charts show?',
        a: 'Pie charts show the proportion of passed vs failed assertions or coverage distribution. Bar charts compare metrics across different test runs or display assertion results visually. Both charts can be downloaded for documentation and presentations.'
      }
    ]
  }
];

export default function TrustInnChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [agentConnected, setAgentConnected] = useState(false);
  const [agentUnavailable, setAgentUnavailable] = useState(false);
  const [agentMessages, setAgentMessages] = useState<any[]>([]);
  const [agentInput, setAgentInput] = useState('');

  // Filter FAQ based on search
  const filteredFAQ = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_DATA;
    
    const query = searchQuery.toLowerCase();
    return FAQ_DATA.map(category => ({
      ...category,
      questions: category.questions.filter(q => 
        q.q.toLowerCase().includes(query) || 
        q.a.toLowerCase().includes(query)
      )
    })).filter(category => category.questions.length > 0);
  }, [searchQuery]);

  const handleConnectToAgent = () => {
    setIsAgentMode(true);
    setAgentMessages([]);
    setAgentUnavailable(false);
    setAgentConnected(false);
    setAgentMessages([{ role: 'system', content: 'Connecting to support agent...' }]);
    
    // Simulate 5-minute timeout
    setTimeout(() => {
      if (!agentConnected) {
        setAgentUnavailable(true);
        setAgentMessages(prev => [...prev, { 
          role: 'system', 
          content: 'Our support agents are currently unavailable. Please try again later or email us at support@trustinn.com' 
        }]);
      }
    }, 5 * 60 * 1000); // 5 minutes
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen ? (
        <button onClick={() => setIsOpen(true)} className="bg-blue-600 p-4 rounded-full shadow-2xl text-white hover:scale-110 transition-all flex items-center gap-2">
          <MessageSquare size={24} />
          <span className="font-bold pr-1 text-sm">Support</span>
        </button>
      ) : (
        <div className="bg-white w-96 max-h-[600px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              {isAgentMode ? <Headphones size={22} /> : <MessageSquare size={22} />}
              <h3 className="font-bold text-sm">
                {isAgentMode ? 'Support Agent' : 'TrustInn Help Center'}
              </h3>
            </div>
            <button onClick={() => { setIsOpen(false); setSelectedQuestion(null); setIsAgentMode(false); }} className="hover:bg-white/10 p-1.5 rounded-full">
              <X size={20} />
            </button>
          </div>

          {/* Search Bar - only show in FAQ mode */}
          {!isAgentMode && !selectedQuestion && (
            <div className="p-3 border-b bg-gray-50">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4">
            {isAgentMode ? (
              // Agent Chat View
              <div className="flex flex-col h-full space-y-4">
                {agentUnavailable && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                    <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-red-700">
                      <strong>Agents Unavailable</strong>
                      <p>Please try again later</p>
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => setIsAgentMode(false)}
                  className="flex items-center gap-1 text-blue-600 text-xs font-bold hover:underline"
                >
                  <ChevronLeft size={16} /> Back to Help Center
                </button>

                <div className="flex-1 overflow-y-auto space-y-3">
                  {agentMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs rounded-lg p-3 text-sm ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : msg.role === 'system'
                          ? 'bg-gray-200 text-gray-700 rounded-tl-none italic'
                          : 'bg-gray-100 text-gray-900 rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedQuestion ? (
              // Question Answer View
              <div className="space-y-4">
                <button 
                  onClick={() => setSelectedQuestion(null)}
                  className="flex items-center gap-1 text-blue-600 text-xs font-bold hover:underline"
                >
                  <ChevronLeft size={16} /> Back
                </button>
                
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <h2 className="text-base font-bold text-gray-800 mb-3">{selectedQuestion.q}</h2>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedQuestion.a}</p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs text-green-700"><strong>✓ Helpful?</strong> This answer covers your question based on our knowledge base.</p>
                </div>
              </div>
            ) : (
              // FAQ List View
              <div className="space-y-3">
                {filteredFAQ.map((category) => (
                  <div key={category.section} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedSection(expandedSection === category.section ? null : category.section)}
                      className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors"
                    >
                      <span className="font-semibold text-sm text-gray-800">{category.section}</span>
                      {expandedSection === category.section ? 
                        <ChevronUp size={18} className="text-blue-600" /> : 
                        <ChevronDown size={18} className="text-gray-600" />
                      }
                    </button>

                    {expandedSection === category.section && (
                      <div className="bg-white border-t border-gray-200">
                        {category.questions.map((question, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedQuestion(question)}
                            className="w-full text-left p-3 border-b border-gray-100 hover:bg-blue-50 transition-colors last:border-0 group"
                          >
                            <p className="text-xs font-medium text-gray-800 leading-relaxed group-hover:text-blue-600">
                              {question.q}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {filteredFAQ.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">No questions found. Try different keywords.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer - Connect to Agent Button (only in FAQ mode) */}
          {!isAgentMode && (
            <div className="border-t bg-white p-4">
              <button
                onClick={handleConnectToAgent}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm transition-colors"
              >
                <Headphones size={16} />
                Connect to Live Agent
              </button>
            </div>
          )}

          {/* Agent Input Area - only show when agent connected */}
          {isAgentMode && agentConnected && (
            <div className="border-t bg-white p-3 flex gap-2">
              <input
                type="text"
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                placeholder="Type message..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition">
                Send
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
