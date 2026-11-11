export const AI_FEEDBACK_URL = process.env.NEXT_PUBLIC_AI_FEEDBACK_URL ?? "";

export interface AiFeedbackRequest {
  sourceLanguage: string;
  targetLanguage: string;
  level: string;
  prompt: string;
  answer: string;
  references: string[];
  explanationTerms: string[];
}

export async function requestAiFeedback(input: AiFeedbackRequest): Promise<string> {
  if (!AI_FEEDBACK_URL) throw new Error("AI feedback endpoint is not configured.");
  const response = await fetch(AI_FEEDBACK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(`AI feedback failed with ${response.status}.`);
  const data = (await response.json()) as { feedback?: string; text?: string };
  const feedback = data.feedback ?? data.text;
  if (!feedback) throw new Error("AI feedback response was empty.");
  return feedback;
}
