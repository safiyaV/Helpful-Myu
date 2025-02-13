import { ActivityType, Partials } from 'discord.js';
import { Client } from './classes/Client.js';
import 'dotenv/config';
import { createCollection, createUser, getUserCountAll } from './handlers/database.js';

export const version = '0.0.2';

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
    await client.registerCommands(['981639333549322262']);

    // client.guilds.fetch().then((guilds) => {
    //     let guild, member;
    //     for (guild of guilds) {
    //         guild = guild[1];
    //         createCollection(guild.id);
    //         guild.fetch().then((guild) => {
    //             guild.members.fetch().then((members) => {
    //                 for (member of members) {
    //                     member = member[1];
    //                     createUser(guild.id, {
    //                         id: member.id,
    //                         username: member.user.username,
    //                         avatar: member.avatarURL(),
    //                     });
    //                 }
    //             });
    //         });
    //     }
    // });

    let count = 0;
    setInterval(async () => {
        const activities = [
            { name: `Watching ${await getUserCountAll()} users`, type: ActivityType.Custom },
            { name: `Version ${version}`, type: ActivityType.Custom },
        ];
        const selectedActivity = activities[count];
        client.user?.setPresence({ activities: [selectedActivity], status: 'online' });
        activities.length - 1 === count ? (count = 0) : (count = count + 1);
    }, 30_000);
});

client.login(process.env.TOKEN);
