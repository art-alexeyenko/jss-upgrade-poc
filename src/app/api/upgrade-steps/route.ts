import { NextRequest, NextResponse } from 'next/server';
import { UpgradeStep, Framework } from '../../../types/upgrade-step';
import { getUpgradeStepRepository, hasUpgradePath } from '../../../lib/data-layer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { framework, fromVersion, toVersion } = body;

    if (!framework || !fromVersion || !toVersion) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const repository = getUpgradeStepRepository();
    const steps = await repository.getUpgradeSteps(
      framework as Framework,
      parseFloat(fromVersion),
      parseFloat(toVersion)
    );
    
    const hasPath = await hasUpgradePath(
      framework as Framework,
      parseFloat(fromVersion),
      parseFloat(toVersion)
    );
    
    let warning: string | undefined;
    if (!hasPath || steps.length === 0) {
      warning = `No upgrade steps found for ${framework} from version ${fromVersion} to ${toVersion}. This upgrade path may not be supported.`;
    }
    
    const response = {
      steps,
      hasPath,
      warning
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in upgrade-steps API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
