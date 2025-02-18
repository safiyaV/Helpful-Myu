import { getGuildInfo } from '../../handlers/database.js';
import { Command } from '../../classes/Command.js';

export default new Command({
    name: 'test',
    description: 'Runs a test command.',
    category: 'admin',
    dm_permission: false,
    options: [],
    async prefixCommand({ message, args, client }) {
        console.log('test', await client.isBotOwner(message.author));
        if (!(await client.isBotOwner(message.author))) return;
        console.log('test2');
        //This command exists to test functions, it will always contain nothing on github
        const member = await message.guild?.members.fetch(message.author);
        console.log(member);
        if (!member) return;
        const created = Math.round(member.user.createdTimestamp / 1_000);
        const joined = Math.round(Date.now() / 1_000);
        message.reply({
            embeds: [
                {
                    author: {
                        name: `${member.user.username} (${member.id}) Joined ♡`,
                        icon_url: member.displayAvatarURL(),
                    },
                    color: client.embedColor,
                    description: `♡ Created Account: <t:${created}:D> (<t:${created}:R>)\n♡ Joined: <t:${joined}> (<t:${joined}:R>)`,
                    thumbnail: { url: member.displayAvatarURL() },
                },
                {
                    author: {
                        name: `${member.user.username} (${member.id}) Left >~<`,
                        icon_url: member.displayAvatarURL(),
                    },
                    description: `♡ Created Account: <t:${created}:D> (<t:${created}:R>)\nLeft: <t:${joined}> (<t:${joined}:R>)`,
                    thumbnail: { url: member.displayAvatarURL() },
                    color: 0xff0000,
                },
            ],
        });
    },
});
