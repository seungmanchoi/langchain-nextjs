import { ChatOpenAI } from '@langchain/openai';

export enum EModelName {
  OPENAI = 'openai',
  GEMINI = 'gemini',
}

export const createLLMModel = (model: EModelName) => {
  if (model === EModelName.OPENAI) {
    const llm = new ChatOpenAI({
      model: 'gpt-4o',
      // temperature: 0.2,
      apiKey: process.env.OPENAI_API_KEY,
    });

    return llm;
  }
};
