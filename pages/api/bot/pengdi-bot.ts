import type { NextApiRequest, NextApiResponse } from 'next';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import {
  // createEmbeddingModel,
  createLLMModel,
  EModelName,
} from '@/utils/common';

import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';
import { EUserType, ResponseData } from '@/interfaces/message';
// import { Chroma } from '@langchain/community/vectorstores/chroma';

// 메모리 영역에 실제 대화이력이 저장되는 전역변수 선언 및 구조정의
const messageHistories: Record<string, InMemoryChatMessageHistory> = {};

// 채널별 최대 메시지 개수
const MAX_MESSAGES_PER_CHANNEL = 20;

// const embeddings = createEmbeddingModel();
// const vectorStore = new Chroma(embeddings, {
//   url: process.env.CHROMADB_ENDPOINT,
//   collectionName: 'nd_blog',
// });

// 백엔드 REST API 기능을 제공해주는 처리함수 구현하기
// req는 클라이언트에서 서버로 제공되는 각종정보를 포함하는 매개변수이고 타입은 NextApiRequest이다.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  try {
    // 클라이언트에서 서버로 전달된 데이터를 가져오기
    if (req.method?.toUpperCase() === 'POST') {
      const { message, user } = req.body;

      const llm = createLLMModel(process.env.MODEL as EModelName);

      // Case3: 프롬프트 템플릿을 이용한 메시지 전달하고 응답하기
      const prompt = process.env.ND_SLACK_BOT_PROMPT || '';
      const promptTemplate = ChatPromptTemplate.fromMessages([
        {
          type: 'system',
          content: prompt,
        },
        ['placeholder', '{chat_history}'],
        ['human', '{input}'],
      ]);

      const outputParser = new StringOutputParser();
      const chains = promptTemplate.pipe(llm!).pipe(outputParser);

      const historyChain = new RunnableWithMessageHistory({
        runnable: chains,
        getMessageHistory: async (sessionId) => {
          const historyKey = `${sessionId}`;
          if (!messageHistories[historyKey]) {
            messageHistories[historyKey] = new InMemoryChatMessageHistory();
          }

          // 메시지 개수 제한 로직
          const history = messageHistories[historyKey];
          const messages = await history.getMessages();
          if (messages.length > MAX_MESSAGES_PER_CHANNEL) {
            const excessMessages = messages.length - MAX_MESSAGES_PER_CHANNEL;
            await history.clear();
            for (let i = excessMessages; i < messages.length; i++) {
              await history.addMessage(messages[i]);
            }
          }

          return messageHistories[historyKey];
        },
        inputMessagesKey: 'input',
        historyMessagesKey: 'chat_history',
      });

      const config = {
        configurable: { sessionId: user },
      };

      const result = await historyChain.invoke({ input: message }, config);

      const apiResult = {
        code: 200,
        data: {
          userType: EUserType.BOT,
          message: result as string,
          sendDate: new Date(),
        },
        msg: 'success',
      };

      // 서버에서 클라이언트로 전달할 데이터를 전달하기
      res.status(200).json(apiResult);
    } else {
      res
        .status(405)
        .json({ code: 405, data: null, msg: 'Method Not Allowed' });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, data: null, msg: 'failed' });
  }
}
