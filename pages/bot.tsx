import { useEffect, useRef, useState } from 'react';
import { EUserType, IMemberMessage } from '@/interfaces/message';
import { remark } from 'remark';
import html from 'remark-html';

const Bot = () => {
  const [nickName] = useState<string>('You');
  const [message, setMessage] = useState<string>('');
  const [messageList, setMessageList] = useState<IMemberMessage[]>([
    {
      userType: EUserType.BOT,
      message: '안녕하세요. 무엇을 도와드릴까요?',
      sendDate: new Date(),
    },
  ]);
  const [apiUri, setApiUri] = useState<string>('/api/bot/pengdi-bot');
  const [isSelectOpen, setIsSelectOpen] = useState<boolean>(false);

  const messageEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const generateRandomString = (length: number) => {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };

  const [user, setUser] = useState<string>('');

  useEffect(() => {
    const storedUser =
      localStorage.getItem('userId') || generateRandomString(10);
    localStorage.setItem('userId', storedUser);
    setUser(storedUser);

    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    return () => window.removeEventListener('resize', setVH);
  }, []);

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
    if (!message.trim()) return;

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
        user,
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
    <div className="min-h-screen w-full bg-gray-50 flex justify-center">
      {/* 모바일 너비(360px)로 고정된 채팅창 */}
      <div className="w-[360px] bg-white flex flex-col h-[100vh] h-[calc(var(--vh,1vh)*100)] relative shadow-lg">
        {/* 헤더 */}
        <div
          className="flex items-center justify-between px-4 py-3 text-white"
          style={{ backgroundColor: '#2bb3c8' }}
        >
          <h1 className="text-lg font-semibold">안녕, 펭디</h1>
          <button
            onClick={() => setIsSelectOpen(!isSelectOpen)}
            className="text-white focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        </div>

        {/* 봇 선택 드롭다운 */}
        {isSelectOpen && (
          <div className="absolute right-4 top-14 z-10 bg-white rounded-lg shadow-lg">
            <select
              className="w-full p-2 text-gray-700 focus:outline-none"
              onChange={(e) => {
                setApiUri(e.target.value);
                setIsSelectOpen(false);
              }}
              value={apiUri}
            >
              <option value="/api/bot/pengdi-bot">펭디</option>
            </select>
          </div>
        )}

        {/* 메시지 목록 */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 py-2 bg-gray-50"
        >
          {messageList.map((message, index) => (
            <div
              key={index}
              className={`mb-4 ${
                message.userType === EUserType.BOT
                  ? 'flex'
                  : 'flex flex-row-reverse'
              }`}
            >
              {message.userType === EUserType.BOT ? (
                <>
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      src="/images/bot-avatar.png"
                      alt="Bot"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div
                    className="ml-2 bg-white rounded-2xl px-4 py-2 max-w-[80%] shadow-sm"
                    dangerouslySetInnerHTML={{
                      __html: message.message,
                    }}
                  />
                </>
              ) : (
                <div
                  className="text-white rounded-2xl px-4 py-2 max-w-[80%] shadow-sm"
                  style={{ backgroundColor: '#2bb3c8' }}
                >
                  {message.message}
                </div>
              )}
            </div>
          ))}
          <div ref={messageEndRef} />
        </div>

        {/* 메시지 입력 폼 */}
        <form
          onSubmit={sendMessage}
          className="p-4 bg-white border-t border-gray-100"
        >
          <div className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="메시지를 입력하세요"
              className="flex-1 border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:border-[#2bb3c8]"
            />
            <button
              type="submit"
              className="text-white rounded-full p-2 w-12 h-12 flex items-center justify-center flex-shrink-0 transition-colors hover:opacity-90"
              style={{ backgroundColor: '#2bb3c8' }}
            >
              <svg
                className="w-6 h-6 transform rotate-45"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Bot;
