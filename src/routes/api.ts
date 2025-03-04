import { FastifyInstance } from 'fastify';
import { client } from '../index.js';
import { getGuildInfo, getQuote, getQuotes, getUser } from '../handlers/database.js';

async function routes(fastify: FastifyInstance) {
    fastify.all('/guild/target', async (req, reply) => {
        reply.send({ id: process.env.TARGET });
    });
    fastify.all('/guild/:id/quotes', async (req, reply) => {
        const guildId = (req.params as { id: string }).id;
        const query = req.query as { search?: string };
        const search = query.search || '';
        let quotes = [await getQuote(guildId, search)];
        if (!quotes[0]) quotes = await getQuotes(guildId, search);
        reply.send(quotes);
    });
    fastify.all('/guild/:id/user/:userId', async (req, reply) => {
        const { id, userId } = req.params as { id: string; userId: string };
        const user = await getUser(id, userId);
        if (!user) reply.code(204).send();
        reply.send(user);
    });
    fastify.all('/guild/:id', async (req, reply) => {
        const guildId = (req.params as { id: string }).id;
        const guild = await client.guilds.fetch(guildId);
        const guildInfo = await getGuildInfo(guildId);
        if (!guild) reply.code(204).send();
        const channels = (await guild.channels.fetch()).toJSON();
        const newGuild = {
            id: guild.id,
            name: guild.name,
            channels: {
                GUILD_TEXT: channels.filter((channel) => channel?.type === 0),
                GUILD_VOICE: channels.filter((channel) => channel?.type === 2),
                GUILD_CATEGORY: channels.filter((channel) => channel?.type === 4),
                GUILD_ANNOUNCEMENT: channels.filter((channel) => channel?.type === 5),
            },
            info: guildInfo,
            bot: await guild.members.fetchMe(),
            roles: (await guild.roles.fetch()).toJSON().map((role) => {
                return { name: role.name, id: role.id };
            }),
            members: (await guild.members.fetch()).toJSON(),
        };
        reply.send(newGuild);
    });
}

export default routes;
