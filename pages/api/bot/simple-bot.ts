import type { NextApiRequest, NextApiResponse } from 'next';
import { ChatOpenAI } from '@langchain/openai';
import { EUserType, IMemberMessage } from '@/interfaces/message';

// 백엔드에서 프론트엔드로 전달할 결과 데이터 정의하기
type ResponseData = {
  code: number;
  data: IMemberMessage | null;
  msg: string;
};

enum EModelName {
  OPENAI = 'openai',
  GEMINI = 'gemini',
}

const createLLMModel = (model: EModelName) => {
  if (model === EModelName.OPENAI) {
    const llm = new ChatOpenAI({
      model: 'gpt-4o',
      apiKey: process.env.OPENAI_API_KEY,
    });

    return llm;
  }
};

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

      // Case1: 심플 챗봇 (질문 응답)
      const result = await llm!.invoke(message);
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