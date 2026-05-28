const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  systemInstruction: 'You are a trivia question generator. Respond with valid JSON only — no markdown, no code blocks, no extra text.',
  generationConfig: {
    responseMimeType: 'application/json',
    maxOutputTokens: 4096,
  },
});

async function generateQuestions({ category, difficulty, amount }) {
  const topic = CATEGORY_LABELS[category] ?? CATEGORY_LABELS[''];
  const diff  = difficulty || 'mixed difficulty (vary between easy, medium, and hard)';

  const prompt = `Generate ${amount} unique multiple-choice trivia questions about ${topic} at ${diff}.

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
- difficulty field must be "easy", "medium", or "hard"`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim()
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
