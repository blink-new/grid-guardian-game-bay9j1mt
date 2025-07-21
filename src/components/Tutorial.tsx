import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { X, ArrowRight, ArrowLeft, Lightbulb } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  targetElement?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  arrow?: boolean;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome, Grid Guardian!',
    content: 'You\'re about to operate a Bitcoin mining facility to help balance Japan\'s power grid. Let\'s learn the basics in 30 seconds!',
    position: 'center'
  },
  {
    id: 'gauges',
    title: 'Monitor Energy Flow',
    content: 'Watch the Renewable Supply (left) and City Demand (right). When supply exceeds demand, there\'s surplus energy to capture!',
    targetElement: 'energy-gauges',
    position: 'bottom',
    arrow: true
  },
  {
    id: 'grid-meter',
    title: 'Grid Status is Key',
    content: 'This meter shows grid balance. ORANGE = Surplus (activate miners!), GREEN = Balanced, RED = Shortage (turn miners OFF!)',
    targetElement: 'grid-meter',
    position: 'bottom',
    arrow: true
  },
  {
    id: 'mining-control',
    title: 'Your Mining Control',
    content: 'Click this button to activate/deactivate your miners. Time it right to earn profit and help the grid!',
    targetElement: 'mining-button',
    position: 'top',
    arrow: true
  },
  {
    id: 'strategy',
    title: 'Winning Strategy',
    content: '💡 Activate miners during SURPLUS (orange) to earn profit and save clean energy. Deactivate during SHORTAGE (red) to prevent blackouts!',
    position: 'center'
  },
  {
    id: 'ready',
    title: 'Ready to Start!',
    content: 'You have 60 seconds to manage 24 hours of grid operations. Good luck, Grid Guardian!',
    position: 'center'
  }
];

interface TutorialProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export const Tutorial: React.FC<TutorialProps> = ({ isVisible, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const nextStep = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const prevStep = () => {
    if (!isFirstStep) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const getPositionClasses = () => {
    switch (step.position) {
      case 'center':
        return 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50';
      case 'top':
        return 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50';
      case 'bottom':
        return 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50';
      case 'left':
        return 'fixed top-1/2 left-4 transform -translate-y-1/2 z-50';
      case 'right':
        return 'fixed top-1/2 right-4 transform -translate-y-1/2 z-50';
      default:
        return 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50';
    }
  };

  const getArrowClasses = () => {
    if (!step.arrow) return '';
    
    switch (step.position) {
      case 'top':
        return 'after:absolute after:top-full after:left-1/2 after:transform after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-slate-800';
      case 'bottom':
        return 'after:absolute after:bottom-full after:left-1/2 after:transform after:-translate-x-1/2 after:border-8 after:border-transparent after:border-b-slate-800';
      case 'left':
        return 'after:absolute after:top-1/2 after:left-full after:transform after:-translate-y-1/2 after:border-8 after:border-transparent after:border-l-slate-800';
      case 'right':
        return 'after:absolute after:top-1/2 after:right-full after:transform after:-translate-y-1/2 after:border-8 after:border-transparent after:border-r-slate-800';
      default:
        return '';
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/70 z-40" />
      
      {/* Tutorial Card */}
      <div className={getPositionClasses()}>
        <Card className={`
          max-w-md w-full p-6 bg-slate-800 border-slate-600 shadow-2xl
          ${getArrowClasses()}
          ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
          transition-all duration-150 ease-out
        `}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">{step.title}</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-slate-200 leading-relaxed">{step.content}</p>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400">
                Step {currentStep + 1} of {tutorialSteps.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="text-slate-400 hover:text-white text-sm"
              >
                Skip Tutorial
              </Button>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={isFirstStep}
              className="flex items-center gap-2 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <Button
              onClick={nextStep}
              className="flex items-center gap-2 aex-green-bg hover:bg-green-600 text-white"
            >
              {isLastStep ? 'Start Game!' : 'Next'}
              {!isLastStep && <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </Card>
      </div>

      {/* Highlight overlays for specific elements */}
      {step.targetElement && (
        <div className="fixed inset-0 pointer-events-none z-30">
          {step.targetElement === 'energy-gauges' && (
            <div className="absolute top-24 left-4 right-4 lg:left-8 lg:right-2/3 h-72 border-4 border-yellow-400 rounded-lg animate-pulse shadow-lg shadow-yellow-400/50" />
          )}
          {step.targetElement === 'grid-meter' && (
            <div className="absolute top-24 left-4 right-4 lg:left-1/3 lg:right-1/3 h-72 border-4 border-yellow-400 rounded-lg animate-pulse shadow-lg shadow-yellow-400/50" />
          )}
          {step.targetElement === 'mining-button' && (
            <div className="absolute bottom-24 left-4 right-4 lg:left-8 lg:right-1/2 h-40 border-4 border-yellow-400 rounded-lg animate-pulse shadow-lg shadow-yellow-400/50" />
          )}
        </div>
      )}
    </>
  );
};

export default Tutorial;