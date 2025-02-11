import { Snowflake } from 'discord.js';
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
}

export type Guild<Editable> = Editable extends false ? { id: Snowflake } & BaseGuild : Partial<BaseGuild>;

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
