const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CATEGORY_LABELS = {
  '':           'a wide variety of topics',
  general:      'general knowledge and trivia',
  science:      'science and nature',
  history:      'world history',
  geography:    'world geography and countries',
  sports:       'sports and athletics',
  movies:       'movies and cinema',
  music:        'music, bands, and artists',
  technology:   'technology, computers, and the internet',
  literature:   'literature, books, and authors',
  food:         'food, cooking, and cuisine',
  art:          'art, artists, and culture',
  videogames:   'video games and gaming',
};

async function generateQuestions({ category, difficulty, amount }) {
  const topic = CATEGORY_LABELS[category] ?? CATEGORY_LABELS[''];
  const diff  = difficulty || 'mixed difficulty (vary between easy, medium, and hard)';

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: 'You are a trivia question generator. Respond with valid JSON only — no markdown, no code blocks, no extra text.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Generate ${amount} unique multiple-choice trivia questions about ${topic} at ${diff}.

Return exactly this JSON structure:
{
  "questions": [
    {
      "question": "Question ending with ?",
      "correct_answer": "Correct answer",
      "incorrect_answers": ["Wrong 1", "Wrong 2", "Wrong 3"],
      "category": "Short category label",
      "difficulty": "easy"
    }
  ]
}

Rules:
- Exactly ${amount} questions, each with exactly 3 incorrect answers
- Answers must be concise (1–8 words)
- Factually accurate, no duplicates
- difficulty field must be "easy", "medium", or "hard"`,
      },
    ],
  });

  const raw = response.content[0].text.trim()
    .replace(/^```(?:json)?\s*\n?/, '')
    .replace(/\n?```\s*$/, '')
    .trim();

  const data = JSON.parse(raw);

  if (!Array.isArray(data?.questions) || data.questions.length === 0) {
    throw new Error('AI returned an invalid question format');
  }

  return data.questions.slice(0, amount);
}

module.exports = { generateQuestions };
