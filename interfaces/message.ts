export interface IMessage {
  userType: EUserType;
  message: string;
  sendDate: Date;
}

export enum EUserType {
  USER = 'user',
  BOT = 'bot',
}

export interface IMemberMessage extends IMessage {
  nickName?: string;
}

// 백엔드에서 프론트엔드로 전달할 결과 데이터 정의하기
export type ResponseData = {
  code: number;
  data: IMemberMessage | null;
  msg: string;
};
