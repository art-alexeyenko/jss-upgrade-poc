import { UpgradeStep, Framework } from '../types/upgrade-step';
import crypto from 'crypto';

// Abstract data layer interface for future database implementations
export interface IUpgradeStepRepository {
  getUpgradeSteps(framework: Framework, fromVersion: number, toVersion: number): Promise<UpgradeStep[]>;
}

// JSON file implementation
export class JsonUpgradeStepRepository implements IUpgradeStepRepository {
  private async loadStepsFromFile(framework: Framework): Promise<UpgradeStep[]> {
    const frameworkKey = framework.toLowerCase().replace('.', '');
    
    try {
      if (frameworkKey === 'nextjs') {
        // Use require for server-side JSON loading
        const nextjsSteps = require('../data/nextjs-upgrade-steps.json');
        return nextjsSteps;
      } else if (frameworkKey === 'angular') {
        const angularSteps = require('../data/angular-upgrade-steps.json');
        return angularSteps;
      }
      
      return [];
    } catch (error) {
      console.error(`Failed to load upgrade steps for ${framework}:`, error);
      return [];
    }
  }

  async getUpgradeSteps(framework: Framework, fromVersion: number, toVersion: number): Promise<UpgradeStep[]> {
    const allSteps = await this.loadStepsFromFile(framework);
    
    // Filter steps that are needed for the upgrade path
    const relevantSteps = allSteps.filter(step => {
      return step.from >= fromVersion && step.to <= toVersion;
    });

    // Consolidate similar steps (e.g., package updates across versions)
    const consolidatedSteps = this.consolidateSimilarSteps(relevantSteps, toVersion);
    
    // Sort by step type priority, then by from version
    return consolidatedSteps.sort((a, b) => {
      const typePriority = this.getStepTypePriority(a.stepType) - this.getStepTypePriority(b.stepType);
      if (typePriority !== 0) return typePriority;
      
      if (a.from !== b.from) {
        return a.from - b.from;
      }
      return a.to - b.to;
    });
  }

  private consolidateSimilarSteps(steps: UpgradeStep[], targetVersion: number): UpgradeStep[] {
    const stepsByType = new Map<string, UpgradeStep[]>();
    const nonConsolidatedSteps: UpgradeStep[] = [];

    // Group steps by type
    steps.forEach(step => {
      if (step.stepType && this.shouldConsolidate(step.stepType)) {
        if (!stepsByType.has(step.stepType)) {
          stepsByType.set(step.stepType, []);
        }
        stepsByType.get(step.stepType)!.push(step);
      } else {
        nonConsolidatedSteps.push(step);
      }
    });

    // Consolidate steps of the same type
    const consolidatedSteps: UpgradeStep[] = [];
    stepsByType.forEach((typeSteps, stepType) => {
      if (stepType === 'package-update') {
        // For package updates, show only the final target version
        const consolidated = this.consolidatePackageUpdates(typeSteps, targetVersion);
        if (consolidated) {
          consolidatedSteps.push(consolidated);
        }
      } else {
        // For other step types, include all steps but remove duplicates
        const uniqueSteps = this.removeDuplicateInstructions(typeSteps);
        consolidatedSteps.push(...uniqueSteps);
      }
    });

    return [...consolidatedSteps, ...nonConsolidatedSteps];
  }

  private shouldConsolidate(stepType: string): boolean {
    return ['package-update', 'dependencies', 'configuration'].includes(stepType);
  }

  private consolidatePackageUpdates(packageSteps: UpgradeStep[], targetVersion: number): UpgradeStep | null {
    if (packageSteps.length === 0) return null;

    // Find the first step to get the base instruction and description
    const firstStep = packageSteps[0];
    const minVersion = Math.min(...packageSteps.map(s => s.from));

    // Create consolidated step with updated instruction showing target version
    const baseInstruction = firstStep.instruction.replace(/to \d+\.\d+(\.\d+)?/, '').replace(/\d+\.\d+(\.\d+)?/, '');
    const consolidatedInstruction = `${baseInstruction.trim()} to ${targetVersion}`;

    // Update detailed description to show target version
    const updatedDetailedDescription = firstStep.detailedDescription
      .replace(/@\^\d+\.\d+(\.\d+)?/g, `@^${targetVersion}`)
      .replace(/version \d+\.\d+(\.\d+)?/g, `version ${targetVersion}`)
      .replace(/to \d+\.\d+(\.\d+)?/g, `to ${targetVersion}`);

    return {
      instruction: consolidatedInstruction,
      detailedDescription: updatedDetailedDescription,
      from: minVersion,
      to: targetVersion,
      stepType: firstStep.stepType
    };
  }

  private getStepTypePriority(stepType?: string): number {
    const priorities: Record<string, number> = {
      'package-update': 1,
      'dependencies': 2,
      'configuration': 3,
      'code-update': 4,
      'testing': 5,
      'deployment': 6
    };
    return priorities[stepType || 'default'] || 10;
  }

  private removeDuplicateInstructions(steps: UpgradeStep[]): UpgradeStep[] {
    const seenInstructions = new Set<string>();
    return steps.filter(step => {
      const hash = this.hashInstruction(step.instruction);
      if (seenInstructions.has(hash)) {
        return false;
      }
      seenInstructions.add(hash);
      return true;
    });
  }

  private hashInstruction(instruction: string): string {
    return crypto.createHash('md5').update(instruction.trim().toLowerCase()).digest('hex');
  }
}

// Factory function to get the repository instance
export function getUpgradeStepRepository(): IUpgradeStepRepository {
  return new JsonUpgradeStepRepository();
}

// Utility function to check if upgrade path exists
export async function hasUpgradePath(framework: Framework, fromVersion: number, toVersion: number): Promise<boolean> {
  const repository = getUpgradeStepRepository();
  const steps = await repository.getUpgradeSteps(framework, fromVersion, toVersion);
  return steps.length > 0;
}
