import type { NextApiRequest, NextApiResponse } from 'next';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import {
  // createEmbeddingModel,
  createLLMModel,
  EModelName,
} from '@/utils/common';
import axios from 'axios';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';
// import { Chroma } from '@langchain/community/vectorstores/chroma';

async function sendMessageToSlack(channel: string, text: string) {
  try {
    await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel: channel,
        text: text,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`, // Slack Bot User OAuth Token
        },
      },
    );
  } catch (error) {
    console.error('Error sending message to Slack:', error);
  }
}

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
  res: NextApiResponse<string>,
) {
  try {
    // 클라이언트에서 서버로 전달된 데이터를 가져오기
    const { event } = req.body;

    if (req.body.type === 'url_verification') {
      // Slack이 보낸 challenge 값을 그대로 응답
      return res.status(200).send(req.body.challenge);
    }

    // Slack의 재시도 요청 확인 및 처리 방지
    const retryNum = req.headers['x-slack-retry-num'];
    if (retryNum) {
      console.log(`Slack Retry Attempt: ${retryNum}`);
      return res.status(200).send('OK');
    }

    if (event && event.type === 'app_mention') {
      const message = event.text.replace(/<[^>]*>/g, ''); // 사용자가 보낸 메시지
      const channel = event.channel; // 메시지가 발생한 채널
      const user = event.user; // 메시지를 보낸 사용자 ID

      // 메시지를 임베딩합니다.
      // const queryEmbedding = await embeddings.embedQuery(message);
      // const relevantDocs = await vectorStore.similaritySearchVectorWithScore(
      //   queryEmbedding,
      //   5,
      // );

      // const context = relevantDocs.map((doc) => doc.pageContent).join('\n\n');
      // const context = relevantDocs
      //   .map(([doc, score]) => {
      //     return doc.metadata.text;
      //   })
      //   .join('\n\n');

      // LLM 모델 생성
      const llm = createLLMModel(process.env.MODEL as EModelName);

      // Case3: 프롬프트 템플릿을 이용한 메시지 전달하고 응답하기
      const prompt = process.env.ND_SLACK_BOT_PROMPT || '';
      const promptTemplate = ChatPromptTemplate.fromMessages([
        {
          type: 'system',
          content: prompt, //.replace('{{context}}', context),
        },
        ['placeholder', '{chat_history}'],
        ['human', '{input}'],
      ]);

      const outputParser = new StringOutputParser();
      const chains = promptTemplate.pipe(llm!).pipe(outputParser);

      const historyChain = new RunnableWithMessageHistory({
        runnable: chains,
        getMessageHistory: async (sessionId) => {
          const historyKey = `${channel}_${sessionId}`;
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

      await sendMessageToSlack(channel, result);

      // 서버에서 클라이언트로 전달할 데이터를 전달하기
      return res.status(200).send('success');
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send('failed');
  }
}
