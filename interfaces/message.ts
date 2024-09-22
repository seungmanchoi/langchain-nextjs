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
