import { UpgradeStep, Framework } from '../types/upgrade-step';
import crypto from 'crypto';
import nextjsSteps from '../data/nextjs-upgrade-steps.json';
import angularSteps from '../data/angular-upgrade-steps.json';

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
        return nextjsSteps;
      } else if (frameworkKey === 'angular') {
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
    // First consolidate by step type (existing logic)
    const typeConsolidatedSteps = this.consolidateByType(steps, targetVersion);
    
    // Then consolidate by affected file to avoid overlapping file updates
    const fileConsolidatedSteps = this.consolidateByAffectedFile(typeConsolidatedSteps);
    
    return fileConsolidatedSteps;
  }

  private consolidateByType(steps: UpgradeStep[], targetVersion: number): UpgradeStep[] {
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

  private consolidateByAffectedFile(steps: UpgradeStep[]): UpgradeStep[] {
    const stepsByFile = new Map<string, UpgradeStep[]>();
    const stepsWithoutFiles: UpgradeStep[] = [];

    // Group steps by affected file
    steps.forEach(step => {
      if (step.affectedFile) {
        if (!stepsByFile.has(step.affectedFile)) {
          stepsByFile.set(step.affectedFile, []);
        }
        stepsByFile.get(step.affectedFile)!.push(step);
      } else {
        stepsWithoutFiles.push(step);
      }
    });

    // Consolidate steps that affect the same file
    const consolidatedSteps: UpgradeStep[] = [];
    stepsByFile.forEach((fileSteps, fileName) => {
      if (fileSteps.length === 1) {
        // Only one step affects this file, no consolidation needed
        consolidatedSteps.push(fileSteps[0]);
      } else {
        // Multiple steps affect the same file, consolidate them
        const consolidated = this.consolidateFileSteps(fileSteps, fileName);
        if (consolidated) {
          consolidatedSteps.push(consolidated);
        }
      }
    });

    return [...consolidatedSteps, ...stepsWithoutFiles];
  }

  private consolidateFileSteps(fileSteps: UpgradeStep[], fileName: string): UpgradeStep | null {
    if (fileSteps.length === 0) return null;

    // Sort by version to maintain logical order
    const sortedSteps = fileSteps.sort((a, b) => a.from - b.from);
    const firstStep = sortedSteps[0];
    const lastStep = sortedSteps[sortedSteps.length - 1];

    // Create consolidated instruction
    const uniqueInstructions = this.getUniqueInstructions(sortedSteps);
    const consolidatedInstruction = this.createConsolidatedInstruction(uniqueInstructions, fileName);

    // Combine detailed descriptions without overlap
    const consolidatedDescription = this.mergeDetailedDescriptions(sortedSteps);

    return {
      instruction: consolidatedInstruction,
      detailedDescription: consolidatedDescription,
      from: firstStep.from,
      to: lastStep.to,
      stepType: this.getMostImportantStepType(sortedSteps),
      affectedFile: fileName
    };
  }

  private getUniqueInstructions(steps: UpgradeStep[]): string[] {
    const instructions = new Set<string>();
    steps.forEach(step => {
      // Remove version-specific information to get the base instruction
      const baseInstruction = step.instruction
        .replace(/to \d+\.\d+(\.\d+)?/gi, '')
        .replace(/version \d+\.\d+(\.\d+)?/gi, '')
        .replace(/\d+\.\d+(\.\d+)?/g, '')
        .trim();
      
      if (baseInstruction) {
        instructions.add(baseInstruction);
      }
    });
    return Array.from(instructions);
  }

  private createConsolidatedInstruction(instructions: string[], fileName: string): string {
    if (instructions.length === 1) {
      return `Update ${fileName} configuration`;
    }
    
    // For multiple instructions affecting the same file
    return `Update ${fileName} with multiple configuration changes`;
  }

  private mergeDetailedDescriptions(steps: UpgradeStep[]): string {
    const sections = new Map<string, Set<string>>();
    
    steps.forEach(step => {
      // Split detailed description into sections
      const lines = step.detailedDescription.split('\n');
      let currentSection = 'general';
      let currentContent = new Set<string>();
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        
        // Identify section headers
        if (trimmedLine.match(/^\d+\.\s*\*\*/) || trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
          // Save previous section
          if (currentContent.size > 0) {
            if (!sections.has(currentSection)) {
              sections.set(currentSection, new Set());
            }
            currentContent.forEach(content => sections.get(currentSection)!.add(content));
          }
          
          // Start new section
          currentSection = trimmedLine.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').toLowerCase();
          currentContent = new Set();
        } else if (trimmedLine.length > 0) {
          currentContent.add(trimmedLine);
        }
      });
      
      // Save final section
      if (currentContent.size > 0) {
        if (!sections.has(currentSection)) {
          sections.set(currentSection, new Set());
        }
        currentContent.forEach(content => sections.get(currentSection)!.add(content));
      }
    });

    // Rebuild consolidated description
    const consolidatedSections: string[] = [];
    let sectionIndex = 1;
    
    sections.forEach((content, sectionName) => {
      if (sectionName !== 'general') {
        consolidatedSections.push(`${sectionIndex}. **${sectionName}**:`);
        sectionIndex++;
      }
      
      content.forEach(line => {
        if (!line.startsWith('```') && !line.match(/^\d+\./)) {
          consolidatedSections.push(line);
        }
      });
      
      consolidatedSections.push(''); // Add spacing between sections
    });

    return consolidatedSections.join('\n').trim();
  }

  private getMostImportantStepType(steps: UpgradeStep[]): string {
    const typePriority: Record<string, number> = {
      'package-update': 1,
      'dependencies': 2,
      'configuration': 3,
      'code-update': 4,
      'testing': 5,
      'deployment': 6
    };

    let mostImportantType = '';
    let highestPriority = Infinity;

    steps.forEach(step => {
      if (step.stepType) {
        const priority = typePriority[step.stepType] || 10;
        if (priority < highestPriority) {
          highestPriority = priority;
          mostImportantType = step.stepType;
        }
      }
    });

    return mostImportantType || 'configuration';
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
