'use client';

import React, { useState } from 'react';
import Dropdown from './Dropdown';
import { Framework } from '../types/upgrade-step';

interface FrameworkVersionSelectorProps {
  onGetUpgradeSteps: (framework: Framework, fromVersion: number, toVersion: number) => void;
  isLoading?: boolean;
}

const FrameworkVersionSelector: React.FC<FrameworkVersionSelectorProps> = ({
  onGetUpgradeSteps,
  isLoading = false,
}) => {
  const [framework, setFramework] = useState<Framework>('Next.JS');
  const [fromVersion, setFromVersion] = useState<string>('21.7');
  const [toVersion, setToVersion] = useState<string>('22.0');
  const [validationError, setValidationError] = useState<string>('');

  // Generate version options from 21.7 to 22.9
  const generateVersionOptions = () => {
    const versions: { value: string; label: string }[] = [];
    for (let major = 21; major <= 22; major++) {
      const minorStart = major === 21 ? 7 : 0;
      const minorEnd = major === 22 ? 9 : 9;
      
      for (let minor = minorStart; minor <= minorEnd; minor++) {
        const version = `${major}.${minor}`;
        versions.push({ value: version, label: version });
      }
    }
    return versions;
  };

  const frameworkOptions = [
    { value: 'Next.JS', label: 'Next.JS' },
    { value: 'Angular', label: 'Angular' },
  ];

  const versionOptions = generateVersionOptions();

  const validateVersions = (from: string, to: string): string => {
    const fromNum = parseFloat(from);
    const toNum = parseFloat(to);
    
    if (toNum < fromNum) {
      return 'To version must be greater than or equal to From version.';
    }
    
    if (fromNum === toNum) {
      return 'From version and To version cannot be the same.';
    }
    
    return '';
  };

  const handleFromVersionChange = (value: string) => {
    setFromVersion(value);
    const error = validateVersions(value, toVersion);
    setValidationError(error);
  };

  const handleToVersionChange = (value: string) => {
    setToVersion(value);
    const error = validateVersions(fromVersion, value);
    setValidationError(error);
  };

  const handleGetUpgradeSteps = () => {
    if (!validationError && !isLoading) {
      onGetUpgradeSteps(framework, parseFloat(fromVersion), parseFloat(toVersion));
    }
  };

  const isButtonDisabled = !!validationError || isLoading;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Framework Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Framework</h2>
        <p className="text-sm text-gray-600 mb-4">
          Select the framework you want to upgrade.
        </p>
        <div className="max-w-xs">
          <Dropdown
            label="Select Framework"
            options={frameworkOptions}
            value={framework}
            onChange={(value) => setFramework(value as Framework)}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Version Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Version</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <Dropdown
            label="From Version"
            options={versionOptions}
            value={fromVersion}
            onChange={handleFromVersionChange}
            disabled={isLoading}
          />
          <Dropdown
            label="To Version"
            options={versionOptions}
            value={toVersion}
            onChange={handleToVersionChange}
            disabled={isLoading}
          />
        </div>
        
        {/* Validation Error */}
        {validationError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{validationError}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Get Upgrade Steps Button */}
      <div className="mb-8">
        <button
          onClick={handleGetUpgradeSteps}
          disabled={isButtonDisabled}
          className={`
            inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm
            ${
              isButtonDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }
            transition-colors duration-200
          `}
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Loading...
            </>
          ) : (
            'Get Upgrade Steps'
          )}
        </button>
      </div>
    </div>
  );
};

export default FrameworkVersionSelector;
