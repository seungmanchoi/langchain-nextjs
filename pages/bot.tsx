import { useState } from 'react';
import { EUserType, IMemberMessage } from '@/interfaces/message';
import dayjs from 'dayjs';

const Bot = () => {
  // useState
  // 리액트 useState 훅은 화면 UI요소에 데이터를 바인딩하기 위한 방법을 제공합니다.
  // UI요소와 useState훅으로 만들어진 데이터 바인딩을 통해 ui요소의 입력값이 바뀌면 자동으로 데이터소스가 바뀌고
  // 데이터 소스가 바뀌면 ui요소가 자동으로 바뀌는 데이터바인딩 기능을 useState훅이 제공합니다.
  const [nickName, setNickName] = useState<string>('You');
  const [message, setMessage] = useState<string>('');
  const [messageList, setMessageList] = useState<IMemberMessage[]>([
    {
      userType: EUserType.BOT,
      message: '안녕하세요. 무엇을 도와드릴까요?',
      sendDate: new Date(),
    },
  ]);
  const [apiUri, setApiUri] = useState<string>('/api/bot/simple-bot');

  const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setMessageList((prev) => [
      ...prev,
      {
        userType: EUserType.USER,
        message: message,
        sendDate: new Date(),
        nickName: 'You',
      },
    ]);

    // input 초기화
    setMessage('');

    const response = await fetch(apiUri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nickName,
        message,
      }),
    });

    if (response.status === 200) {
      const result = await response.json();
      // 챗봇이 보내준 메시지를 받아 메시지 이력에 반영하기
      setMessageList((prev) => [...prev, result.data]);
    }
  };

  return (
    <div className="flex h-screen antialiased text-gray-800 mt-3 pb-10">
      <div className="flex flex-row h-full w-full overflow-x-hidden">
        <div className="flex flex-col flex-auto h-full p-6">
          <div className="flex flex-col flex-auto flex-shrink-0 rounded-2xl bg-gray-100 h-full p-4">
            {/* 메시지 목록 출력영역 */}
            <div className="flex flex-col h-full overflow-x-auto mb-4">
              <div className="flex flex-col h-full">
                <div className="grid grid-cols-12 gap-y-2">
                  {
                    // 메시지 목록을 출력하는 영역
                    messageList.map((message, index) => {
                      if (message.userType === EUserType.BOT) {
                        return (
                          <div
                            key={index}
                            className="col-start-1 col-end-8 p-3 rounded-lg"
                          >
                            <div className="flex flex-row items-center">
                              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 flex-shrink-0 text-white">
                                Bot
                              </div>
                              <div className="relative ml-3 text-sm bg-white py-2 px-4 shadow rounded-xl">
                                <div>{message.message}</div>
                                <div className="absolute w-[200px] text-xs bottom-0 left-0 -mb-5 text-gray-500">
                                  <span>
                                    {dayjs(message.sendDate).format(
                                      'YYYY-MM-DD hh:mm:ss',
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div
                            key={index}
                            className="col-start-6 col-end-13 p-3 rounded-lg"
                          >
                            <div className="flex items-center justify-start flex-row-reverse">
                              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 flex-shrink-0 text-white">
                                {message.nickName}
                              </div>
                              <div className="relative mr-3 text-sm bg-indigo-100 py-2 px-4 shadow rounded-xl">
                                <div>{message.message}</div>
                                <div className="absolute w-[200px] text-right text-xs bottom-0 right-0 -mb-5 text-gray-500">
                                  <span>
                                    {dayjs(message.sendDate).format(
                                      'YYYY-MM-DD hh:mm:ss',
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })
                  }
                </div>
              </div>
            </div>

            {/* 메시지 입력 및 보내기 영역 */}
            <form
              onSubmit={sendMessage}
              className="flex flex-row items-center h-16 rounded-xl bg-white w-full px-4"
            >
              {/* 파일첨부버튼영역 */}
              <div>
                {/* 드롭다운 메뉴 추가 */}
                <select
                  className="ml-2 border rounded-xl focus:outline-none focus:border-indigo-300 pl-2 h-10"
                  onChange={(e) => {
                    // 드롭다운에서 선택된 값 처리 이벤트
                    setApiUri(e.target.value);
                  }}
                >
                  <option value="/api/bot/simple-bot">Simple bot</option>
                  <option value="/api/bot/role-based-bot">
                    Role based bot(영어로 번역)
                  </option>
                  <option value="/api/bot/prompt-template-bot">
                    Prompt Template bot(일어로 번역)
                  </option>
                  <option value="/api/bot/history-memory-bot">
                    History memory bot(대화 기억)
                  </option>
                  <option value="/api/bot/qna-bot">
                    RAG QnA bot(NCloud API)
                  </option>
                </select>
              </div>

              {/* 메시지 입력요소 영역 */}
              <div className="flex-grow ml-4">
                <div className="flex w-full">
                  <input
                    type="text"
                    value={nickName}
                    onChange={(e) => setNickName(e.target.value)}
                    placeholder="닉네임"
                    className="flex w-[80px] border rounded-xl focus:outline-none focus:border-indigo-300 pl-4 h-10"
                  />

                  <input
                    type="text"
                    onChange={(e) => {
                      setMessage(e.target.value);
                    }}
                    value={message}
                    placeholder="메시지를 입력하세요."
                    className="flex ml-2 w-full border rounded-xl focus:outline-none focus:border-indigo-300 pl-4 h-10"
                  />
                </div>
              </div>

              {/* 메시지 전송버튼 영역 */}
              <div className="ml-4">
                <button
                  type="submit"
                  className="flex h-[38x] items-center justify-center bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white px-4 py-1 flex-shrink-0"
                >
                  <span>Send</span>
                  <span className="ml-2">
                    <svg
                      className="w-4 h-4 transform rotate-45 -mt-px"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                    </svg>
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bot;
