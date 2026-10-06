import { NextRequest, NextResponse } from 'next/server';
import { executeResearchPlanning } from '@/lib/agent/runner';
import { PlanApiResponse, PlanRequestPayload } from '@/types/agent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse<PlanApiResponse>> {
  try {
    const body: PlanRequestPayload = await req.json();
    const { userPrompt } = body;

    // Validation rigoureuse
    if (!userPrompt || typeof userPrompt !== 'string' || userPrompt.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Veuillez préciser le sujet ou la question de recherche souhaitée.",
        },
        { status: 400 }
      );
    }

    if (userPrompt.trim().length > 2000) {
      return NextResponse.json(
        {
          success: false,
          error: "La demande dépasse la limite autorisée de 2000 caractères.",
        },
        { status: 400 }
      );
    }

    // Exécution du moteur Google ADK propulsé par Gemini 3.5 Flash
    const plan = await executeResearchPlanning(userPrompt.trim());

    return NextResponse.json({
      success: true,
      data: plan,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur interne du serveur lors de la planification.";
    console.error("[API /api/agent/plan] Erreur d'exécution :", error);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
