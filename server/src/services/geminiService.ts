import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';

function getGeminiApiKey(): string | undefined {
  return (
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY
  );
}

function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
}

export async function generatePersonalizedTips(
  totalKg: number,
  categoryBreakdown: {
    transport: { kg: number; pct: number };
    food: { kg: number; pct: number };
    energy: { kg: number; pct: number };
    shopping: { kg: number; pct: number };
    waste: { kg: number; pct: number };
  },
  userCountry: string
): Promise<any> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.warn('Gemini API key not found. Using fallback mock insights.');
    return getFallbackInsights(categoryBreakdown);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: getGeminiModel(),
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `
You are a carbon footprint reduction expert.
User profile (last 30 days):
- Total: ${totalKg} kg CO2e
- Transport: ${categoryBreakdown.transport.kg} kg (${categoryBreakdown.transport.pct}%)
- Food: ${categoryBreakdown.food.kg} kg (${categoryBreakdown.food.pct}%)
- Energy: ${categoryBreakdown.energy.kg} kg (${categoryBreakdown.energy.pct}%)
- Shopping: ${categoryBreakdown.shopping.kg} kg (${categoryBreakdown.shopping.pct}%)
- Waste: ${categoryBreakdown.waste.kg} kg (${categoryBreakdown.waste.pct}%)
- Location: ${userCountry}

Generate exactly 3 personalized, specific, actionable tips to reduce their footprint.
Focus on their highest-impact category first.
Format as JSON: { "tips": [{ "title": string, "description": string, "estimatedSavingKg": number, "difficulty": "easy" | "medium" | "hard", "category": string }] }
Be specific to their actual numbers, not generic advice.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (error: any) {
    console.error('Gemini API error:', error);
    try {
      fs.appendFileSync('gemini_errors.log', `${new Date().toISOString()} - Tips Error: ${error.message || error}\nStack: ${error.stack}\n\n`);
    } catch (e) {}
    return getFallbackInsights(categoryBreakdown);
  }
}

function getFallbackInsights(breakdown: any) {
  const sorted = Object.entries(breakdown)
    .map(([cat, val]: any) => ({ cat, kg: val.kg }))
    .sort((a, b) => b.kg - a.kg);

  const highestCat = sorted[0]?.cat || 'transport';

  const defaults: Record<string, any[]> = {
    transport: [
      {
        title: 'Switch to public transport or carpool',
        description: 'Your transport emissions are your highest contributor. Commuting by bus or train instead of driving solo can save significant emissions.',
        estimatedSavingKg: 45,
        difficulty: 'medium',
        category: 'transport',
      },
      {
        title: 'Maintain vehicle tire pressure',
        description: 'Under-inflated tires increase fuel consumption. Keep them inflated to the recommended pressure.',
        estimatedSavingKg: 10,
        difficulty: 'easy',
        category: 'transport',
      },
    ],
    food: [
      {
        title: 'Introduce Meatless Mondays',
        description: 'Replacing meat with plant-based alternatives just one day a week significantly reduces food footprint.',
        estimatedSavingKg: 25,
        difficulty: 'easy',
        category: 'food',
      },
      {
        title: 'Reduce food waste',
        description: 'Plan your meals to avoid throwing away leftovers. Food waste in landfills produces methane, a potent greenhouse gas.',
        estimatedSavingKg: 15,
        difficulty: 'easy',
        category: 'food',
      },
    ],
    energy: [
      {
        title: 'Switch to LED bulbs',
        description: 'LEDs use up to 80% less energy than traditional incandescent bulbs and last much longer.',
        estimatedSavingKg: 20,
        difficulty: 'easy',
        category: 'energy',
      },
      {
        title: 'Unplug idle electronics',
        description: 'Many appliances draw "phantom" power even when turned off. Unplug them or use smart power strips.',
        estimatedSavingKg: 8,
        difficulty: 'easy',
        category: 'energy',
      },
    ],
    shopping: [
      {
        title: 'Buy pre-loved clothing items',
        description: 'Extend the life cycle of garments. Buying secondhand reduces demand for resource-intensive fast-fashion manufacturing.',
        estimatedSavingKg: 30,
        difficulty: 'medium',
        category: 'shopping',
      },
    ],
    waste: [
      {
        title: 'Compost organic kitchen waste',
        description: 'Diverting organic waste from landfills to compost bins reduces methane emissions and creates rich soil.',
        estimatedSavingKg: 12,
        difficulty: 'medium',
        category: 'waste',
      },
    ],
  };

  const selectedTips = [...(defaults[highestCat] || defaults.transport)];
  const secondaryCat = sorted[1]?.cat || 'energy';
  if (defaults[secondaryCat]?.[0]) {
    selectedTips.push(defaults[secondaryCat][0]);
  }
  while (selectedTips.length < 3) {
    selectedTips.push({
      title: 'Adopt energy-saving habits',
      description: 'Turn off lights when leaving a room and use natural ventilation when possible.',
      estimatedSavingKg: 5,
      difficulty: 'easy',
      category: 'energy',
    });
  }

  return { tips: selectedTips.slice(0, 3) };
}

export async function generateChatResponse(
  message: string,
  history: { role: 'user' | 'model'; text: string }[],
  userContext?: {
    name: string;
    country: string;
    monthlyTarget: number | null;
    totalKg: number;
    breakdown: {
      transport: { kg: number; pct: number };
      food: { kg: number; pct: number };
      energy: { kg: number; pct: number };
      shopping: { kg: number; pct: number };
      waste: { kg: number; pct: number };
    };
  }
): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return "I'm currently running in offline mode. Please configure a valid Gemini API key to start a live AI chat.";
  }

  try {
    let systemInstruction = 'You are GreenTrace AI, a carbon footprint reduction expert. Help the user track, analyze, and reduce their carbon emissions. Keep answers concise, actionable, and encouraging. Cite IPCC and EPA values where appropriate.';

    if (userContext) {
      systemInstruction += `\n\nUser Profile & Data Context:
- Name: ${userContext.name}
- Location: ${userContext.country}
- Monthly Budget Target: ${userContext.monthlyTarget ? userContext.monthlyTarget + ' kg CO₂e' : 'None set'}
- Actual Emissions (Last 30 Days): ${userContext.totalKg.toFixed(1)} kg CO₂e
- Category Breakdown:
  * Transport: ${userContext.breakdown.transport.kg.toFixed(1)} kg (${userContext.breakdown.transport.pct}%)
  * Food: ${userContext.breakdown.food.kg.toFixed(1)} kg (${userContext.breakdown.food.pct}%)
  * Energy: ${userContext.breakdown.energy.kg.toFixed(1)} kg (${userContext.breakdown.energy.pct}%)
  * Shopping: ${userContext.breakdown.shopping.kg.toFixed(1)} kg (${userContext.breakdown.shopping.pct}%)
  * Waste: ${userContext.breakdown.waste.kg.toFixed(1)} kg (${userContext.breakdown.waste.pct}%)

Greeting: Address the user by their name ("${userContext.name}"). Since they have shared their carbon footprint database with you, you should speak directly to their actual numbers and category breakdown if they ask about their footprint, progress, or how they can improve. Make your tone friendly, scientifically grounded, and personal.`;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: getGeminiModel(),
      systemInstruction,
    });

    const chatHistory = history.map((item) => ({
      role: item.role === 'user' ? 'user' : 'model',
      parts: [{ text: item.text }],
    }));

    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(message);
    return result.response.text();
  } catch (error: any) {
    console.error('Gemini Chat error:', error);
    try {
      fs.appendFileSync('gemini_errors.log', `${new Date().toISOString()} - Chat Error: ${error.message || error}\nStack: ${error.stack}\n\n`);
    } catch (e) {}
    return getLocalChatFallback(message);
  }
}

function getLocalChatFallback(message: string): string {
  const msg = message.toLowerCase();
  
  if (msg.includes('mutton') || msg.includes('meat') || msg.includes('food')) {
    return "Meat-heavy diets have a significant carbon footprint. Mutton and lamb produce approximately 39.2 kg CO₂e per kg of food, due to enteric fermentation (methane emissions from ruminant digestion). You can reduce your food footprint by introducing plant-based meals (which average only 0.5 kg CO₂e per meal) or switching to low-impact meats like chicken (6.9 kg CO₂e).";
  }
  
  if (msg.includes('car') || msg.includes('transport') || msg.includes('drive') || msg.includes('flight') || msg.includes('travel')) {
    return "Transport emissions depend heavily on fuel efficiency and transport mode. A standard petrol car emits about 0.171 kg CO₂e per km, while electric vehicles emit 0.053 kg CO₂e per km (based on the average grid mix). Taking a bus (0.089 kg CO₂e/km) or train (0.041 kg CO₂e/km) is much more sustainable. For long journeys, try to avoid domestic flights as they emit 0.255 kg CO₂e per km.";
  }

  if (msg.includes('energy') || msg.includes('electricity') || msg.includes('light') || msg.includes('coal')) {
    return "Home energy footprints can be cut quickly. Switching to LEDs reduces lighting energy by 80%. Unplugging phantom loads (devices on standby) saves up to 8% of energy emissions. In India, grid electricity averages about 0.233 kg CO₂e/kWh due to heavy coal usage, so conserving every kilowatt-hour has a big direct impact.";
  }

  if (msg.includes('waste') || msg.includes('recycle') || msg.includes('trash')) {
    return "Organic waste in landfills decomposes anaerobically to produce methane. Landfill waste has a factor of 0.5 kg CO₂e per kg, whereas recycling (0.021 kg CO₂e/kg) or composting (0.01 kg CO₂e/kg) keeps emissions close to zero. Diverting your kitchen waste is an easy way to lower your trash footprint.";
  }

  return "I ran into a connection error with the Google AI servers, but I am here in offline mode to help! You can ask me questions like:\n\n1. 'Why is mutton high footprint?'\n2. 'How can I cut my transport emissions?'\n3. 'How can I reduce waste?'\n4. 'Tell me about energy conservation.'";
}
