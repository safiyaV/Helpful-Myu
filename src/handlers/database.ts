import { Collection, Document, Filter, FindOneAndUpdateOptions, MongoClient, WithId } from 'mongodb';
import { Client } from '../classes/Client';
import { Client as DjsClient, Snowflake } from 'discord.js';
import { Guild, Quote, User, UserProjectionOptions, UserSortOptions } from '../types/database.type.js';

const database = new MongoClient('mongodb://localhost:27017', { compressors: ['snappy', 'zlib'] }).db('HelpfulMyu');

export function getCollection(guild: Snowflake, type: 'config' | 'quote' | 'user') {
    const collection = database.collection(guild + `_${type}s`);
    if (!collection.collectionName) return false;
    return collection;
}

export function getCollections() {
    const collections = database.collections();
    return collections;
}

export async function createCollection(guild: Snowflake) {
    const collection = getCollection(guild, 'config') || (await database.createCollection(guild + '_configs'));
    await database.createCollection(guild + '_quotes');
    await database.createCollection(guild + '_users');
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
    const collection = getCollection(guild, 'config');
    if (!collection) return false;
    const document = await collection.findOneAndUpdate({ id: guild }, { $set: data });
    return document;
}

export async function getGuildInfo(guild: Snowflake) {
    const collection = getCollection(guild, 'config');
    if (!collection) return false;
    const document = await collection.findOne({ id: guild });
    return document;
}

export async function getQuote(guild: Snowflake, quoteID: string) {
    const collection = getCollection(guild, 'quote');
    if (!collection) return undefined;
    const document = (await collection.findOne({ id: quoteID })) || undefined;
    return document as WithId<Quote>;
}

export async function getQuotes(guild: Snowflake, quoteName: string) {
    const collection = getCollection(guild, 'quote');
    if (!collection) return [];
    const documents = collection.find({ name: quoteName });
    return (await documents.toArray()) as [WithId<Quote>];
}

export async function createQuote(guild: Snowflake, data: Quote) {
    const collection = getCollection(guild, 'quote');
    if (!collection) return false;
    const fetchedQuote = await getQuote(guild, data.id);
    if (!fetchedQuote || data.content !== fetchedQuote.content) {
        data.id = `${data.name}_${(await collection.countDocuments({ name: data.name })) + 1}`;
        const document = await collection.insertOne(data);
        return await collection.findOne({ _id: document.insertedId });
    }
    return fetchedQuote;
}

export async function editQuote(guild: Snowflake, quoteID: string, data: Quote) {
    const collection = getCollection(guild, 'quote');
    if (!collection) return false;
    const document = await collection.findOneAndUpdate({ id: quoteID }, { $set: data });
    return document;
}

export async function deleteQuote(guild: Snowflake, quoteID: string) {
    const collection = getCollection(guild, 'quote');
    if (!collection) return false;
    const document = await collection.findOneAndUpdate({ id: quoteID }, { $set: { deleted: true } });
    return document;
}

export async function restoreQuote(guild: Snowflake, quoteID: string) {
    const collection = getCollection(guild, 'quote');
    if (!collection) return false;
    const document = await collection.findOneAndUpdate({ id: quoteID }, { $set: { deleted: false } });
    return document;
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
    if (!collection) return false;
    const fetchedUser = await getUser(guild, data.id);
    if (!fetchedUser) {
        const document = await collection.insertOne(data);
        return document;
    }
    return fetchedUser;
}

export async function getUser(guild: Snowflake, user: User<false>['id']) {
    const collection = getCollection(guild, 'user');
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
    const collection = getCollection(guild, 'user');
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
    const collection = getCollection(guild, 'user');
    if (!collection) return false;
    const document = await collection.findOneAndUpdate({ id: user }, { $set: data }, options ?? {});
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
    const collection = getCollection(guild, 'user');
    if (!collection) return false;
    const deleteResult = await collection.deleteOne({ id: user });
    return deleteResult;
}

export async function messageCreate(client: Client | DjsClient, guild: Snowflake, user: User<false>['id']) {
    const fetchedUser = await getUser(guild, user);
    const guildUser = await client.users.fetch(user);

    if (!fetchedUser) {
        const users = await (getCollection(guild, 'user') as Collection).estimatedDocumentCount();
        createUser(guild, {
            id: user,
            username: guildUser.username,
            avatar: guildUser.avatarURL(),
        });
    } else {
        //do stuff
    }
}
