'use client';

import { useState } from 'react';
import FrameworkVersionSelector from '../components/FrameworkVersionSelector';
import UpgradeSteps from '../components/UpgradeSteps';
// Removed direct server action import
import { UpgradeStep, Framework } from '../types/upgrade-step';

export default function Home() {
  const [upgradeSteps, setUpgradeSteps] = useState<UpgradeStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<{
    framework: Framework;
    fromVersion: number;
    toVersion: number;
  } | null>(null);
  const [warning, setWarning] = useState<string>('');

  const handleGetUpgradeSteps = async (
    framework: Framework,
    fromVersion: number,
    toVersion: number
  ) => {
    setIsLoading(true);
    setWarning('');
    
    try {
      const response = await fetch('/api/upgrade-steps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          framework,
          fromVersion: fromVersion.toString(),
          toVersion: toVersion.toString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUpgradeSteps(data.steps || []);
      setWarning(data.warning || '');
      setCurrentRequest({ framework, fromVersion, toVersion });
      setShowSteps(true);
    } catch (error) {
      console.error('Error fetching upgrade steps:', error);
      setWarning('An error occurred while fetching upgrade steps. Please try again.');
      setUpgradeSteps([]);
      setShowSteps(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">JSS Upgrade Guide</h1>
            <p className="mt-2 text-lg text-gray-600">
              Get step-by-step instructions for upgrading your JSS framework
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              Select the options that match your upgrade
            </h2>
            <p className="text-blue-800">
              Choose your framework and the versions you want to upgrade between to get 
              personalized upgrade instructions.
            </p>
          </div>

          {/* Framework and Version Selector */}
          <FrameworkVersionSelector
            onGetUpgradeSteps={handleGetUpgradeSteps}
            isLoading={isLoading}
          />

          {/* Upgrade Steps */}
          {showSteps && currentRequest && (
            <UpgradeSteps
              steps={upgradeSteps}
              framework={currentRequest.framework}
              fromVersion={currentRequest.fromVersion}
              toVersion={currentRequest.toVersion}
              warning={warning}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © 2025 JSS Upgrade Guide. Built with Next.js and Tailwind CSS.
            </p>
            <div className="mt-4 flex justify-center space-x-6">
              <a
                href="https://doc.sitecore.com"
                className="text-sm text-gray-500 hover:text-gray-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                JSS Documentation
              </a>
              <a
                href="https://github.com/Sitecore"
                className="text-sm text-gray-500 hover:text-gray-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
