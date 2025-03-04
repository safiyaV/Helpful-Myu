import { ActivityType, Partials } from 'discord.js';
import { Client } from './classes/Client.js';
import { createCollection, createUser, getUserCountAll } from './handlers/database.js';
import Fastify from 'fastify';
import Logger from './classes/logger.js';
import { init } from './handlers/database_hidden.js';

const version = '0.4.0';

//Bot
export const client = new Client({
    intents: ['Guilds', 'GuildMessages', 'MessageContent', 'GuildMembers', 'GuildVoiceStates', 'GuildPresences'],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User],
});

const logger = new Logger('Web Server', '212;47;151');
const fastify = Fastify({ logger: { level: 'error' }, ignoreTrailingSlash: true });

client.once('ready', async () => {
    client.log(`Online`);
    await client.registerEvents();
    if (process.env.NODE_ENV === 'Development') await client.registerCommands(['981639333549322262']);
    fastify.register((await import('./routes/index.js')).default).then(() => startFastify());
    //init();

    // client.guilds.fetch('632717913169854495').then((g) => {
    //     g.channels.fetch('632717914134413324').then(async (c) => {
    //         if (!c || !c.isTextBased()) return;
    //         //1343030660432007179
    //         console.log(await c.messages.fetch('1338783099986903051'));
    //         console.log(await c.messages.fetch('1343030660432007179'));
    //     });
    // });

    client.guilds.fetch().then((guilds) => {
        guilds.map((guild) => {
            //createCollection(guild.id);
            guild.fetch().then(async (guild) => {
                guild.members.fetch().then((members) => {
                    members.map((member) => {
                        if (!member.user.bot)
                            createUser(guild.id, {
                                id: member.id,
                                username: member.user.username,
                                avatar: member.avatarURL(),
                            });
                    });
                });
            });
        });
    });

    let count = 0;
    setInterval(async () => {
        const activities = [
            { name: `Watching ${(await getUserCountAll()) - 2} users`, type: ActivityType.Custom },
            { name: `Version ${version}`, type: ActivityType.Custom },
        ];
        const selectedActivity = activities[count];
        client.user?.setPresence({ activities: [selectedActivity], status: 'online' });
        activities.length - 1 === count ? (count = 0) : (count = count + 1);
    }, 30_000);
});

client.login(process.env.TOKEN);

async function startFastify() {
    try {
        await fastify.listen({ port: +process.env.WEB_PORT });
        logger.log(`Port ${process.env.WEB_PORT} open.`);
    } catch (err) {
        logger.log(err);
    }
}
