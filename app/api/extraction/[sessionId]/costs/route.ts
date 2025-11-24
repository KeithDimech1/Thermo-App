/**
 * GET /api/extraction/[sessionId]/costs
 * Retrieve AI token usage and cost breakdown for an extraction session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getExtractionTokenUsage } from '@/lib/db/extraction-queries';
import { calculateCost } from '@/lib/anthropic/client';

interface RouteParams {
  params: Promise<{
    sessionId: string;
  }>;
}

export async function GET(
  _req: NextRequest,
  { params }: RouteParams
) {
  const { sessionId } = await params;

  try {
    const usage = await getExtractionTokenUsage(sessionId);

    if (!usage) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const breakdown = usage.ai_usage_breakdown;

    return NextResponse.json({
      analysis: {
        input: breakdown.analysis.input,
        output: breakdown.analysis.output,
        calls: breakdown.analysis.calls,
        cost: calculateCost(breakdown.analysis.input, breakdown.analysis.output, usage.ai_model),
      },
      extraction: {
        input: breakdown.extraction.input,
        output: breakdown.extraction.output,
        calls: breakdown.extraction.calls,
        cost: calculateCost(breakdown.extraction.input, breakdown.extraction.output, usage.ai_model),
      },
      fair_analysis: {
        input: breakdown.fair_analysis.input,
        output: breakdown.fair_analysis.output,
        calls: breakdown.fair_analysis.calls,
        cost: calculateCost(breakdown.fair_analysis.input, breakdown.fair_analysis.output, usage.ai_model),
      },
      total: parseFloat(usage.ai_cost_usd),
      total_tokens: usage.ai_tokens_total,
      model: usage.ai_model,
    });
  } catch (error) {
    console.error('[Costs API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve cost data' },
      { status: 500 }
    );
  }
}
