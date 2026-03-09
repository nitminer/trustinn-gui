'use client';

import { useState, useRef, useEffect } from 'react';
import { FiHelpCircle, FiX, FiSend, FiMinimize2, FiPhone, FiClock, FiAlertCircle, FiCheckCircle, FiChevronRight, FiLoader } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';

const FAQ_DATA = [
  // ============= GENERAL PLATFORM =============
  {
    id: 1,
    question: 'What is TrustInn?',
    answer: 'TrustInn is a comprehensive security analysis and code verification platform developed by NITMiner Technologies. It provides developers and security researchers with powerful tools to analyze, test, and verify code across multiple programming languages including C, Java, Python, and Solidity smart contracts. All 9 industry-leading verification tools are integrated into a single unified web interface for easy access and rapid analysis.'
  },
  {
    id: 2,
    question: 'What programming languages does TrustInn support?',
    answer: 'TrustInn supports verification and analysis for:\n\n• C/C++ - Full support with 6 tools\n• Java - Complete assertion verification\n• Python - Advanced fuzzing and coverage analysis\n• Solidity - Smart contract formal verification\n\nEach language has specialized tools optimized for its unique characteristics and security requirements.'
  },
  {
    id: 3,
    question: 'How many verification tools does TrustInn offer?',
    answer: 'TrustInn integrates 9 powerful security analysis tools:\n\n1. CBMC - Condition satisfiability testing\n2. KLEEMA - Mutation testing with DSE\n3. KLEE - Dynamic symbolic execution\n4. TX - Optimized path exploration\n5. gMCov - MC/DC coverage analysis\n6. gMutant - Mutation quality assessment\n7. JBMC - Java assertion verification\n8. Python Analyzer - Condition coverage fuzzing\n9. VeriSol - Smart contract verification\n\nAll tools are NASA-grade and enterprise-tested for security analysis.'
  },
  {
    id: 4,
    question: 'Who developed TrustInn?',
    answer: 'TrustInn is developed by NITMiner Technologies Pvt Ltd, a company dedicated to providing advanced security analysis and code verification solutions. We\'ve deployed 100+ tools globally and have analyzed 10,000+ projects with a 99.9% uptime guarantee, serving 50,000+ active users worldwide.'
  },

  // ============= GETTING STARTED =============
  {
    id: 5,
    question: 'How do I get started with TrustInn?',
    answer: 'Getting started is simple:\n\n1. Sign up for a free trial account (no credit card required)\n2. Log in to your TrustInn dashboard\n3. Select your programming language (C, Java, Python, or Solidity)\n4. Upload your code or write code in the editor\n5. Choose a verification tool appropriate for your needs\n6. Run analysis and get detailed security reports\n7. Download results as comprehensive reports or ZIP files\n\nThe entire process takes minutes from signup to results!'
  },
  {
    id: 6,
    question: 'How do I upload code to TrustInn?',
    answer: 'TrustInn supports two flexible input methods:\n\nMethod 1: File Upload\n- Click "Upload File" button\n- Drag and drop your code file\n- Supported: .c, .java, .py, .sol files\n- Maximum file size: Based on your plan\n\nMethod 2: Code Editor\n- Click "Write Code" tab\n- Type or paste your code directly\n- Full syntax highlighting for all languages\n- Template examples included\n\nBoth methods support multi-file projects depending on your plan.'
  },
  {
    id: 7,
    question: 'What file formats does TrustInn accept?',
    answer: 'TrustInn accepts source code files in these formats:\n\nC/C++: .c, .cpp, .h, .hpp files\nJava: .java source files and .class compiled files\nPython: .py Python script files\nSolidity: .sol smart contract files\n\nFor batch analysis, you can upload ZIP files containing multiple source files. The platform automatically detects the language.'
  },

  // ============= VERIFICATION TOOLS =============
  {
    id: 8,
    question: 'What is CBMC and when should I use it?',
    answer: 'CBMC (C Bounded Model Checker) performs condition satisfiability and test case reachability analysis for C/C++ code.\n\nUse CBMC for:\n- Testing if specific code paths are reachable\n- Finding constraints needed to reach code regions\n- Verifying conditional expressions\n- Bounded safety verification\n- Maximum bound value: 10-1000 depending on code complexity\n\nExample: Verify if a function can ever reach a specific error condition with given constraints.'
  },
  {
    id: 9,
    question: 'What is KLEEMA and how does mutation testing help?',
    answer: 'KLEEMA (DSE-based Mutation Analyzer) tests mutation scores using dynamic symbolic execution for C/C++ code.\n\nWhat it does:\n- Generates test cases that can kill (detect) mutants\n- Measures test suite quality\n- Identifies weak test cases\n- Suggests improvements to your verification\n\nTypical values: 0.5-2.0 mutation score range\nBenefits: Ensures your tests are comprehensive and can catch real bugs, not just basic errors.'
  },
  {
    id: 10,
    question: 'What is KLEE and how is it different from CBMC?',
    answer: 'KLEE (Dynamic Symbolic Execution) explores program paths systematically and generates test cases for C/C++ code.\n\nKLEE Features:\n- Automatic test case generation\n- Path exploration and coverage\n- Bug detection across multiple paths\n- Handles complex control flow\n\nKLEE vs CBMC:\n- CBMC: Bounded checking with quantified properties\n- KLEE: Dynamic exploration generating test inputs\n\nUse KLEE when you want automatic test case generation and high code coverage.'
  },
  {
    id: 11,
    question: 'What is gMCov and what is MC/DC coverage?',
    answer: 'gMCov (Advanced Code Coverage Profiler) measures Modified Condition/Decision Coverage (MC/DC) for C/C++ code.\n\nMC/DC Coverage analyzes:\n- All conditions in Boolean expressions\n- Each condition\'s independent effect on decision outcome\n- Critical for aerospace/defense software standards\n\nCoverage metrics:\n- Line coverage: Which lines executed\n- Branch coverage: Which branches taken\n- MC/DC: Each condition independently affects outcome\n\nUse gMCov for: NASA-grade verification, safety-critical systems, aviation/medical software compliance.'
  },
  {
    id: 12,
    question: 'What is gMutant and how does it differ from KLEEMA?',
    answer: 'gMutant (Mutation Testing Profiler) evaluates test quality by measuring mutation scores for C/C++ code.\n\ngMutant Features:\n- Comprehensive mutation score reports\n- Identifies untested code branches\n- Suggests test improvements\n- Version selection (3, 4, 5)\n- Configurable time bounds\n\nKLEEMA vs gMutant:\n- KLEEMA: Uses DSE for efficient mutation testing\n- gMutant: Traditional mutation testing with detailed metrics\n\nUse gMutant for: Detailed test quality analysis and comprehensive mutation reports.'
  },
  {
    id: 13,
    question: 'What is JBMC and what can it verify in Java?',
    answer: 'JBMC (Java Bounded Model Checker) verifies Java code properties and generates test cases.\n\nCapabilities:\n- Assertion verification\n- Bounded safety properties\n- Test case generation\n- Code reachability analysis\n- Exception path detection\n\nCommon uses:\n- Verify assertions never fail\n- Find inputs that violate properties\n- Generate comprehensive test cases\n- Detect unreachable code\n\nIdeal for: Java application security verification and test case generation.'
  },
  {
    id: 14,
    question: 'What is the Python Analyzer and how does fuzzing help?',
    answer: 'TrustInn\'s Python Analyzer performs condition coverage fuzzing for Python code.\n\nFeatures:\n- Automatic fuzzing test generation\n- Condition coverage measurement\n- Edge case detection\n- Format string analysis\n- Exception handling verification\n\nCoverage types:\n- Statement coverage: All statements executed\n- Branch coverage: All branches taken\n- Condition coverage: All conditions evaluated\n\nUse for: Python script security verification, edge case detection, test generation.'
  },
  {
    id: 15,
    question: 'Can TrustInn verify smart contracts and Solidity code?',
    answer: 'Yes! TrustInn provides VeriSol - Smart Contract Formal Verification.\n\nSolidity Features:\n- Formal verification of contract logic\n- Reentrancy attack detection\n- Integer overflow/underflow checks\n- State transition verification\n- Bytecode analysis mode available\n\nVerification modes:\n- BMC Mode: Bounded model checking (default)\n- Bytecode Mode: Verify compiled bytecode\n\nCritical for: DeFi applications, token contracts, finance dApps, secure smart contract deployment.'
  },

  // ============= FEATURES & FUNCTIONALITY =============
  {
    id: 16,
    question: 'Can I download my analysis results?',
    answer: 'Yes! TrustInn provides multiple download options:\n\nDownload Formats:\nPDF Reports - Formatted analysis results\nProject Archives - All files and results as ZIP\nCSV/JSON - Data export for further analysis\n\nWhat\'s included:\n- Complete analysis results\n- Coverage metrics and graphs\n- Test cases generated\n- Detailed recommendations\n- Execution logs\n\nAccess: Results are available for 30 days after analysis, or longer with extended plans.'
  },
  {
    id: 17,
    question: 'Can I run multiple analyses on the same code?',
    answer: 'Absolutely! TrustInn lets you:\n\n• Run different tools on same code file\n• Compare results across tools\n• Test with different parameters\n• Batch analyze multiple files\n• Each run counts as one execution\n\nExample workflow:\n1. Upload your C code\n2. Run CBMC with different bounds\n3. Run KLEE for test generation\n4. Run gMCov for coverage analysis\n5. Compare all results in one report\n\nBatch limits: Free plan allows 5 analyses/month, premium unlimited.'
  },
  {
    id: 18,
    question: 'What are the visualization features?',
    answer: 'TrustInn provides interactive visualizations for analysis results:\n\nChart Types:\n- Condition coverage breakdown (pie charts)\n- Mutation score comparisons (bar charts)\n- Test case distribution\n- Code coverage heatmaps\n- Tool comparison charts\n\nFeatures:\n- Hover tooltips for details\n- Export as PNG/JPG\n- Responsive design (mobile-friendly)\n- Real-time data updates\n- Custom color themes\n\nUse cases: Present results to teams, documentation, compliance reports, academic papers.'
  },
  {
    id: 19,
    question: 'How long do analyses typically take?',
    answer: 'Analysis time depends on code size and selected tool:\n\nFast (< 1 minute)\n- CBMC (small code)\n- JBMC assertion checking\n- Basic coverage analysis\n\nMedium (1-10 minutes)\n- KLEE path exploration\n- Python fuzzing\n- Solidity verification\n\nExtended (30+ minutes)\n- gMCov full coverage (5000+ lines)\n- gMutant comprehensive testing\n- Large codebase analysis\n\nTime limits: Based on your plan (3600s default for most tools). Premium plans offer up to 1 hour analysis time.'
  },

  // ============= AUTHENTICATION & ACCOUNTS =============
  {
    id: 20,
    question: 'Is authentication required to use TrustInn?',
    answer: 'Yes, authentication is required for all users:\n\nAuthentication Methods:\nEmail + Password - Standard login\nJWT Token - From NitMiner integration\nOAuth - Google authentication\nOTP - Email-based OTP verification\n\nWhy required:\n- Track execution usage and limits\n- Protect your analysis results\n- Manage billing and subscriptions\n- Enable collaboration features\n- Maintain audit logs\n\nFree trial: First 5 executions without payment - requires email only!'
  },
  {
    id: 21,
    question: 'How is my code and data kept private?',
    answer: 'TrustInn takes security and privacy seriously:\n\nSecurity Measures:\n- End-to-end encryption in transit\n- Military-grade AES-256 encryption at rest\n- Code never shared with third parties\n- Private analysis results, only you access them\n- Regular security audits and updates\n- Compliance with data protection regulations\n\nData Storage:\n- Results retained for 30-90 days\n- Automatic deletion after period\n- You can delete anytime from dashboard\n- No backup to external services\n\nEnterprise: We offer on-premises deployment for maximum security.'
  },
  {
    id: 22,
    question: 'Can I create team accounts?',
    answer: 'Team features are available with Team and Enterprise plans:\n\nTeam Features:\n- Multiple team members\n- Role-based access control (Admin, Analyst, Viewer)\n- Shared project dashboards\n- Invite team members via email\n- Audit logging for all actions\n- Centralized billing\n\nEnterprise Features:\n- Unlimited team members\n- Custom roles and permissions\n- On-premises deployment\n- Dedicated support team\n- Custom integration APIs\n\nPricing: Contact sales team for team/enterprise quotes.'
  },

  // ============= PRICING & BILLING =============
  {
    id: 23,
    question: 'What are the TrustInn pricing plans?',
    answer: 'TrustInn offers flexible pricing tiers:\n\nFree Trial Plan\n- ₹0 - 5 trial executions\n- All tools available\n- Full features\n- No credit card required\n- Perfect to start learning\n\n1-Year Plan\n- ₹5,000 - Unlimited executions\n- Priority support\n- Advanced analytics\n- Team features (basic)\n\n2-Year Plan\n- ₹10,000 - Unlimited executions\n- Highest value savings (50% discount)\n- Premium support\n- All features included\n- Team collaboration tools\n\nEnterprise Plan\n- Custom pricing\n- On-premises deployment\n- Dedicated team\n- SLA guarantees\n\nUpgrade anytime with instant activation!'
  },
  {
    id: 24,
    question: 'What are "executions" and why do they matter?',
    answer: 'An execution is one complete analysis run of your code:\n\nWhat counts as 1 execution:\n- Running CBMC on your C code = 1 execution\n- Running KLEE on same code = 1 more execution\n- Running gMCov coverage = 1 more execution\n\nExecution limits:\n📋 Free Plan: 5 executions total\n♾️ 1-Year Plan: Unlimited executions\n♾️ 2-Year Plan: Unlimited executions\n\nExample usage:\n- Small project: 3-5 executions\n- Medium project: 10-20 executions\n- Large project: 50+ executions\n\nRecommendation: For continuous development, unlimited plans are more cost-effective.'
  },
  {
    id: 25,
    question: 'Can I upgrade or downgrade my plan anytime?',
    answer: 'Yes! Plan changes are simple and flexible:\n\nUpgrade Anytime\n- Instant activation\n- Pro-rated billing\n- No cancellation penalty\n- Immediate access to new features\n\nDowngrade Later\n- Takes effect next billing cycle\n- No penalties or fees\n- Keep all completed analyses\n- Unused credits refunded\n\nBilling FAQs:\n- Yearly billing available (better rates)\n- Monthly billing option\n- Multiple payment methods\n- Invoice generation for records\n- No hidden fees\n\nChange plan: Go to Settings → Subscription → Change Plan'
  },

  // ============= SUPPORT & PAYMENTS =============
  {
    id: 26,
    question: 'What payment methods do you accept?',
    answer: 'TrustInn accepts multiple secure payment methods:\n\nCard Payments\n- Visa, Mastercard, American Express\n- Credit and debit cards\n- Secure processing via Razorpay\n\nDigital Wallets\n- Google Pay\n- Apple Pay\n- PhonePe, Paytm\n\nBank Transfers\n- Direct bank account transfer\n- NEFT/RTGS enabled\n- UPI payments\n\nSecurity: All payments use industry-standard encryption and PCI compliance protocols. Your payment information is never stored on TrustInn servers.'
  },
  {
    id: 27,
    question: 'Do I need a credit card for the free trial?',
    answer: 'No! The free trial requires NO credit card:\n\n✅ Free Trial Benefits:\n- 5 trial executions\n- Full access to all tools\n- No payment information needed\n- No auto-charges\n- Convert to paid plan anytime\n\n📝 Only required:\n- Valid email address\n- Create a password\n- Agree to terms\n\nAfter free trial expires:\n- Choose a paid plan to continue\n- Or request another trial period\n- No interruption if you upgrade\n\nPerfect for exploring TrustInn risk-free!'
  },
  {
    id: 28,
    question: 'Is there a refund policy?',
    answer: 'TrustInn offers customer-friendly refund options:\n\nRefund Eligibility:\n- Refunds within 7 days of purchase\n- Unused executions refunded in full\n- Partial refunds for unused period\n- Technical issues: 100% refund\n\nHow to request:\n- Contact support team\n- Provide order ID\n- Specify reason\n- 3-5 business days processing\n\nNo-questions asked: We believe in taking the risk out of your purchase!\n\nNote: Executed analyses cannot be refunded (they\'re consumed services like processed analysis).'
  },
  {
    id: 29,
    question: 'How can I contact TrustInn support?',
    answer: 'Multiple ways to reach our support team:\n\nLive Chat (Recommended)\n- Click "Live Agent" button above\n- Real-time response 9 AM - 6 PM IST\n- Average response: < 2 minutes\n\nEmail Support\n- support@trustinn.io\n- Response time: 24 hours\n- Detailed technical help\n\nHelp Documentation\n- Comprehensive guides and tutorials\n- Video walkthroughs\n- Troubleshooting section\n- FAQ and knowledge base\n\nCommunity Forum\n- Ask other users\n- Share experiences\n- Best practices discussion\n\nPremium users get 2-hour response priority and direct phone line.'
  },

  // ============= TECHNICAL & TROUBLESHOOTING =============
  {
    id: 30,
    question: 'What are the system requirements to use TrustInn?',
    answer: 'TrustInn is web-based - minimal requirements:\n\nSupported Browsers:\n- Chrome 90+\n- Firefox 88+\n- Safari 14+\n- Edge 90+\n- Mobile browsers supported\n\nMinimum System Requirements:\n- Internet connection: 2 Mbps+\n- RAM: 2 GB minimum\n- Storage: 100 MB available\n- Display: 1024x768 resolution\n\nRecommended Setup:\n- Internet: 10+ Mbps\n- RAM: 4+ GB\n- Modern computer or laptop\n- Latest browser version\n\nMobile Access:\n- Works on tablets (iPad, Android)\n- Responsive design\n- Touch-friendly interface\n- Limited on phones (recommend browser focus)'
  },
  {
    id: 31,
    question: 'I\'m having trouble uploading my code file. What should I do?',
    answer: 'Troubleshooting file upload issues:\n\nCommon Issues & Solutions:\n\n❌ File too large\n- Free plan: Max 10 MB\n- Premium plans: Up to 100 MB\n- Solution: Split large projects\n\n❌ File format not supported\n- Verify: .c, .java, .py, .sol extensions\n- Check: No spaces in filename\n- Solution: Rename and try again\n\n❌ Upload timeout (slow connection)\n- Try: Upload during off-peak hours\n- Check: Internet speed\n- Solution: Switch to code editor instead\n\n❌ Browser compatibility\n- Clear: Browser cache\n- Update: Latest browser version\n- Try: Different browser\n\nStill having issues?\n→ Contact support (click "Live Agent" button)'
  },
  {
    id: 32,
    question: 'Why is my analysis taking so long?',
    answer: 'Analysis duration depends on multiple factors:\n\n⏱️ Factors Affecting Speed:\n1. Code size (larger = slower)\n2. Code complexity (nested loops, recursion)\n3. Selected tool and parameters\n4. Server load during peak hours\n5. Bound values for CBMC/KLEE\n\nTypical Durations:\n- Small code (< 100 lines): 30 seconds\n- Medium code (100-1000 lines): 2-5 minutes\n- Large code (1000+ lines): 10-30 minutes\n- Very large code: 30+ minutes\n\nSpeed up your analysis:\n✓ Use smaller code files\n✓ Reduce loop bounds\n✓ Choose appropriate tool\n✓ Run during off-peak hours\n✓ Upgrade to Premium (priority queue)'
  },
  {
    id: 33,
    question: 'What is the difference between the tool versions (gMCov v3/4/5)?',
    answer: 'TrustInn offers multiple versions for advanced users:\n\nVersion Differences:\n\ngMCov Version 3 (Legacy)\n- Original implementation\n- Standard coverage metrics\n- Faster execution\n- Basic reporting\n\ngMCov Version 4 (Recommended)\n- Enhanced algorithmic efficiency\n- Improved accuracy\n- Better visual reports\n- Medium execution time\n- Best for most users\n\ngMCov Version 5 (Advanced)\n- Latest algorithms\n- Maximum accuracy\n- Comprehensive reporting\n- Detailed coverage breakdown\n- Slower but most thorough\n\nRecommendation: Start with v4, use v5 for critical systems, v3 for legacy projects.'
  },
  {
    id: 34,
    question: 'What are time bounds and bound values in analysis?',
    answer: 'Bounds control analysis scope and execution time:\n\n⏱️ Time Bounds\n- Maximum time tool is allowed to run\n- Measured in seconds (e.g., 3600 = 1 hour)\n- Prevents infinite analysis loops\n- Default: 3600 seconds\n- Premium plans: Up to 7200 seconds\n\n🔢 Bound Values (CBMC/KLEE)\n- Loop iteration limits (e.g., 10 iterations max)\n- Array access bounds\n- Recursion depth limits\n- Affects completeness vs. speed\n- Range: 1-1000\n- Higher bound = more thorough but slower\n\nOptimization Tips:\n- Start with lower bounds (10-20)\n- Increase gradually if needed\n- Use time bounds to limit execution\n- Critical code: higher bounds\n- Quick testing: lower bounds'
  },

  // ============= LEARNING & ENTERPRISE =============
  {
    id: 35,
    question: 'Can I use TrustInn for learning and education?',
    answer: 'Absolutely! TrustInn is perfect for learning:\n\nEducational Benefits:\n- Learn code verification concepts\n- Understand security analysis\n- Practice different verification tools\n- Discover code vulnerabilities\n- Improve code quality\n\nStudent Access:\n- Free trial with 5 executions\n- Educational discount available (50% off)\n- Works for assignments and projects\n- Great for research papers\n- Citation support provided\n\nAcademic Institutions:\n- Special institutional licensing\n- Bulk user accounts\n- Classroom integration support\n- Research project support\n- Custom tool configurations\n\nContact: academic@trustinn.io for student/institutional discounts.'
  },
  {
    id: 36,
    question: 'Can I integrate TrustInn with my development workflow?',
    answer: 'Yes! Integration options available:\n\nAPI Integration (Premium+)\n- RESTful API endpoints\n- Programmatic analysis access\n- Webhook notifications\n- Batch processing\n- CI/CD pipeline integration\n\nCI/CD Integration\n- GitHub Actions support\n- GitLab CI integration\n- Jenkins plugin available\n- Automated testing workflows\n- Pre-commit hooks\n\nIDE Plugins (Coming Soon)\n- VS Code extension\n- IntelliJ plugin\n- Visual Studio addon\n- Real-time analysis\n\nEnterprise Users:\n- Custom API implementation\n- On-premises integration\n- Dedicated integration support\n\nRequest: Contact sales for API and enterprise integration.'
  },
  {
    id: 37,
    question: 'What are best practices for using TrustInn effectively?',
    answer: 'Maximize your TrustInn experience:\n\n✅ Code Preparation:\n- Clean, well-structured code\n- Remove debugging statements\n- Use meaningful variable names\n- Add comments for complex logic\n- Properly formatted code\n\n✅ Tool Selection:\n- Choose right tool for your goal\n- Start with CBMC for C code\n- Use KLEE for test generation\n- Run multiple tools for comprehensive analysis\n- Compare results\n\n✅ Result Analysis:\n- Review all findings carefully\n- Understand recommendations\n- Fix critical issues first\n- Iterate and re-analyze\n- Track improvements\n\n✅ Optimization:\n- Use appropriate bound values\n- Test incrementally\n- Batch similar files\n- Monitor execution time\n- Use visualization for insights'
  },
  {
    id: 38,
    question: 'How do I interpret the analysis results?',
    answer: 'Understanding TrustInn analysis output:\n\nKey Metrics:\n\nCritical Issues (Must Fix)\n- Security vulnerabilities\n- Assertion failures\n- Reachability problems\n- Buffer overflows (when detected)\n\nWarnings (Should Review)\n- Suspicious patterns\n- Non-optimal code\n- Complex conditions\n- Dead code detection\n\nPassed (Good News)\n- No issues found\n- All assertions pass\n- Safe code paths\n- Good coverage achieved\n\nCoverage Metrics:\n- Line coverage (%)\n- Branch coverage (%)\n- MC/DC coverage (%)\n- Missing coverage areas\n\nRecommendations:\n- Suggested improvements\n- Test case enhancements\n- Code refactoring tips'
  },
  {
    id: 39,
    question: 'What should I do when analysis finds a vulnerability?',
    answer: 'Steps to address detected vulnerabilities:\n\n1. Understand the Issue\n   - Read the detailed finding\n   - Check the code location\n   - Review recommendations\n   - Ask support if unclear\n\n2. Assess the Risk\n   - Is it exploitable?\n   - What\'s the impact?\n   - How critical?\n   - Priority: High/Medium/Low\n\n3. Fix the Problem\n   - Implement recommended solution\n   - Test your fix\n   - Review by team member\n   - Verify no new issues\n\n4. Verify the Fix\n   - Re-run same tool\n   - Confirm issue resolved\n   - Check no regressions\n   - Generate final report\n\n5. Document & Learn\n   - Document the fix\n   - Share with team\n   - Update coding standards\n   - Prevent future issues'
  },
  {
    id: 40,
    question: 'Do you offer enterprise solutions and on-premises deployment?',
    answer: 'Yes! Enterprise solutions available:\n\nEnterprise Features:\n- On-premises deployment (private server)\n- Unlimited users and executions\n- Custom verification tools\n- API access and integration\n- Dedicated support team (24/7)\n- SLA guarantees (99.9% uptime)\n- Custom training and onboarding\n- Audit logging and compliance\n\nSecurity Features:\n- Complete data isolation\n- No external connections\n- Custom SSL certificates\n- Firewall integration\n- GDPR/HIPAA compliance ready\n- Regular security updates\n\nSupport Included:\n- Dedicated account manager\n- Priority response (1 hour)\n- Custom development\n- Training for your team\n\nEnterprise Contact:\nEmail: enterprise@trustinn.io\nSchedule a demo with our sales team!\nPhone: +91-AAAA-BBBBBB (during business hours)'
  }
];


export default function UnifiedChatbot() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('faq'); // 'faq' or 'live'
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [agentConnected, setAgentConnected] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentTimeout, setAgentTimeout] = useState(false);
  const [requestingAgent, setRequestingAgent] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const sessionIdRef = useRef('');
  const agentTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Initialize Socket.IO for live chat (connecting to NitMiner backend)
  useEffect(() => {
    if (!socketRef.current && typeof window !== 'undefined') {
      const newSessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionIdRef.current = newSessionId;

      socketRef.current = io('https://www.nitminer.com', {
        transports: ['websocket', 'polling'],
      });

      socketRef.current.on('agent:connected', (data) => {
        setAgentConnected(true);
        setAgentName(data.agentName || 'Support Agent');
        clearTimeout(agentTimeoutRef.current);
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'system',
          text: `${data.agentName || 'Support Agent'} has joined the chat`,
          icon: 'connected',
          timestamp: new Date()
        }]);
      });

      socketRef.current.on('agent:message', (data) => {
        if (data.sessionId === sessionIdRef.current && data.sender === 'admin') {
          setMessages(prev => [...prev, {
            id: data.id,
            type: 'agent',
            text: data.message,
            agentName: data.agentName || 'Support Team',
            timestamp: new Date(data.timestamp)
          }]);
        }
      });

      socketRef.current.on('agent:disconnected', () => {
        setAgentConnected(false);
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'system',
          text: 'Agent has disconnected',
          icon: 'disconnected',
          timestamp: new Date()
        }]);
      });
    }

    return () => {
      if (agentTimeoutRef.current) {
        clearTimeout(agentTimeoutRef.current);
      }
    };
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const requestAgent = async () => {
    setRequestingAgent(true);
    setMode('live');
    setAgentTimeout(false);
    
    try {
      const userId = (session?.user as any)?.id || session?.user?.email || 'anonymous';
      const userEmail = session?.user?.email || '';
      const userName = session?.user?.name || 'Guest';

      // Create chat session on NitMiner backend
      await fetch('https://www.nitminer.com/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          userId,
          userEmail,
          userName,
        }),
      }).catch(() => {});

      // Request agent
      socketRef.current?.emit('user:request-agent', {
        sessionId: sessionIdRef.current,
        userId,
        userEmail,
        userName,
      });

      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        text: 'Connecting you with a support agent...',
        timestamp: new Date()
      }]);

      // Set 5-minute timeout
      agentTimeoutRef.current = setTimeout(() => {
        if (!agentConnected) {
          setAgentTimeout(true);
          setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'system',
            text: 'Our agents are currently busy. Please try again later or browse our FAQ.',
            icon: 'busy',
            timestamp: new Date()
          }]);
        }
      }, 5 * 60 * 1000); // 5 minutes
    } catch (error) {
      console.error('Error requesting agent:', error);
    } finally {
      setRequestingAgent(false);
    }
  };

  const selectFAQ = (faq: any) => {
    setSelectedFAQ(faq.id);
    setMessages([{
      id: faq.id,
      type: 'faq',
      question: faq.question,
      answer: faq.answer,
      timestamp: new Date()
    }]);
  };

  const sendLiveMessage = async () => {
    if (!inputValue.trim()) return;

    const messageText = inputValue;
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      text: messageText,
      timestamp: new Date()
    }]);
    setInputValue('');

    socketRef.current?.emit('user:message', {
      sessionId: sessionIdRef.current,
      message: messageText,
      userId: (session?.user as any)?.id || session?.user?.email,
      userEmail: session?.user?.email,
      userName: session?.user?.name,
    });

    // Save to NitMiner backend
    try {
      await fetch('https://www.nitminer.com/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          message: messageText,
          sender: 'user',
          userId: (session?.user as any)?.id || session?.user?.email,
        })
      }).catch(() => {});
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const handleSend = () => {
    sendLiveMessage();
  };

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300 z-[40] hover:scale-110"
          aria-label="Open chat"
        >
          <FiHelpCircle size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[650px] bg-white rounded-2xl shadow-2xl z-[41] flex flex-col overflow-hidden border-2 border-blue-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold flex items-center gap-2">
                  {mode === 'faq' ? (
                    <>
                      <FiHelpCircle className="w-4 h-5 sm:w-5" />
                      FAQ
                    </>
                  ) : (
                    <>
                      <FiPhone className="w-4 h-5 sm:w-5" />
                      Live Support
                    </>
                  )}
                </h3>
                <p className="text-xs sm:text-xs md:text-sm font-semibold opacity-90">
                  {mode === 'live' && agentConnected && (
                    <span className="flex items-center gap-1">
                      <FiCheckCircle className="w-3 h-3" />
                      {agentName} is online
                    </span>
                  )}
                  {mode === 'live' && !agentConnected && !agentTimeout && (
                    <span className="flex items-center gap-1">
                      <FiClock className="w-3 h-3 animate-spin" />
                      Waiting for agent...
                    </span>
                  )}
                  {agentTimeout && (
                    <span className="flex items-center gap-1 text-yellow-300">
                      <FiAlertCircle className="w-3 h-3" />
                      Agents are busy
                    </span>
                  )}
                  {mode === 'faq' && 'Browse common questions'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
                  aria-label="Close"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-2 text-xs sm:text-sm">
              <button
                onClick={() => { setMode('faq'); setAgentTimeout(false); setSelectedFAQ(null); setMessages([]); }}
                className={`px-3 sm:px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                  mode === 'faq' ? 'bg-white/25' : 'bg-white/10 hover:bg-white/15'
                }`}
              >
                <FiHelpCircle className="w-4 h-4" />
                FAQ
              </button>
              <button
                onClick={requestAgent}
                disabled={requestingAgent || agentConnected}
                className={`px-3 sm:px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                  mode === 'live' ? 'bg-white/25' : 'bg-white/10 hover:bg-white/15'
                } disabled:opacity-50`}
              >
                <FiPhone className="w-4 h-4" />
                <span className="hidden sm:inline">Live Agent</span>
                <span className="sm:hidden">Agent</span>
              </button>
            </div>
          </div>

          {/* Messages / Content Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50">
            {mode === 'faq' ? (
              <>
                {/* FAQ Mode */}
                {selectedFAQ === null ? (
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm text-gray-600 font-semibold mb-4">Select a question below:</p>
                    {FAQ_DATA.map((faq) => (
                      <button
                        key={faq.id}
                        onClick={() => selectFAQ(faq)}
                        className="w-full text-left p-3 bg-white rounded-xl hover:bg-blue-50 hover:border-blue-300 border-2 border-gray-200 transition-all flex items-start justify-between gap-3 group"
                      >
                        <span className="text-xs sm:text-sm font-semibold text-gray-800 group-hover:text-blue-700">{faq.question}</span>
                        <FiChevronRight className="w-4 h-5 sm:w-5 text-gray-400 group-hover:text-blue-600 flex-shrink-0 mt-0.5" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => setSelectedFAQ(null)}
                      className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 mb-2"
                    >
                      ← Back to Questions
                    </button>
                    {messages.map((msg: any, idx: number) => (
                      <div key={idx} className="bg-white p-3 sm:p-4 rounded-xl border-2 border-blue-200">
                        <h3 className="font-bold text-blue-600 text-xs sm:text-sm mb-2">{msg.question}</h3>
                        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.answer}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Live Chat Mode */}
                {messages.map((message: any, idx: number) => {
                  if (message.type === 'system') {
                    return (
                      <div key={idx} className="flex justify-center">
                        <div className={`text-xs font-semibold px-3 py-2 rounded-full flex items-center gap-2 ${
                          message.icon === 'busy' 
                            ? 'bg-yellow-100 text-yellow-700'
                            : message.icon === 'disconnected'
                            ? 'bg-red-100 text-red-700'
                            : message.icon === 'connected'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {message.icon === 'connected' && <FiCheckCircle className="w-4 h-4 flex-shrink-0" />}
                          {message.icon === 'disconnected' && <FiAlertCircle className="w-4 h-4 flex-shrink-0" />}
                          {message.icon === 'busy' && <FiAlertCircle className="w-4 h-4 flex-shrink-0" />}
                          {message.text.includes('Connecting') && <FiLoader className="animate-spin w-4 h-4 flex-shrink-0" />}
                          {message.text}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      className={`flex ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-2xl shadow-md ${
                          message.type === 'user'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                            : 'bg-gray-100 text-gray-900 border-2 border-gray-300'
                        }`}
                      >
                        {message.agentName && (
                          <p className="text-xs font-bold mb-2 text-blue-700">{message.agentName}</p>
                        )}
                        <p className="text-xs sm:text-sm leading-relaxed text-gray-800">{message.text}</p>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-5 bg-white border-t-2 border-gray-200">
            {agentTimeout && mode === 'live' ? (
              <button
                onClick={() => { setMode('faq'); setSelectedFAQ(null); setMessages([]); }}
                className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <FiAlertCircle className="w-5 h-5" />
                Back to FAQ
              </button>
            ) : (
              <>
                {mode === 'live' && (
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-3 bg-slate-50 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none text-gray-900 font-medium border-2 border-gray-200"
                      disabled={!agentConnected && !agentTimeout}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!inputValue.trim() || (!agentConnected && !agentTimeout)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-400 text-white p-3 rounded-xl transition-colors shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center"
                      aria-label="Send message"
                    >
                      <FiSend size={22} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');
      `}</style>
    </>
  );
}
