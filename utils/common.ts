import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export enum EModelName {
  OPENAI = 'openai',
  GEMINI = 'gemini',
}

export const createLLMModel = (model: EModelName) => {
  if (model === EModelName.OPENAI) {
    return new ChatOpenAI({
      model: 'gpt-4o',
      // temperature: 0.2,
      apiKey: process.env.OPENAI_API_KEY,
    });
  } else if (model === EModelName.GEMINI) {
    return new ChatGoogleGenerativeAI({
      model: 'gemini-pro',
      apiKey: process.env.GEMINI_API_KEY,
    });
  }
};
