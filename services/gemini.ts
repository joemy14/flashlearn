export class GeminiService {
  // TODO: Insert your Gemini API Key here
  private static API_KEY = 'AIzaSyDdZZ7wOZOUkCDNZ1mBy5AbWqblsn-dmnM';
  private static BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  /**
   * Generates a structural JSON quiz based on a given topic using Google's Gemini API.
   */
  static async generateQuizFromTopic(topic: string, questionCount: number = 3): Promise<any> {
    if (this.API_KEY === 'YOUR_GEMINI_API_KEY_HERE' || !this.API_KEY.trim()) {
      throw new Error("Missing Gemini API Key. Please update services/gemini.ts with your key.");
    }

    const prompt = `
      You are an expert educational quiz generator.
      Generate a multiple choice quiz about "${topic}".
      Provide exactly ${questionCount} questions.
      Your response MUST be ONLY valid JSON matching this exact structure, with no markdown formatting or extra text:
      [
        {
          "category": "${topic.toUpperCase()}",
          "question": "The question text here?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct": 0
        }
      ]
      Note: 'correct' is the 0-based index of the correct option in the options array.
    `;

    try {
      const response = await fetch(`${this.BASE_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json"
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to connect to Gemini API.");
      }

      const data = await response.json();
      let textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textOutput) {
        throw new Error("Gemini API returned an empty or invalid response.");
      }

      // Sometimes Gemini might wrap the json in markdown blocks despite instructions
      textOutput = textOutput.replace(/```json/g, "").replace(/```/g, "").trim();

      // Return parsed native JSON array
      return JSON.parse(textOutput);
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  /**
   * Leverages Gemini to extract knowledge from raw parsed document contexts
   * or direct PDF multi-modal binary strings and generates a targeted quiz structure.
   */
  static async generateQuizFromDocument(documentText: string, pdfBase64: string | null = null, questionCount: number = 5): Promise<any> {
    if (this.API_KEY === 'YOUR_GEMINI_API_KEY_HERE' || !this.API_KEY.trim()) {
      throw new Error("Missing Gemini API Key. Please update services/gemini.ts with your key.");
    }

    const commandPrompt = `
      You are an expert educational quiz generator. I am attaching a source document for you to review.
      Based EXACTLY on the facts and content of this source document, generate a detailed ${questionCount}-question multiple choice quiz.
      Your response MUST be ONLY valid JSON matching this exact structure, with no markdown formatting or extra text:
      [
        {
          "category": "DOCUMENT ANALYSIS",
          "question": "The question text here?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct": 0
        }
      ]
      Note: 'correct' is the 0-based index of the correct option in the options array.
    `;

    // Package contents dynamically based on whether it is a physical PDF block or a parsed text string
    const partsArray: any[] = [{ text: commandPrompt }];

    if (pdfBase64) {
      partsArray.push({
        inlineData: { mimeType: "application/pdf", data: pdfBase64 }
      });
    } else {
      partsArray.push({
        text: `--- SOURCE DOCUMENT CONTENT ---\n${documentText}\n--- END SOURCE ---`
      });
    }

    try {
      const response = await fetch(`${this.BASE_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: partsArray }],
          generationConfig: {
            temperature: 0.2, // Lower temperature to strictly constrain hallucination beyond document body
            responseMimeType: "application/json"
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to connect to Gemini API.");
      }

      const data = await response.json();
      let textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textOutput) throw new Error("Gemini API returned an empty or invalid response.");
      textOutput = textOutput.replace(/```json/g, "").replace(/```/g, "").trim();

      return JSON.parse(textOutput);
    } catch (error: any) {
      console.error("Gemini Multi-Modal API Error:", error);
      throw error;
    }
  }
}
