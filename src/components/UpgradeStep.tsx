'use client';

import React, { useState } from 'react';
import { UpgradeStep as UpgradeStepType } from '../types/upgrade-step';

interface UpgradeStepProps {
  step: UpgradeStepType;
  stepNumber: number;
}

const UpgradeStep: React.FC<UpgradeStepProps> = ({ step, stepNumber }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDetailedDescription = (description: string) => {
    return description.split('\n').map((line, index) => {
      if (line.startsWith('```')) {
        return null; // Skip code block markers for now
      }
      if (line.trim().startsWith('#')) {
        return (
          <h4 key={index} className="font-semibold text-gray-900 mt-4 mb-2">
            {line.replace(/^#+\s*/, '')}
          </h4>
        );
      }
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={index} className="ml-4 text-gray-700">
            {line.replace(/^[\s\-\*]+/, '')}
          </li>
        );
      }
      if (line.trim().length === 0) {
        return <br key={index} />;
      }
      return (
        <p key={index} className="text-gray-700 mb-2">
          {line}
        </p>
      );
    });
  };

  const getStepTypeColor = (stepType?: string) => {
    const colors: Record<string, string> = {
      'package-update': 'bg-blue-100 text-blue-800',
      'dependencies': 'bg-green-100 text-green-800',
      'configuration': 'bg-purple-100 text-purple-800',
      'code-update': 'bg-yellow-100 text-yellow-800',
      'testing': 'bg-indigo-100 text-indigo-800',
      'deployment': 'bg-red-100 text-red-800'
    };
    return colors[stepType || 'default'] || 'bg-gray-100 text-gray-800';
  };

  const getStepTypeLabel = (stepType?: string) => {
    const labels: Record<string, string> = {
      'package-update': 'Package Update',
      'dependencies': 'Dependencies',
      'configuration': 'Configuration',
      'code-update': 'Code Update',
      'testing': 'Testing',
      'deployment': 'Deployment'
    };
    return labels[stepType || 'default'] || 'General';
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Step Header - Always Visible */}
      <button
        className="w-full px-6 py-4 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            {/* Step Number */}
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                {stepNumber}
              </div>
            </div>
            
            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {/* Step Type Badge */}
                {step.stepType && (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStepTypeColor(step.stepType)}`}>
                    {getStepTypeLabel(step.stepType)}
                  </span>
                )}
                
                {/* Version Range */}
                <span className="text-xs text-gray-500">
                  {step.from} → {step.to}
                </span>
              </div>
              
              {/* Step Instruction */}
              <h3 className="text-sm font-medium text-gray-900 leading-relaxed">
                {step.instruction}
              </h3>
            </div>
          </div>
          
          {/* Expand/Collapse Icon */}
          <div className="flex-shrink-0 ml-4">
            <svg
              className={`h-5 w-5 text-gray-400 transform transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </button>

      {/* Detailed Description - Expandable */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100 bg-gray-50">
          <div className="pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Detailed Instructions
            </h4>
            <div className="prose prose-sm max-w-none">
              <div className="space-y-2">
                {formatDetailedDescription(step.detailedDescription)}
              </div>
            </div>
            
            {/* Code blocks handling */}
            {step.detailedDescription.includes('```') && (
              <div className="mt-4">
                {step.detailedDescription.split('```').map((block, index) => {
                  if (index % 2 === 1) {
                    // This is a code block
                    const lines = block.split('\n');
                    const language = lines[0] || '';
                    const code = lines.slice(1).join('\n');
                    
                    return (
                      <div key={index} className="my-4">
                        <div className="bg-gray-900 rounded-t-md px-4 py-2">
                          <span className="text-gray-400 text-xs font-mono">
                            {language || 'code'}
                          </span>
                        </div>
                        <pre className="bg-gray-800 text-gray-100 p-4 rounded-b-md overflow-x-auto">
                          <code className="text-sm font-mono">{code}</code>
                        </pre>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UpgradeStep;
