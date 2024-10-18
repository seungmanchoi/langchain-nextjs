import type { NextApiRequest, NextApiResponse } from 'next';
import { ResponseData } from '@/interfaces/message';
import { ChromaClient } from 'chromadb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  try {
    const client = new ChromaClient({
      path: 'http://127.0.0.1:8000', // ChromaDB 서버 주소에 맞게 수정하세요
    });

    // 컬렉션 가져오기 (없으면 생성)
    const collection = await client.getOrCreateCollection({
      name: 'nd-blog',
    });

    // 컬렉션의 데이터 수 확인
    const count = await collection.count();
    console.log(`컬렉션의 총 데이터 수: ${count}`);

    // 샘플 데이터 조회
    if (count > 0) {
      const results = await collection.get({
        limit: Math.min(100, count), // 최대 100개 또는 컬렉션의 데이터 수만큼 조회
      });

      console.log('샘플 데이터:');
      results.ids.forEach((id, index) => {
        console.log(
          `${index + 1}. ID: ${id}, 메타데이터: ${JSON.stringify(
            results.metadatas[index],
          )}`,
        );
      });
    } else {
      console.log('컬렉션에 데이터가 없습니다.');
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, data: null, msg: 'failed' });
  }
}
