import { ActivityType, Partials } from 'discord.js';
import { Client } from './classes/Client.js';
import 'dotenv/config';
import { createCollection, getUserCountAll } from './handlers/database.js';

export const version = '0.0.1';

//Bot
export const client = new Client({
    name: 'Helpful Myu',
    color: '\x1b[38;2;175;187;234m',
    embedColor: 0xafbbea,
    intents: ['Guilds', 'GuildMessages', 'MessageContent', 'GuildMembers', 'GuildVoiceStates', 'GuildPresences'],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User],
});

client.once('ready', async () => {
    client.log(`Online`);
    await client.registerEvents();
    //await client.registerCommands(['global', '1182260148501225552']);
    await client.registerCommands(['global']);

    client.guilds.fetch().then((guilds) => {
        let guild;
        for (guild of guilds) {
            guild = guild[1];
            createCollection(guild.id);
        }
    });

    client.user?.setPresence({ activities: [{ name: `Being cute while watching ${await getUserCountAll()} users`, type: ActivityType.Custom }], status: 'online' });
    setInterval(async () => {
        const activities = [`Being cute while watching ${await getUserCountAll()} users`, `Version ${version}`];
        client.user?.setPresence({ activities: [{ name: activities[Math.floor(Math.random() * activities.length)], type: ActivityType.Custom }], status: 'online' });
    }, 5 * 1000 * 60);
});

client.login(process.env.TOKEN);
