import { useEffect, useRef, useState } from 'react';
import { EUserType, IMemberMessage } from '@/interfaces/message';
import dayjs from 'dayjs';
import { remark } from 'remark';
import html from 'remark-html';

const Bot = () => {
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

  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  }, [messageList]);

  const convertMarkdownToHtml = async (markdown: string) => {
    const result = await remark().use(html).process(markdown);
    return result.toString();
  };

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
      const htmlMessage = await convertMarkdownToHtml(result.data.message);
      setMessageList((prev) => [
        ...prev,
        { ...result.data, message: htmlMessage },
      ]);
    }
  };

  return (
    <div className="flex h-screen antialiased text-gray-800">
      <div className="flex flex-col h-full w-full">
        <div className="flex flex-col flex-auto h-full p-2 sm:p-6">
          <div className="flex flex-col flex-auto flex-shrink-0 rounded-2xl bg-gray-100 h-full">
            {/* 메시지 목록 출력영역 */}
            <div className="flex flex-col h-full overflow-y-auto mb-4 p-4">
              <div className="flex flex-col h-full">
                <div className="grid grid-cols-12 gap-y-2">
                  {messageList.map((message, index) => {
                    if (message.userType === EUserType.BOT) {
                      return (
                        <div
                          key={index}
                          className="col-start-1 col-end-13 sm:col-end-9 p-3 rounded-lg"
                        >
                          <div className="flex flex-row items-start">
                            {/* Bot 이미지 부분 */}
                            <div className="flex items-center justify-center h-10 w-10 rounded-full flex-shrink-0">
                              <img
                                src="/images/bot-avatar.png"
                                alt="Bot"
                                className="h-10 w-10 rounded-full"
                              />
                            </div>
                            <div
                              className="relative ml-3 text-sm bg-white py-2 px-4 shadow rounded-xl"
                              dangerouslySetInnerHTML={{
                                __html: message.message,
                              }}
                            />
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={index}
                          className="col-start-1 sm:col-start-5 col-end-13 p-3 rounded-lg"
                        >
                          <div className="flex items-center justify-start flex-row-reverse">
                            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 flex-shrink-0 text-white">
                              {message.nickName}
                            </div>
                            <div className="relative mr-3 text-sm bg-indigo-100 py-2 px-4 shadow rounded-xl">
                              <div>{message.message}</div>
                              {/*<div className="absolute text-xs bottom-0 right-0 -mb-5 mr-2 text-gray-500">*/}
                              {/*  <span>*/}
                              {/*    {dayjs(message.sendDate).format(*/}
                              {/*      'YYYY-MM-DD HH:mm:ss',*/}
                              {/*    )}*/}
                              {/*  </span>*/}
                              {/*</div>*/}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                  {/* 스크롤을 맞출 요소 */}
                  <div ref={messageEndRef} />
                </div>
              </div>
            </div>

            {/* 메시지 입력 및 보내기 영역 */}
            <form
              onSubmit={sendMessage}
              className="flex flex-col sm:flex-row items-center bg-white rounded-xl p-4 space-y-4 sm:space-y-0"
            >
              <div className="w-full sm:w-auto mb-4 sm:mb-0">
                <select
                  className="w-full sm:w-auto border rounded-xl focus:outline-none focus:border-indigo-300 pl-2 h-10"
                  onChange={(e) => {
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

              <div className="flex-grow w-full sm:ml-4">
                <div className="flex flex-col sm:flex-row w-full space-y-4 sm:space-y-0 sm:space-x-2">
                  <input
                    type="text"
                    value={nickName}
                    onChange={(e) => setNickName(e.target.value)}
                    placeholder="닉네임"
                    className="flex w-full sm:w-[80px] border rounded-xl focus:outline-none focus:border-indigo-300 pl-4 h-10"
                  />

                  <input
                    type="text"
                    onChange={(e) => {
                      setMessage(e.target.value);
                    }}
                    value={message}
                    placeholder="메시지를 입력하세요."
                    className="flex w-full border rounded-xl focus:outline-none focus:border-indigo-300 pl-4 h-10"
                  />
                </div>
              </div>

              <div className="w-full sm:w-auto sm:ml-4 mt-4 sm:mt-0">
                <button
                  type="submit"
                  className="w-full sm:w-auto flex h-10 items-center justify-center bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white px-4 py-1 flex-shrink-0"
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
