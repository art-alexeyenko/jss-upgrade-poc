import React from 'react';
import { UpgradeStep } from '../types/upgrade-step';
import UpgradeStepComponent from './UpgradeStep';

interface UpgradeStepsProps {
  steps: UpgradeStep[];
  framework: string;
  fromVersion: number;
  toVersion: number;
  warning?: string;
}

const UpgradeSteps: React.FC<UpgradeStepsProps> = ({
  steps,
  framework,
  fromVersion,
  toVersion,
  warning,
}) => {
  if (warning) {
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Upgrade Steps</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                No upgrade path available
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>{warning}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Upgrade Steps</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <p className="text-gray-600">
            No upgrade steps found for the selected version range.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Upgrade Steps</h2>
      
      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <span className="font-medium">{steps.length}</span> upgrade steps found for upgrading{' '}
          <span className="font-medium">{framework}</span> from version{' '}
          <span className="font-medium">{fromVersion}</span> to{' '}
          <span className="font-medium">{toVersion}</span>
        </p>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Upgrade Instructions
          </h3>
          <p className="text-sm text-gray-600">
            Follow these steps in order to complete your upgrade. Click on each step to see detailed instructions.
          </p>
        </div>
        
        <div className="space-y-3">
          {steps.map((step, index) => (
            <UpgradeStepComponent 
              key={index} 
              step={step} 
              stepNumber={index + 1}
            />
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <svg
            className="flex-shrink-0 h-5 w-5 text-blue-400 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              Important Notes
            </h4>
            <p className="mt-1 text-sm text-gray-600">
              Always backup your project before starting the upgrade process. Test thoroughly
              in a development environment before applying changes to production.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeSteps;
