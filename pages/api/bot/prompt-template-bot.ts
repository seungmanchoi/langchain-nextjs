import type { NextApiRequest, NextApiResponse } from 'next';
import { EUserType, ResponseData } from '@/interfaces/message';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createLLMModel, EModelName } from '@/utils/common';

// 백엔드 REST API 기능을 제공해주는 처리함수 구현하기
// req는 클라이언트에서 서버로 제공되는 각종정보를 포함하는 매개변수이고 타입은 NextApiRequest이다.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  try {
    // 클라이언트에서 서버로 전달된 데이터를 가져오기
    if (req.method?.toUpperCase() === 'POST') {
      const { message } = req.body;

      // LLM 모델 생성
      const llm = createLLMModel(process.env.MODEL as EModelName);

      // Case3: 프롬프트 템플릿을 이용한 메시지 전달하고 응답하기
      const promptTemplate = ChatPromptTemplate.fromMessages([
        {
          type: 'system',
          content:
            'You are an Japanese translator. Translate the following message to Japanese:',
        },
        { type: 'user', content: '{input}' },
        // 추가로 어시스턴트 메시지를 포함해 이전 응답을 모델에게 전달할 수도 있습니다.
        // {
        //   type: 'assistant',
        //   content: 'Previous message translated: {previous_translation}',
        // },
      ]);

      // Case3-1: 프롬프트 템플릿을 이용한 메시지 전달하고 응답하기
      // LLM의 질문과 응답과정에서 발생하는 작업의 단위를 체인이라고 합니다.
      // 여러개의 체인을 연결해 최종 사용자 질문에 대한 응답을 받는 방법을 Langchain에서는 파이프라인이라고 합니다.
      const chain = promptTemplate.pipe(llm!);
      const result = await chain.invoke({
        input: message,
        // previous_translation: '이전 메시지 번역 결과'
      });
      const apiResult = {
        code: 200,
        data: {
          userType: EUserType.BOT,
          message: result.content as string,
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
  } catch {
    res.status(500).json({ code: 500, data: null, msg: 'failed' });
  }
}
