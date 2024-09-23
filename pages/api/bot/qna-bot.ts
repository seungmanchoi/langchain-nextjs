import type { NextApiRequest, NextApiResponse } from 'next';

// 웹페이지 크롤링을 위한 cheerio 패키지 참조하기
// npm i cheerio 설치필요
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';

// 텍스트 분할기 객체 참조하기
// RAG 인덱싱 과정중에 다량의 문자열을 특정 기준으로 문장단위로 쪼개는 스플리터
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

// 스플릿된 청크 문자열을 백터화한 백터데이터를 저장하기 위한 저장소로 [메모리 전용 백터 저장소]
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';

// langchain/hub를 통해 공유된 rag전용 프롬프트 템플릿 참조 생성하기
import { pull } from 'langchain/hub';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';

import { StringOutputParser } from '@langchain/core/output_parsers';
import { EUserType, IMemberMessage } from '@/interfaces/message';
import { createLLMModel, EModelName } from '@/utils/common';

// 백엔드에서 프론트엔드로 전달할 결과 데이터 정의하기
type ResponseData = {
  code: number;
  data: IMemberMessage | null;
  msg: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  // 클라이언트에서 서버로 전달된 데이터를 가져오기
  try {
    if (req.method?.toUpperCase() === 'POST') {
      // Step 0: 프론트에서 전달된 질문과 닉네임 정보 추출하기
      const { message } = req.body;

      // Step1:Indexing 웹페이지 로더 객체 생성하고 페이지 로딩하기
      // Step1-1: 웹페이지 로딩하기
      const loader = new CheerioWebBaseLoader(
        'https://api.ncloud-docs.com/docs/common-ncpapi',
      );
      const docs = await loader.load();

      // Step1-2: 텍스트 분할기 객체 생성 및 텍스트 분할하기(Chunk)
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      // 텍스트 분할처리하기
      const splitedDoc = await textSplitter.splitDocuments(docs);

      // Step1-3 : 임베딩처리(split된 단어를 벡터 데이터화 처리)하고 벡터저장소에 저장하기
      //임베딩시에는 반드시 지정된 임베딩 모델을 통해 임베딩처리합니다.
      const vectorStore = await MemoryVectorStore.fromDocuments(
        splitedDoc,
        new OpenAIEmbeddings(),
      );

      // Step2: 임베딩된 데이터 조회하기 (리트리버실시)
      // 검색기 생성하기
      const retriever = vectorStore.asRetriever();
      // 사용자 질문을 이용해 벡터저장소를 조회하고 조회결괄 반환받는다.
      const retrieverResult = await retriever.invoke(message);

      // Step3:RAG 기반(증강된 검색데이터를 통한) LLM 호출하기
      const model = createLLMModel(process.env.MODEL as EModelName);

      //rag전용 프롬프트 템플릿 생성
      const ragPrompt = await pull<ChatPromptTemplate>('rlm/rag-prompt');

      // rag전용 프롬프트 기반 체인 생성하기
      const ragChain = await createStuffDocumentsChain({
        llm: model!,
        prompt: ragPrompt,
        outputParser: new StringOutputParser(),
      });

      //체인 실행해서 rag 조회결과를 llm에 전달하고 결과 받아오기
      const result = await ragChain.invoke({
        question: message,
        context: retrieverResult,
      });

      const apiResult = {
        code: 200,
        data: {
          userType: EUserType.BOT,
          message: result,
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
