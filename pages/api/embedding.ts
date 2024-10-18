import type { NextApiRequest, NextApiResponse } from 'next';
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
// import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

import { createEmbeddingModel } from '@/utils/common';
import { EUserType } from '@/interfaces/message';
import { ChromaClient, Embedding } from 'chromadb';
import * as cheerio from 'cheerio';

// Google Generative AI Embeddings 인스턴스 생성
const embeddings = createEmbeddingModel();

// ChromaDB 클라이언트 설정
const chroma = new ChromaClient({
  path: process.env.CHROMADB_ENDPOINT, // ChromaDB 서버 주소
});

// 텍스트 정제 함수
function cleanText(html: string): string {
  const $ = cheerio.load(html);
  // 스크립트와 스타일 태그 제거
  $('script, style').remove();
  // 텍스트 추출 및 정제
  return $('body')
    .text()
    .replace(/[\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/#[^\s#]+/g, '') // 해시태그(#으로 시작하는 단어) 제거
    .trim();
}

// ChromaDB 컬렉션 생성 또는 가져오기
async function getChromaCollection(collectionName: string) {
  try {
    let collection;

    try {
      // getCollection 시도
      collection = await chroma.getCollection({
        name: collectionName,
        embeddingFunction: {
          generate: async (texts: string[]): Promise<number[][]> => {
            const results = [];
            for (const text of texts) {
              // 각 텍스트에 대해 임베딩을 생성하고 숫자 배열로 반환
              const embedding = await embeddings.embedQuery(text);
              results.push(embedding);
            }
            return results;
          },
        },
      });
    } catch (error) {
      throw error;
      // 컬렉션이 없거나 다른 오류 발생 시
      // if (error.message.includes('does not exist')) {
      //   console.log(
      //     `Collection "${collectionName}" does not exist. Creating it.`,
      //   );
      //   collection = await chroma.createCollection({
      //     name: collectionName,
      //     embeddingFunction: {
      //       generate: async (texts: string[]): Promise<number[][]> => {
      //         const results = [];
      //         for (const text of texts) {
      //           const embedding = await embeddings.embedQuery(text);
      //           results.push(embedding);
      //         }
      //         return results;
      //       },
      //     },
      //   });
      // } else {
      //   // 다른 오류는 그대로 던짐
      //   throw error;
      // }
    }

    return collection;
  } catch (error) {
    console.error('Error accessing ChromaDB collection:', error);
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // 클라이언트에서 서버로 전달된 데이터를 가져오기
  try {
    if (req.method?.toUpperCase() === 'POST') {
      // Step 0: 프론트에서 전달된 질문과 닉네임 정보 추출하기
      const { url } = req.body;

      // Step1:Indexing 웹페이지 로더 객체 생성하고 페이지 로딩하기
      // Step1-1: 웹페이지 로딩하기
      const loader = new CheerioWebBaseLoader(url, {
        selector: '.se-viewer',
      });
      const docs = await loader.load();

      // 텍스트 정제
      const cleanedDocs = docs.map((doc) => {
        console.log('cleanText : ', cleanText(doc.pageContent));
        return {
          ...doc,
          pageContent: cleanText(doc.pageContent),
        };
      });

      // // 텍스트 분할
      // const textSplitter = new RecursiveCharacterTextSplitter({
      //   chunkSize: 10000,
      //   chunkOverlap: 200,
      // });
      //
      // // 텍스트 분할처리하기
      // const splitedDocs = await textSplitter.splitDocuments(cleanedDocs);

      // ChromaDB 컬렉션 가져오기
      const collectionName = 'nd_blog';
      const collection = await getChromaCollection(collectionName);

      // 각 페이지 전체를 임베딩하고 ChromaDB에 저장
      await Promise.all(
        cleanedDocs.map(async (doc, index) => {
          const embedding: number[] = await embeddings.embedQuery(
            doc.pageContent,
          );

          // ChromaDB에 임베딩된 페이지 저장
          await collection.add({
            ids: [`doc-${index}`], // 고유 식별자
            embeddings: [embedding as Embedding], // 임베딩 벡터
            metadatas: [{ text: doc.pageContent }], // 메타데이터로 원본 텍스트 추가
          });

          console.log(`Stored document ${index} in ChromaDB.`);
        }),
      );

      // 각 청크를 임베딩하고 ChromaDB에 저장
      // await Promise.all(
      //   splitedDocs.map(async (doc, index) => {
      //     const embedding = await embeddings.embedQuery(doc.pageContent);
      //
      //     // ChromaDB에 임베딩된 청크 저장
      //     await collection.add({
      //       ids: [`chunk-${index}`], // 고유 식별자
      //       embeddings: [embedding], // 임베딩 벡터
      //       metadatas: [{ text: doc.pageContent }], // 메타데이터로 원본 텍스트 추가
      //     });
      //
      //     console.log(`Stored chunk ${index} in ChromaDB.`);
      //   }),
      // );

      const apiResult = {
        code: 200,
        data: {
          userType: EUserType.BOT,
          message: 'Successfully stored the document in ChromaDB.',
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
