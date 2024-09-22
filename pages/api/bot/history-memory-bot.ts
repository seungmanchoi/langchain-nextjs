import type { NextApiRequest, NextApiResponse } from 'next';
import { ChatOpenAI } from '@langchain/openai';
import { EUserType, IMemberMessage } from '@/interfaces/message';
import { ChatPromptTemplate } from '@langchain/core/prompts';

//LLM 응답메시지 타입을 원하는 타입결과물로 파싱(변환)해주는 아웃풋파서참조하기
//StringOutputParser는 AIMessage타입에서 content속성값만 문자열로 반환해주는 파서입니다.
import { StringOutputParser } from '@langchain/core/output_parsers';

// 대화이력 기반 챗봇 구현을 위한 각종 객체 참조하기
// 챗봇과의 대화이력정보 관리를 위한 메모리 기반 InMemoryChatMessageHistory 객체 참조하기
// 서버 인메모리상에서 저장해서 다룬다.
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';

//대화이력 관리를 위한 세부 주요 객체 참조하기
import { RunnableWithMessageHistory } from '@langchain/core/runnables';

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

//메모리 영역에 실제 대화이력이  저장되는 전역변수 선언 및 구조정의
//Record<string:사용자세션아이디, InMemoryChatMessageHistory:사용자별대화이력객체>
const messageHistories: Record<string, InMemoryChatMessageHistory> = {};

// 백엔드 REST API 기능을 제공해주는 처리함수 구현하기
// req는 클라이언트에서 서버로 제공되는 각종정보를 포함하는 매개변수이고 타입은 NextApiRequest이다.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  try {
    // 클라이언트에서 서버로 전달된 데이터를 가져오기
    if (req.method?.toUpperCase() === 'POST') {
      const { nickName, message } = req.body;

      // LLM 모델 생성
      const llm = createLLMModel(process.env.MODEL as EModelName);

      const promptTemplate = ChatPromptTemplate.fromMessages([
        ['system', '당신은 사용자와의 모든 대화이력을 기억합니다.'],
        ['placeholder', '{chat_history}'],
        ['human', '{input}'],
      ]);

      // Case3-2: OutputParser를 이용한 2개의 체인(작업을 순서대로)을 실행하기
      // LLM output parser를 이용해 응답결과를 원하는 타입으로 파싱하기
      const outputParser = new StringOutputParser();
      const chains = promptTemplate.pipe(llm!).pipe(outputParser);

      //대화이력관리를 위한 체인생성(대화이력관리작업)
      //RunnableWithMessageHistory({runnable:llm모델정보,getMessageHistory:()=>{지정된사용자의대화이력반환}},
      //,inputMessagesKey:사용자입력프롬프트값전달,historyMessagesKey:지정된사용자의대화이력정보를 llm에게전달)
      const historyChain = new RunnableWithMessageHistory({
        runnable: chains,
        getMessageHistory: async (sessionId) => {
          //메모리 영역에 해당 세션 아이디 사용자의 대화이력이 없으면 대화이력 관리 객체를 생성해준다.
          if (messageHistories[sessionId] == undefined) {
            messageHistories[sessionId] = new InMemoryChatMessageHistory();
          }
          return messageHistories[sessionId];
        },
        inputMessagesKey: 'input',
        historyMessagesKey: 'chat_history',
      });

      //사용자 세션 아이디 값 구성하기
      //현재 챗봇을 호출한 사용자 아이디값을 세션아이디로 설정해줍니다.
      //추후 프론트엔드서 전달된 사용자아디값을 세션아이디 값으로 설정해주면 되세요..
      const config = {
        configurable: { sessionId: nickName },
      };

      const result = await historyChain.invoke({ input: message }, config);
      const apiResult = {
        code: 200,
        data: {
          userType: EUserType.BOT,
          message: result, // step 3-2는 이걸 사용
          // message: result.content as string, step1, 2, 3은 이걸 활성화 해야함.
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
