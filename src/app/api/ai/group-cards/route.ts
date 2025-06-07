import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { AICardData, AICardGroup } from '@/types/ai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { cards, columnTitle } = await request.json();

    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json({ error: 'No cards provided for grouping' }, { status: 400 });
    }

    // Prepare the prompt for OpenAI
    const cardsText = cards
      .map(
        (card: AICardData, index: number) =>
          `${index + 1}. "${card.content}" (by ${card.authorName})`,
      )
      .join('\n');

    const prompt = `You are helping organize a sprint retrospective board. 
Column: "${columnTitle}"

Cards:
${cardsText}

Group these cards by similarity. For each group:
1. Provide a clear group name
2. List the card numbers that belong to this group

Rules:
- Create 2-5 groups maximum
- Each card should be in exactly one group
- Group names should be actionable and clear

Respond in this exact JSON format:
{
  "groups": [
    {
      "name": "Group Name",
      "cardNumbers": [1, 3, 5]
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert facilitator helping organize sprint retrospective feedback. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the AI response
    let aiGroups;
    try {
      aiGroups = JSON.parse(response);
    } catch (parseError) {
      console.error('Failed to parse AI response:', response);
      throw new Error('Invalid AI response format');
    }

    // Transform AI response into our format
    const cardGroups: AICardGroup[] = aiGroups.groups.map((group: any) => ({
      cards: group.cardNumbers.map((num: number) => cards[num - 1]).filter(Boolean),
      spacerName: group.name,
      spacerColor: 'bg-blue-200', // All AI-generated spacers use blue
    }));

    // Validate that all cards are included
    const allGroupedCardIds = new Set(
      cardGroups.flatMap((group) => group.cards.map((card) => card.id)),
    );

    // Add any missing cards to a miscellaneous group
    const missingCards = cards.filter((card: AICardData) => !allGroupedCardIds.has(card.id));
    if (missingCards.length > 0) {
      cardGroups.push({
        cards: missingCards,
        spacerName: 'Other Items',
        spacerColor: 'bg-blue-200',
      });
    }

    return NextResponse.json({
      success: true,
      groups: cardGroups,
      totalCards: cards.length,
      groupCount: cardGroups.length,
    });
  } catch (error) {
    console.error('AI grouping error:', error);

    return NextResponse.json(
      {
        error: 'Failed to group cards',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
