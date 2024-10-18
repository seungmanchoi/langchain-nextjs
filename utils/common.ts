import { ChatOpenAI } from '@langchain/openai';
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from '@langchain/google-genai';

export enum EModelName {
  OPENAI = 'openai',
  GEMINI = 'gemini',
}

export const createEmbeddingModel = (): GoogleGenerativeAIEmbeddings => {
  return new GoogleGenerativeAIEmbeddings({
    model: process.env.GEN_AI_EMBEDDING_MODEL_NAME,
    apiKey: process.env.GEMINI_API_KEY,
  });
};

export const createLLMModel = (model: EModelName) => {
  if (model === EModelName.OPENAI) {
    return new ChatOpenAI({
      model: process.env.GPT_MODEL_NAME,
      // temperature: 0.2,
      apiKey: process.env.OPENAI_API_KEY,
    });
  } else if (model === EModelName.GEMINI) {
    return new ChatGoogleGenerativeAI({
      model: process.env.GEMINI_MODEL_NAME,
      apiKey: process.env.GEMINI_API_KEY,
      // maxOutputTokens: 2048
    });
  }
};
