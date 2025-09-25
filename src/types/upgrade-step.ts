export interface UpgradeStep {
  instruction: string;
  detailedDescription: string;
  from: number;
  to: number;
  stepType?: string; // Used for grouping similar steps
  affectedFile?: string; // File(s) that this step modifies
}

export type Framework = 'Next.JS' | 'Angular';

export interface UpgradeRequest {
  framework: Framework;
  fromVersion: number;
  toVersion: number;
}
