import { getGuildInfo } from '../../handlers/database.js';
import { Command } from '../../classes/Command.js';

export default new Command({
    name: 'test',
    description: 'Runs a test command.',
    category: 'admin',
    disabled: true,
    dm_permission: false,
    options: [],
    async prefixCommand({ message, args, client }) {
        //This command exists to test functions, it will always contain nothing on github
        const member = await message.guild?.members.fetch(message.author);
        if (!member) return;
        const created = Math.round(member.user.createdTimestamp / 1_000);
        const joined = Math.round(Date.now() / 1_000);
        message.reply({
            embeds: [
                {
                    author: {
                        name: `${member.user.username} Joined ♡`,
                        icon_url: member.displayAvatarURL(),
                    },
                    color: client.embedColor,
                    description: `<@${member.id}>\n♡ ID: ${member.id}\n♡ Account Created: <t:${created}:D> (<t:${created}:R>)\n♡ Joined: <t:${joined}> (<t:${joined}:R>)`,
                    thumbnail: { url: member.displayAvatarURL({ size: 1024 }) },
                },
                {
                    author: {
                        name: `${member.user.username} Left >~<`,
                        icon_url: member.displayAvatarURL(),
                    },
                    description: `<@${member.id}>\n♡ ID: ${member.id}\n♡ Account Created: <t:${created}:D> (<t:${created}:R>)\n♡ Left: <t:${joined}> (<t:${joined}:R>)`,
                    thumbnail: { url: member.displayAvatarURL({ size: 1024 }) },
                    color: 0xff0000,
                },
            ],
        });
    },
});
