import { Message, Snowflake } from 'discord.js';
import { SortDirection } from 'mongodb';

export type If<Value extends boolean, TrueResult, FalseResult = null> = Value extends true ? TrueResult : Value extends false ? FalseResult : TrueResult | FalseResult;

export interface Role {
    id: string;
    name: string;
    color: string;
}

export interface BaseGuild {
    icon: string | null;
    name: string;
    excludedChannels: string[];
    adminRoles: Role[];
    prefix: string;
    modules: {
        admin: boolean;
        boost: boolean;
        join: boolean;
        leave: boolean;
        quote: boolean;
        message: boolean;
    };
    join: {
        logChannel: string;
        messageChannel: string;
        message: string;
        image: string;
    };
    leave: {
        logChannel: string;
        messageChannel: string;
        message: string;
        image: string;
    };
    boost: {
        logChannel: string;
        messageChannel: string;
        message: string;
        image: string;
    };
    message: {
        editLogChannel: string;
        deleteLogChannel: string;
    };
    stats: {
        messages: {
            count: number;
            history: { date: string; count: number }[];
        };
        voice: {
            time: number;
            history: { date: string; time: number }[];
        };
        files: {
            count: number;
            history: { date: string; images: number; gifs: number; videos: number; other: number }[];
        };
        users: {
            count: number;
            history: { date: string; joins: number; leaves: number; total: number }[];
        };
    };
}

export type Guild<Editable> = Editable extends false ? { id: Snowflake } & BaseGuild : Partial<BaseGuild>;

export interface databaseMessage {
    id: Snowflake;
    content: null | string;
    created: number;
    author: Snowflake;
    attachments: Message['attachments'];
}

export interface Quote {
    id: string;
    name: string;
    content: string;
    createdBy: string;
    createdAt: Date;
    deleted: boolean;
}

export interface BaseUser {
    username: string;
    avatar: string | null;
}

export type User<Editable> = Editable extends false ? { id: Snowflake } & BaseUser : Partial<BaseUser>;

export type UserSortOptions = {
    id?: SortDirection;
    username?: SortDirection;
    avatar?: SortDirection;
};

export type ProjectionOptions = boolean | 0 | 1;

export interface UserProjectionOptions {
    id?: ProjectionOptions;
    username?: ProjectionOptions;
    avatar?: ProjectionOptions;
}

export interface UserIncrementable {}

export interface ChannelStats {
    id: string;
    type: 'voice' | 'text';
    messages: {
        count: number;
        history: { date: string; count: number }[];
    };
    voice: {
        time: number;
        history: { date: string; time: number }[];
    };
    files: {
        count: number;
        history: { date: string; images: number; gifs: number; videos: number; other: number }[];
    };
}
