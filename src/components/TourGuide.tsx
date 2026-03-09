'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiChevronRight, FiChevronLeft } from 'react-icons/fi';

export interface TourStep {
  id: string;
  target?: string; // CSS selector for element to highlight
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  width?: string;
  action?: string; // Optional: what user should do
}

interface TourGuideProps {
  steps: TourStep[];
  onComplete?: () => void;
  autoStart?: boolean;
  forceStart?: boolean;
  storageKey?: string;
}

export const TourGuide: React.FC<TourGuideProps> = ({
  steps,
  onComplete,
  autoStart = true,
  forceStart = false,
  storageKey = 'trustinn-tour-completed'
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [highlightBox, setHighlightBox] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  // Check if tour was completed before
  useEffect(() => {
    if (forceStart) {
      setIsActive(true);
      setCurrentStepIndex(0);
    } else {
      const completed = localStorage.getItem(storageKey);
      if (!completed && autoStart) {
        setIsActive(true);
      }
    }
  }, [storageKey, autoStart, forceStart]);

  // Update highlight position when step changes
  useEffect(() => {
    if (!isActive || steps.length === 0) return;

    const currentStep = steps[currentStepIndex];
    if (currentStep.target) {
      // Retry finding element multiple times (in case it's being rendered)
      let attempts = 0;
      const maxAttempts = 5;
      
      const tryFindElement = () => {
        const element = document.querySelector(currentStep.target!);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Only highlight if element is visible (not off-screen or hidden in modal)
          if (rect.width > 0 && rect.height > 0 && rect.top >= 0) {
            setHighlightBox(rect);
            calculateTooltipPosition(rect, currentStep.position || 'bottom');
            return true;
          }
        }
        return false;
      };

      if (!tryFindElement() && attempts < maxAttempts) {
        // Retry after a short delay if element not found yet
        const timer = setTimeout(() => {
          attempts++;
          if (!tryFindElement() && attempts < maxAttempts) {
            // Element might be in a modal or not visible - that's okay
          }
        }, 300);
        
        return () => clearTimeout(timer);
      }
    } else {
      setHighlightBox(null);
    }
  }, [currentStepIndex, isActive, steps]);

  const calculateTooltipPosition = (rect: DOMRect, position: string) => {
    const padding = 20;
    const tooltipWidth = 400;
    const tooltipHeight = 320;
    let top = 0;
    let left = 0;

    // Try to position based on preference
    switch (position) {
      case 'bottom':
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'top':
        top = rect.top - padding - tooltipHeight;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + padding;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - padding - tooltipWidth;
        break;
    }

    // Smart fallback: keep tooltip in viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Horizontal bounds check
    if (left < 10) {
      left = 10; // Left edge
    } else if (left + tooltipWidth > viewportWidth - 10) {
      left = viewportWidth - tooltipWidth - 10; // Right edge
    }
    
    // Vertical bounds check with smart fallback
    if (top < 10) {
      // If top is too high, try bottom position instead
      top = rect.bottom + padding;
      if (top + tooltipHeight > viewportHeight) {
        top = 10; // Worst case, top of screen
      }
    } else if (top + tooltipHeight > viewportHeight - 10) {
      // If bottom is too low, try top position instead
      top = rect.top - padding - tooltipHeight;
      if (top < 10) {
        top = viewportHeight - tooltipHeight - 10; // Bottom of screen
      }
    }

    setTooltipPosition({ top, left });
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSkip = () => {
    setIsActive(false);
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, 'true');
    setIsActive(false);
    onComplete?.();
  };

  const restartTour = () => {
    localStorage.removeItem(storageKey);
    setCurrentStepIndex(0);
    setIsActive(true);
  };

  if (!isActive) {
    // Show "Start Tour" button when tour is not active
    return (
      // <button
      //   onClick={restartTour}
      //   className="cursor-pointer absolute top-4  right-30 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg px-4 py-3 flex items-center gap-2 font-medium transition-all duration-200 hover:shadow-xl"
      //   title="Start a guided tour of the tools page"
      // >
      //   <i className="fas fa-question-circle text-lg"></i>
      //   <span className="hidden sm:inline text-sm">Start Tour</span>
      // </button>
      <span/>
    );
  }

  const currentStep = steps[currentStepIndex];

  return (
    <>
      {/* Overlay - Darkens everything except highlighted element */}
      <div
        className="fixed inset-0 z-40 bg-black transition-opacity duration-300 pointer-events-auto"
        style={{
          opacity: highlightBox ? 0.5 : 0.4,
          backdropFilter: 'blur(2px)',
        }}
        onClick={handleSkip}
      />

      {/* Highlight Box - Shows the element being highlighted */}
      {highlightBox && (
        <div
          className="fixed border-4 border-blue-400 rounded-lg pointer-events-none z-40 transition-all duration-300 shadow-2xl"
          style={{
            top: highlightBox.top - 6,
            left: highlightBox.left - 6,
            width: highlightBox.width + 12,
            height: highlightBox.height + 12,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 30px rgba(59, 130, 246, 0.8)',
          }}
        />
      )}

      {/* Tooltip Box */}
      <div
        className="fixed z-50 bg-white rounded-xl shadow-2xl p-6 w-96 max-w-[90vw] border border-gray-200 transition-all duration-300"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold text-lg">
                {currentStepIndex + 1}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">
              {currentStep.title}
            </h3>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            title="Close tour"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Not Found Warning */}
        {currentStep.target && !highlightBox && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-4 rounded-r">
            <p className="text-sm text-amber-700 font-medium flex items-center gap-2">
              <i className="fas fa-info-circle text-amber-600"></i>
              This element might be in a modal. Click "Next" to continue the tour.
            </p>
          </div>
        )}

        {/* Description */}
        <p className="text-gray-700 text-sm mb-4 leading-relaxed">
          {currentStep.description}
        </p>

        {/* Action Hint (Optional) */}
        {currentStep.action && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 rounded-r">
            <p className="text-sm text-blue-700 font-medium flex items-center gap-2">
              <i className="fas fa-lightbulb text-yellow-500"></i>
              {currentStep.action}
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span className="text-xs font-medium text-gray-600">
              {Math.round(((currentStepIndex + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
              style={{
                width: `${((currentStepIndex + 1) / steps.length) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Footer - Navigation Buttons */}
        <div className="flex items-center gap-3">
          {/* Previous Button */}
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiChevronLeft size={18} />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Skip Tour
          </button>

          {/* Next / Complete Button */}
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <span className="hidden sm:inline">
              {currentStepIndex === steps.length - 1 ? 'Complete' : 'Next'}
            </span>
            <span className="sm:hidden">
              {currentStepIndex === steps.length - 1 ? '✓' : '→'}
            </span>
            <FiChevronRight size={18} />
          </button>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <p className="text-xs text-gray-500 mt-3 text-center">
          💡 Press <kbd className="px-2 py-1 bg-gray-100 rounded">→</kbd> for next, <kbd className="px-2 py-1 bg-gray-100 rounded">←</kbd> for previous
        </p>
      </div>
    </>
  );
};

export default TourGuide;
