'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { TrendingUp, ArrowRight, Sparkles, CheckCircle, ChevronRight } from 'lucide-react';

const steps = [
  { id: 'welcome', title: 'Welcome to Bookkeep', description: 'Intelligent bookkeeping that understands natural language.', icon: Sparkles },
  { id: 'complete', title: 'You\'re Ready!', description: 'Start tracking with natural language.', icon: CheckCircle },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      router.push('/dashboard');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Card variant="elevated">
            <CardContent className="p-8 space-y-6">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-trust mb-4">
                  <currentStepData.icon className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-display-sm font-display font-medium text-text-primary">{currentStepData.title}</h1>
                <p className="text-body text-text-secondary mt-2">{currentStepData.description}</p>
              </div>

              <div className="space-y-4">
                {currentStepData.id === 'welcome' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { icon: Sparkles, label: 'Natural Language', color: 'trust' },
                        { icon: TrendingUp, label: 'Beautiful Charts', color: 'sage' },
                        { icon: CheckCircle, label: 'Privacy First', color: 'coral' },
                      ].map((feature, i) => (
                        <div key={i} className="p-4 rounded-xl bg-surface border border-border text-center">
                          <div className="p-2 rounded-lg mb-2" style={{ backgroundColor: `var(--color-${feature.color}-100)` }}>
                            <feature.icon className="w-5 h-5" style={{ color: `var(--color-${feature.color}-600)` }} />
                          </div>
                          <p className="text-body-sm font-medium text-text-primary">{feature.label}</p>
                        </div>
                      ))}
                    </div>
                    <Button onClick={handleNext} fullWidth size="lg" className="mt-4">
                      Get Started
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
                )}

                {currentStepData.id === 'complete' && (
                  <div className="space-y-6 text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-trust flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-display-sm font-display font-medium text-text-primary">You&rsquo;re all set!</h2>
                    <Button onClick={() => router.push('/dashboard')} fullWidth size="lg">
                      Go to Dashboard
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </div>

              {currentStepData.id !== 'welcome' && currentStepData.id !== 'complete' && (
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button variant="secondary" onClick={handleBack} fullWidth>
                    <ChevronRight className="w-5 h-5 rotate-180" />
                    Back
                  </Button>
                  <Button onClick={handleNext} fullWidth>
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}