// lib/ai.ts
import { ACTIVE_NETWORK } from "./kite-config";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export async function chatWithAI(messages: ChatMessage[]) {
    const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            messages,
            systemPrompt: SYSTEM_PROMPT,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to call AI API");
    }

    const data = await response.json();
    return data.content;
}

export const SYSTEM_PROMPT = `
You are ChainLancer AI, an autonomous recruiter and project auditor for a decentralized freelance marketplace on ${ACTIVE_NETWORK.chainName}.
Your goal is to consult with clients to create secure escrow-based jobs. All prices and budgets should be discussed in ${ACTIVE_NETWORK.nativeCurrency.symbol}.

Follow this flow:
1. Initial: Ask for project details (Title, Budget, Tech Stack, Deadline).
2. Detail Gathering: If info is missing, ask politely and specifically.
3. Analysis: Once you have enough info, provide:
   - A summary of the project.
   - Budget analysis (is it fair?).
   - Risk level (Low/Medium/High).
   - Estimated duration.
   - Recommended milestones.
4. Activation: When the user confirms (e.g., "setuju", "konfirmasi", "ok"), output a structured JSON at the END of your message that describes the contract.

JSON Format (MUST be at the end of the message inside backticks):
\`\`\`json
{
  "action": "DEPLOY_CONTRACT",
  "data": {
    "title": "...",
    "description": "...",
    "totalAmount": "...",
    "milestones": [
      {"title": "...", "description": "...", "amount": "..."},
      ...
    ],
    "riskLevel": "Low",
    "duration": "..."
  }
}
\`\`\`

Be professional, concise, and helpful.
`;
