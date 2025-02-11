import { Collection, Document, Filter, FindOneAndUpdateOptions, MongoClient, WithId } from 'mongodb';
import { Client } from '../classes/Client';
import { Client as DjsClient, Snowflake } from 'discord.js';
import { Guild, User, UserProjectionOptions, UserSortOptions } from '../types/database.type.js';

const database = new MongoClient('mongodb://localhost:27017', { compressors: ['snappy', 'zlib'] }).db('DipLand');

export function getCollection(guild: Snowflake) {
    const collection = database.collection(guild);
    if (!collection.collectionName) return false;
    return collection;
}

export function getCollections() {
    const collections = database.collections();
    return collections;
}

export async function createCollection(guild: Snowflake) {
    const collection = getCollection(guild) || (await database.createCollection(guild));
    const client = (await import('../index.js')).client;
    if (client.isReady()) {
        const apiGuild = await client.guilds.fetch(guild);
        collection.findOneAndUpdate(
            { id: guild },
            {
                $set: {
                    id: guild,
                    name: apiGuild.name,
                    icon: apiGuild.iconURL(),
                    excludedChannels: [],
                    adminRoles: [],
                },
            },
            { upsert: true }
        );
    }
    return collection;
}

export async function editGuildInfo(guild: Snowflake, data: Guild<true>) {
    const collection = getCollection(guild);
    if (!collection) return false;
    const document = await collection.findOneAndUpdate({ id: guild }, { $set: data });
    return document;
}

export async function getGuildInfo(guild: Snowflake) {
    const collection = getCollection(guild);
    if (!collection) return false;
    const document = await collection.findOne({ id: guild });
    return document;
}

export async function getUserCountAll() {
    const collections = await getCollections();
    let count = 0;
    for (const collection of collections) {
        count += (await collection.countDocuments()) - 1;
    }
    return count;
}

export async function createUser(guild: Snowflake, data: User<false>) {
    const collection = getCollection(guild);
    if (!collection) return false;
    const fetchedUser = await getUser(guild, data.id);
    if (!fetchedUser) {
        const document = await collection.insertOne(data);
        return document;
    }
    return fetchedUser;
}

export async function getUser(guild: Snowflake, user: User<false>['id']) {
    const collection = getCollection(guild);
    if (!collection) return false;
    const document = await collection.findOne({ id: user });
    return document as WithId<User<false>> | null;
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
    const collection = getCollection(guild);
    if (!collection) return false;
    return (await collection
        .find(options?.filter ? options.filter : { avatar: { $exists: true } }, {
            limit: options?.limit,
            projection: options?.project,
            sort: options?.sort ? options.sort : { id: 1 },
        })
        .toArray()) as Array<WithId<User<false>>>;
}

export async function editUser(guild: Snowflake, user: User<false>['id'], data: User<true>, options?: FindOneAndUpdateOptions) {
    const collection = getCollection(guild);
    if (!collection) return false;
    const document = await collection.findOneAndUpdate({ id: user }, { $set: data }, options ?? {});
    return document;
}

async function editMessageHistory(guild: Snowflake, user: User<false>['id'], options?: FindOneAndUpdateOptions) {
    const date = new Date().toDateString();
    const collection = getCollection(guild);
    if (!collection) return false;
    const fetchedUser = await getUser(guild, user);
    if (!fetchedUser) return;
    if (fetchedUser.message.history.find((v: User<true>['message.history']) => v!.date === date)) {
        await collection.updateOne({ id: user, 'message.history.date': date }, { $inc: { 'message.history.$.count': 1 } });
    } else {
        await collection.updateOne({ id: user }, { $push: { 'message.history': { date, count: 1 } as any } });
    }
}

async function editVoiceHistory(guild: Snowflake, user: User<false>['id'], time: number, options?: FindOneAndUpdateOptions) {
    const date = new Date().toDateString();
    const collection = getCollection(guild);
    if (!collection) return false;
    const fetchedUser = await getUser(guild, user);
    if (!fetchedUser) return;
    if (fetchedUser.voice.history.find((v: User<true>['voice.history']) => v!.date === date)) {
        await collection.updateOne({ id: user, 'voice.history.date': date }, { $inc: { 'voice.history.$.time': time } });
    } else {
        await collection.updateOne({ id: user }, { $push: { 'voice.history': { date, time } as any } });
    }
}

export async function updateUser(
    guild: Snowflake,
    user: User<false>['id'],
    data: { voice?: { time?: number; join?: number | null; channel?: string | null }; total?: string; message?: number }
) {
    if (data.message) {
        await incrementUser(guild, user, { 'message.count': data.message, total: data.message });
        editMessageHistory(guild, user);
    }
    if (data.voice && data.voice.time) {
        await incrementUser(guild, user, { 'voice.time': data.voice.time, total: data.voice.time });
        await editVoiceHistory(guild, user, data.voice.time);
    }
    if (data.voice && (data.voice.join || data.voice.join === null)) {
        await editUser(guild, user, { 'voice.lastJoinDate': data.voice.join });
    }
    if (data.voice && (data.voice.channel || data.voice.channel === null)) {
        await editUser(guild, user, { 'voice.channelID': data.voice.channel });
    }
}

export async function incrementUser(guild: Snowflake, user: User<false>['id'], data: any, options?: FindOneAndUpdateOptions) {
    const collection = getCollection(guild);
    if (!collection) return false;
    const document = await collection.findOneAndUpdate({ id: user }, { $inc: data }, options ?? {});
    return document;
}

export async function editUserAll(user: User<false>['id'], data: User<true>, options?: FindOneAndUpdateOptions) {
    const collections = await getCollections();
    const documents: (WithId<Document> | null)[] = [];
    for (const collection of collections) {
        const document = await collection.findOneAndUpdate({ id: user }, { $set: data }, options ?? {});
        documents.push(document);
    }
    return documents;
}

export async function deleteUser(guild: Snowflake, user: User<false>['id']) {
    const collection = getCollection(guild);
    if (!collection) return false;
    const deleteResult = await collection.deleteOne({ id: user });
    return deleteResult;
}

export async function messageCreate(client: Client | DjsClient, guild: Snowflake, user: User<false>['id']) {
    const fetchedUser = await getUser(guild, user);
    const guildUser = await client.users.fetch(user);

    if (!fetchedUser) {
        const users = await (getCollection(guild) as Collection).estimatedDocumentCount();
        createUser(guild, {
            id: user,
            username: guildUser.username,
            avatar: guildUser.avatarURL(),
            role: {},
            voice: {
                channelID: null,
                lastJoinDate: null,
                time: 0,
                history: [],
                modifier: 1,
            },
            message: {
                count: 1,
                history: [],
                modifier: 1,
            },
            total: 1,
            positions: {
                total: users + 1,
                message: users + 1,
                voice: users + 1,
            },
            activities: {
                music: {
                    song: null,
                    artist: null,
                    startDate: null,
                    lastPlayed: null,
                    lastPlayedArtist: null,
                    lastPlayedTime: null,
                    history: [],
                    timeHistory: [],
                },
                game: {
                    title: null,
                    startDate: null,
                    lastPlayed: null,
                    lastPlayedTime: null,
                    history: [],
                    timeHistory: [],
                },
            },
        });
    } else {
        await updateUser(guild, user, { message: 1 });
        const total = await getAllGuildUsers(guild, { sort: { total: 'desc' } });
        const message = await getAllGuildUsers(guild, { sort: { 'message.count': 'desc' } });
        const voice = await getAllGuildUsers(guild, { sort: { 'voice.time': 'desc' } });
        const overallRank = total ? total.findIndex((v) => v.id === user) + 1 : -1;
        const messageRank = message ? message.findIndex((v) => v.id === user) + 1 : -1;
        const voiceRank = voice ? voice.findIndex((v) => v.id === user) + 1 : -1;
        await editUser(guild, user, { positions: { total: overallRank, message: messageRank, voice: voiceRank } });
    }
}
