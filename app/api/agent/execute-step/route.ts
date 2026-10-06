import { NextRequest, NextResponse } from 'next/server';
import { executeToolByName } from '@/lib/agent/tools';
import { ExecuteToolPayload, ExecuteToolApiResponse } from '@/types/agent';

export async function POST(req: NextRequest): Promise<NextResponse<ExecuteToolApiResponse>> {
  try {
    const body = (await req.json()) as ExecuteToolPayload;

    if (!body || !body.toolName) {
      return NextResponse.json(
        {
          success: false,
          error: "Nom de l'outil manquant dans la requête (toolName requis).",
        },
        { status: 400 }
      );
    }

    const { toolName, parameters } = body;
    const output = await executeToolByName(toolName, parameters || {});

    return NextResponse.json({
      success: output.status === 'SUCCESS',
      data: output,
      error: output.error,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: `Erreur d'exécution de l'outil : ${errorMsg}`,
      },
      { status: 500 }
    );
  }
}
