import { Document, Filter, FindOneAndUpdateOptions, MongoClient, WithId } from 'mongodb';
import { Client as DjsClient, Message, Snowflake } from 'discord.js';
import { BaseGuild, ChannelStats, databaseMessage, Guild, Quote, User, UserProjectionOptions, UserSortOptions } from '../types/database.type.js';
import mime from 'mime-types';

const database = new MongoClient('mongodb://localhost:27017', { compressors: ['snappy', 'zlib'] }).db('HelpfulMyu');

export function getCollection(guild: Snowflake, type: 'config' | 'quote' | 'user' | 'message' | 'stat') {
    let collection = database.collection(guild + `_${type}s`);
    if (!collection.collectionName) return undefined;
    return collection;
}

export function getCollections() {
    const collections = database.collections();
    return collections;
}

export async function createCollection(guild: Snowflake) {
    let configs = getCollection(guild, 'config');
    if (configs) return configs;
    configs = await database.createCollection(guild + '_configs');
    await database.createCollection(guild + '_quotes');
    await database.createCollection(guild + '_users');
    await database.createCollection(guild + '_messages');
    await database.createCollection(guild + '_stats');
    const client = (await import('../index.js')).client;
    if (client.isReady()) {
        const apiGuild = await client.guilds.fetch(guild);
        configs.findOneAndUpdate(
            { id: guild },
            {
                $set: {
                    id: guild,
                    name: apiGuild.name,
                    icon: apiGuild.iconURL(),
                    excludedChannels: [],
                    adminRoles: [],
                    prefix: '=',
                    modules: {
                        boost: true,
                        join: true,
                        leave: true,
                        quote: true,
                        message: true,
                    },
                    join: {
                        logChannel: '',
                        messageChannel: '',
                        message: '',
                        image: '',
                    },
                    leave: {
                        logChannel: '',
                        messageChannel: '',
                        message: '',
                        image: '',
                    },
                    boost: {
                        logChannel: '',
                        messageChannel: '',
                        message: '',
                        image: '',
                    },
                    message: {
                        editLogChannel: '',
                        deleteLogChannel: '',
                    },
                    stats: {
                        messages: {
                            count: 0,
                            history: [],
                        },
                        voice: {
                            time: 0,
                            history: [],
                        },
                        files: {
                            count: 0,
                            history: [],
                        },
                        users: {
                            count: 0,
                            history: [],
                        },
                    },
                },
            },
            { upsert: true, projection: { _id: 0 } }
        );
    }
    return configs;
}

export async function editGuildInfo(guild: Snowflake, data: Guild<true>) {
    const collection = getCollection(guild, 'config');
    if (!collection) return undefined;
    const document = await collection.findOneAndUpdate({ id: guild }, { $set: data }, { projection: { _id: 0 } });
    return (document as WithId<Guild<false>>) || undefined;
}

export async function getGuildInfo(guild: Snowflake) {
    const collection = getCollection(guild, 'config');
    if (!collection) return undefined;
    const document = await collection.findOne({ id: guild }, { projection: { _id: 0 } });
    return (document as WithId<Guild<false>>) || undefined;
}

export async function getQuote(guild: Snowflake, quoteID: string) {
    const collection = getCollection(guild, 'quote');
    if (!collection) return undefined;
    const document = await collection.findOne({ id: quoteID }, { projection: { _id: 0 } });
    return (document as WithId<Quote>) || undefined;
}

export async function getQuotes(guild: Snowflake, quoteName: string) {
    const collection = getCollection(guild, 'quote');
    if (!collection) return [];
    const documents = collection.find(!quoteName ? {} : { name: quoteName }, { projection: { _id: 0 } });
    return (await documents.toArray()) as [WithId<Quote>];
}

export async function createQuote(guild: Snowflake, data: Quote) {
    const collection = getCollection(guild, 'quote');
    if (!collection) return undefined;
    const fetchedQuote = await getQuote(guild, data.id);
    if (!fetchedQuote || data.content !== fetchedQuote.content) {
        data.id = `${data.name}_${(await collection.countDocuments({ name: data.name })) + 1}`;
        const document = await collection.insertOne(data);
        return ((await collection.findOne({ _id: document.insertedId }, { projection: { _id: 0 } })) as WithId<Quote>) || undefined;
    }
    return fetchedQuote || undefined;
}

export async function editQuote(guild: Snowflake, quoteID: string, data: Quote) {
    const collection = getCollection(guild, 'quote');
    if (!collection) return undefined;
    const document = await collection.findOneAndUpdate({ id: quoteID }, { $set: data }, { projection: { _id: 0 } });
    return (document as WithId<Quote>) || undefined;
}

export async function deleteQuote(guild: Snowflake, quoteID: string) {
    const collection = getCollection(guild, 'quote');
    if (!collection) return undefined;
    const document = await collection.findOneAndUpdate({ id: quoteID }, { $set: { deleted: true } }, { projection: { _id: 0 } });
    return (document as WithId<Quote>) || undefined;
}

export async function restoreQuote(guild: Snowflake, quoteID: string) {
    const collection = getCollection(guild, 'quote');
    if (!collection) return undefined;
    const document = await collection.findOneAndUpdate({ id: quoteID }, { $set: { deleted: false } }, { projection: { _id: 0 } });
    return (document as WithId<Quote>) || undefined;
}

export async function getUserCountAll() {
    const collections = await getCollections();
    let count = 0;
    for (const collection of collections) {
        if (!collection.collectionName.includes('_users')) continue;
        count += await collection.countDocuments();
    }
    return count;
}

export async function createUser(guild: Snowflake, data: User<false>) {
    const collection = getCollection(guild, 'user');
    if (!collection) return undefined;
    const fetchedUser = await getUser(guild, data.id);
    if (!fetchedUser) {
        const document = await collection.insertOne(data);
        return ((await collection.findOne({ _id: document.insertedId }, { projection: { _id: 0 } })) as WithId<User<false>>) || undefined;
    }
    return fetchedUser;
}

export async function getUser(guild: Snowflake, user: User<false>['id']) {
    const collection = getCollection(guild, 'user');
    if (!collection) return undefined;
    const document = await collection.findOne({ id: user }, { projection: { _id: 0 } });
    return (document as WithId<User<false>>) || undefined;
}

export async function getAllUsers(options?: { filter?: Filter<Document>; sort?: UserSortOptions; project?: UserProjectionOptions; limit?: number }) {
    const collections = getCollections();
    const documents = [];
    for (const collection of await collections) {
        const users = await collection
            .find(options?.filter ? options.filter : { avatar: { $exists: true } }, {
                limit: options?.limit,
                projection: options?.project,
                sort: options?.sort ? options.sort : { id: 1 },
            })
            .toArray();
        for (const user of users) {
            let newUser = user;
            newUser.guild = collection.collectionName;
            documents.push(newUser);
        }
    }
    return documents as Array<WithId<User<false>>>;
}

export async function getAllGuildUsers(guild: Snowflake, options?: { filter?: Filter<Document>; sort?: UserSortOptions; project?: UserProjectionOptions; limit?: number }) {
    const collection = getCollection(guild, 'user');
    if (!collection) return [];
    return (await collection
        .find(options?.filter ? options.filter : { avatar: { $exists: true } }, {
            limit: options?.limit,
            projection: options?.project,
            sort: options?.sort ? options.sort : { id: 1 },
        })
        .toArray()) as Array<WithId<User<false>>>;
}

export async function editUser(guild: Snowflake, user: User<false>['id'], data: User<true>, options?: FindOneAndUpdateOptions) {
    const collection = getCollection(guild, 'user');
    if (!collection) return undefined;
    const document = await collection.findOneAndUpdate({ id: user }, { $set: data }, options ?? {});
    return (document as WithId<User<false>>) || undefined;
}

export async function editUserAll(user: User<false>['id'], data: User<true>, options?: FindOneAndUpdateOptions) {
    const collections = await getCollections();
    const documents = [];
    for (const collection of collections) {
        const document = await collection.findOneAndUpdate({ id: user }, { $set: data }, options ?? {});
        if (document) documents.push(document as WithId<User<false>>);
    }
    return documents;
}

export async function deleteUser(guild: Snowflake, user: User<false>['id']) {
    const collection = getCollection(guild, 'user');
    if (!collection) return false;
    const deleteResult = await collection.deleteOne({ id: user });
    return deleteResult;
}

export async function messageCreate(message: Message<boolean>) {
    if (!message.guild) return;
    await editServerStats(message.guild.id, 'message');
    await editChannelStats(message.guild.id, message.channelId, 'message', { channel: message.channel.type });
    const fetchedUser = await getUser(message.guild.id, message.author.id);
    const guildUser = await message.guild.members.fetch({ user: message.author.id, force: true });
    const urls = message.content.split(' ').filter((v) => v.includes('http'));
    for (const [, attachment] of message.attachments) {
        urls.push(attachment.proxyURL);
    }
    for (const url of urls) {
        try {
            const parsed = new URL(url);
            switch (parsed.host) {
                case 'media.discordapp.net':
                    {
                        const mimeType = mime.lookup(parsed.pathname) + '';
                        if (mimeType.includes('image')) {
                            if (mimeType.endsWith('gif')) {
                                await editServerStats(message.guild.id, 'file', { file: { type: 'gif' } });
                                await editChannelStats(message.guild.id, message.channelId, 'file', { file: { type: 'gif' }, channel: message.channel.type });
                            } else {
                                await editServerStats(message.guild.id, 'file', { file: { type: 'image' } });
                                await editChannelStats(message.guild.id, message.channelId, 'file', { file: { type: 'image' }, channel: message.channel.type });
                            }
                        } else {
                            if (mimeType.endsWith('mp4') || mimeType.endsWith('webm') || mimeType.endsWith('mov') || mimeType.endsWith('mkv')) {
                                await editServerStats(message.guild.id, 'file', { file: { type: 'video' } });
                                await editChannelStats(message.guild.id, message.channelId, 'file', { file: { type: 'video' }, channel: message.channel.type });
                            } else {
                                await editServerStats(message.guild.id, 'file', { file: { type: 'other' } });
                                await editChannelStats(message.guild.id, message.channelId, 'file', { file: { type: 'other' }, channel: message.channel.type });
                            }
                        }
                    }
                    break;
                case 'tenor.com':
                    {
                        await editServerStats(message.guild.id, 'file', { file: { type: 'gif' } });
                        await editChannelStats(message.guild.id, message.channelId, 'file', { file: { type: 'gif' }, channel: message.channel.type });
                    }
                    break;
                default:
                    {
                        console.log(url);
                        await editServerStats(message.guild.id, 'file', { file: { type: 'other' } });
                        await editChannelStats(message.guild.id, message.channelId, 'file', { file: { type: 'other' }, channel: message.channel.type });
                    }
                    break;
            }
        } catch (error) {}
    }

    if (!fetchedUser) {
        //const users = await (getCollection(guild, 'user') as Collection).estimatedDocumentCount();
        createUser(message.guild.id, {
            id: message.author.id,
            username: guildUser.user.username,
            avatar: guildUser.avatarURL(),
        });
    } else {
        //do stuff
    }
}

async function editServerStats(
    guild: string,
    type: 'message' | 'voice' | 'file' | 'user',
    data?: { file?: { type: 'image' | 'gif' | 'video' | 'other' }; user?: { type: 'join' | 'leave' } }
) {
    const date = new Date().toDateString();
    const collection = getCollection(guild, 'config');
    if (!collection) return false;
    const guildInfo = await getGuildInfo(guild);
    if (!guildInfo) return false;
    switch (type) {
        case 'message':
            {
                if (guildInfo.stats.messages.history.find((v: BaseGuild['stats']['messages']['history'][0]) => v.date === date)) {
                    await collection.updateOne({ id: guild, 'stats.messages.history.date': date }, { $inc: { 'stats.messages.history.$.count': 1 } });
                } else {
                    await collection.updateOne({ id: guild }, { $push: { 'stats.messages.history': { date, count: 1 } as any } });
                }
                await collection.updateOne({ id: guild }, { $inc: { 'stats.messages.count': 1 } });
            }
            break;
        case 'voice':
            {
                if (guildInfo.stats.voice.history.find((v: BaseGuild['stats']['voice']['history'][0]) => v.date === date)) {
                    await collection.updateOne({ id: guild, 'stats.voice.history.date': date }, { $inc: { 'stats.voice.history.$.time': 1 } });
                } else {
                    await collection.updateOne({ id: guild }, { $push: { 'stats.voice.history': { date, time: 1 } as any } });
                }
                await collection.updateOne({ id: guild }, { $inc: { 'stats.voice.time': 1 } });
            }
            break;
        case 'file':
            {
                const type = data?.file?.type as 'image' | 'gif' | 'video' | 'other';
                if (guildInfo.stats.files.history.find((v: BaseGuild['stats']['files']['history'][0]) => v.date === date)) {
                    switch (type) {
                        case 'image':
                            await collection.updateOne({ id: guild, 'stats.files.history.date': date }, { $inc: { 'stats.files.history.$.images': 1 } });
                            break;
                        case 'gif':
                            await collection.updateOne({ id: guild, 'stats.files.history.date': date }, { $inc: { 'stats.files.history.$.gifs': 1 } });
                            break;
                        case 'video':
                            await collection.updateOne({ id: guild, 'stats.files.history.date': date }, { $inc: { 'stats.files.history.$.videos': 1 } });
                            break;
                        case 'other':
                            await collection.updateOne({ id: guild, 'stats.files.history.date': date }, { $inc: { 'stats.files.history.$.other': 1 } });
                            break;
                    }
                } else {
                    switch (type) {
                        case 'image':
                            await collection.updateOne({ id: guild }, { $push: { 'stats.files.history': { date, images: 1 } as any } });
                            break;
                        case 'gif':
                            await collection.updateOne({ id: guild }, { $push: { 'stats.files.history': { date, gifs: 1 } as any } });
                            break;
                        case 'video':
                            await collection.updateOne({ id: guild }, { $push: { 'stats.files.history': { date, videos: 1 } as any } });
                            break;
                        case 'other':
                            await collection.updateOne({ id: guild }, { $push: { 'stats.files.history': { date, other: 1 } as any } });
                            break;
                    }
                }
                await collection.updateOne({ id: guild }, { $inc: { 'stats.files.count': 1 } });
            }
            break;
        case 'user':
            {
                const type = data?.user?.type as 'join' | 'leave';
                const total = (await getAllGuildUsers(guild)).length;
                if (guildInfo.stats.users.history.find((v: BaseGuild['stats']['users']['history'][0]) => v.date === date)) {
                    if (type === 'join') {
                        await collection.updateOne(
                            { id: guild, 'stats.users.history.date': date },
                            { $inc: { 'stats.users.count': 1, 'stats.users.history.$.joins': 1, 'stats.users.history.$.total': 1 } }
                        );
                    } else {
                        await collection.updateOne(
                            { id: guild, 'stats.users.history.date': date },
                            { $inc: { 'stats.users.count': -1, 'stats.users.history.$.joins': -1, 'stats.users.history.$.total': -1 } }
                        );
                    }
                } else {
                    if (type === 'join') {
                        await collection.updateOne({ id: guild }, { $push: { 'stats.users.history': { date, joins: 1, leaves: 0, total: 1 } as any } });
                    } else {
                        await collection.updateOne({ id: guild }, { $push: { 'stats.users.history': { date, joins: 0, leaves: 1, total: -1 } as any } });
                    }
                }
                await collection.updateOne({ id: guild }, { $set: { 'stats.users.count': total } });
            }
            break;
    }
}

async function editChannelStats(
    guild: string,
    channel: string,
    type: 'message' | 'voice' | 'file',
    data: { file?: { type: 'image' | 'gif' | 'video' | 'other' }; channel: number }
) {
    const date = new Date().toDateString();
    const collection = getCollection(guild, 'stat');
    if (!collection) return false;
    let channelInfo = (await collection.findOne({ id: channel })) as WithId<ChannelStats> | null;
    if (!channelInfo) {
        await collection.insertOne({
            id: channel,
            type: data.channel === 2 || data.channel === 13 ? 'voice' : 'text',
            messages: {
                count: 0,
                history: [],
            },
            voice: {
                time: 0,
                history: [],
            },
            files: {
                count: 0,
                history: [],
            },
        });
        channelInfo = (await collection.findOne({ id: channel })) as WithId<ChannelStats>;
    }
    switch (type) {
        case 'message':
            {
                if (channelInfo.messages.history.find((v: ChannelStats['messages']['history'][0]) => v.date === date)) {
                    await collection.updateOne({ id: channel, 'messages.history.date': date }, { $inc: { 'messages.history.$.count': 1 } });
                } else {
                    await collection.updateOne({ id: channel }, { $push: { 'messages.history': { date, count: 1 } as any } });
                }
                await collection.updateOne({ id: channel }, { $inc: { 'messages.count': 1 } });
            }
            break;
        case 'voice':
            {
                if (channelInfo.voice.history.find((v: ChannelStats['voice']['history'][0]) => v.date === date)) {
                    await collection.updateOne({ id: channel, 'voice.history.date': date }, { $inc: { 'voice.history.$.time': 1 } });
                } else {
                    await collection.updateOne({ id: channel }, { $push: { 'voice.history': { date, time: 1 } as any } });
                }
                await collection.updateOne({ id: channel }, { $inc: { 'voice.time': 1 } });
            }
            break;
        case 'file':
            {
                const type = data?.file?.type as 'image' | 'gif' | 'video' | 'other';
                if (channelInfo.files.history.find((v: ChannelStats['files']['history'][0]) => v.date === date)) {
                    switch (type) {
                        case 'image':
                            await collection.updateOne({ id: channel, 'files.history.date': date }, { $inc: { 'files.history.$.images': 1 } });
                            break;
                        case 'gif':
                            await collection.updateOne({ id: channel, 'files.history.date': date }, { $inc: { 'files.history.$.gifs': 1 } });
                            break;
                        case 'video':
                            await collection.updateOne({ id: channel, 'files.history.date': date }, { $inc: { 'files.history.$.videos': 1 } });
                            break;
                        case 'other':
                            await collection.updateOne({ id: channel, 'files.history.date': date }, { $inc: { 'files.history.$.other': 1 } });
                            break;
                    }
                } else {
                    switch (type) {
                        case 'image':
                            await collection.updateOne({ id: channel }, { $push: { 'files.history': { date, images: 1 } as any } });
                            break;
                        case 'gif':
                            await collection.updateOne({ id: channel }, { $push: { 'files.history': { date, gifs: 1 } as any } });
                            break;
                        case 'video':
                            await collection.updateOne({ id: channel }, { $push: { 'files.history': { date, videos: 1 } as any } });
                            break;
                        case 'other':
                            await collection.updateOne({ id: channel }, { $push: { 'files.history': { date, other: 1 } as any } });
                            break;
                    }
                }
                await collection.updateOne({ id: channel }, { $inc: { 'files.count': 1 } });
            }
            break;
    }
}
