import { ActivityType, Partials } from 'discord.js';
import { Client } from './classes/Client.js';
import 'dotenv/config';
import { editUser, getAllUsers, getCollection, getGuildInfo, getUser, getUserCountAll, updateUser } from './handlers/database.js';

export const version = '0.0.1';

//Bot
export const client = new Client({
    name: 'Helpful Myu',
    color: '\x1b[38;2;209;161;137m',
    embedColor: 0xd1a189,
    intents: ['Guilds', 'GuildMessages', 'MessageContent', 'GuildMembers', 'GuildVoiceStates', 'GuildPresences'],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User],
});

client.once('ready', async () => {
    client.log(`Online`);
    await client.registerEvents();
    //await client.registerCommands(['global', '1182260148501225552']);
    await client.registerCommands(['global']);

    client.user?.setPresence({ activities: [{ name: `Version ${version}`, type: ActivityType.Custom }], status: 'online' });
    setInterval(async () => {
        const activities = [`Being cute while watching ${await getUserCountAll()} users`, `Version ${version}`];
        client.user?.setPresence({ activities: [{ name: activities[Math.floor(Math.random() * activities.length)], type: ActivityType.Custom }], status: 'online' });
    }, 5 * 1000 * 60);
});

client.login(process.env.TOKEN);
