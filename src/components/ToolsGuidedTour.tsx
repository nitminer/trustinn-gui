'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to TrustInn Tools! 🎉',
    description: 'This is your first time here. Let me show you around and help you get started with our security testing tools.',
    position: 'bottom'
  },
  {
    id: 'tabs',
    title: 'Programming Language Tabs',
    description: 'Select your programming language: C, Java, Python, or Solidity. Each tab has specialized tools for that language.',
    target: 'tabs-container',
    position: 'bottom'
  },
  {
    id: 'upload',
    title: 'Upload Your Code',
    description: 'Click here to upload your code file. Supported formats depend on the selected language.',
    target: 'file-upload',
    position: 'bottom'
  },
  {
    id: 'tools',
    title: 'Select Testing Tool',
    description: 'Choose a specific tool for analysis. Each tool has different capabilities for code verification and testing.',
    target: 'tool-select',
    position: 'bottom'
  },
  {
    id: 'params',
    title: 'Configure Tool Parameters',
    description: 'After selecting a tool, configuration options will appear here. These parameters control the analysis depth, timeouts, and behavior.',
    target: 'tool-config-section',
    position: 'left'
  },
  {
    id: 'execute',
    title: 'Execute Analysis',
    description: 'Click here to run the tool on your code. Results will appear in the terminal below.',
    target: 'execute-btn',
    position: 'bottom'
  },
  {
    id: 'results',
    title: 'View Results',
    description: 'Results from your analysis appear here. You can view detailed output and download files.',
    target: 'terminal-output',
    position: 'top'
  },
  {
    id: 'premium',
    title: 'Get Unlimited Access',
    description: 'Free trial has limited executions. Upgrade to Premium to get unlimited access to all tools!',
    target: 'premium-badge',
    position: 'left'
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🚀',
    description: 'You\'re ready to start testing. Select a language, upload your code, choose a tool, and click Execute. Have fun exploring!',
    position: 'bottom'
  }
];

interface ToolsGuidedTourProps {
  isVisible: boolean;
  onComplete: () => void;
}

export default function ToolsGuidedTour({ isVisible, onComplete }: ToolsGuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightElement, setHighlightElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isVisible) return;

    const step = tourSteps[currentStep];
    if (step.target) {
      const element = document.getElementById(step.target);
      setHighlightElement(element);

      // Scroll element into view
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setHighlightElement(null);
    }
  }, [currentStep, isVisible]);

  if (!isVisible) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <>
      {/* Dark Overlay - No blur, just dark background */}
      <div className="fixed inset-0  z-40 pointer-events-none"></div>

      {/* Spotlight Effect - Creates clear visibility of target element */}
      {highlightElement && (
        <div
          className="fixed pointer-events-none z-50 transition-all duration-300 rounded-xl"
          style={{
            top: `${highlightElement.offsetTop - 10}px`,
            left: `${highlightElement.offsetLeft - 10}px`,
            width: `${highlightElement.offsetWidth + 20}px`,
            height: `${highlightElement.offsetHeight + 20}px`,
            border: '3px solid #3b82f6',
            boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 0 3px #3b82f6, 0 0 40px rgba(59, 130, 246, 0.8)`,
            background: 'rgba(255, 255, 255, 0.01)',
            filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.6))'
          }}
        ></div>
      )}

      {/* Tour Card */}
      <div className="fixed bottom-8 right-8 z-50 bg-white rounded-2xl shadow-2xl p-6 w-96 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 pr-2">
            <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
            <p className="text-xs text-blue-600 font-medium mt-1">
              Step {currentStep + 1} of {tourSteps.length}
            </p>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Skip tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
          {step.description}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-1 mb-6">
          <div
            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
          ></div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-between">
          <button
            onClick={handlePrev}
            disabled={isFirstStep}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={handleSkip}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm"
          >
            Skip Tour
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isLastStep ? 'Finish' : 'Next'}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </>
  );
}
