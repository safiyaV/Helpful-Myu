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
                        name: member.user.username,
                        icon_url: member.displayAvatarURL(),
                    },
                    color: client.embedColor,
                    fields: [
                        { name: `Message Edited in <#${message.channel.id}>`, value: '[Jump to Message](https://example.com)' },
                        { name: 'Before', value: 'message before edit' },
                        { name: 'After', value: 'message after edit' },
                    ],
                    footer: {
                        text: `User ID: ${member.id}`,
                    },
                    timestamp: new Date().toISOString(),
                },
                {
                    author: {
                        name: `${member.user.username}`,
                        icon_url: member.displayAvatarURL(),
                    },
                    description: `**Message sent by <@${message.author.id}> Deleted in <#${message.channel.id}>**\nMessage`,
                    footer: {
                        text: `Author: ${member.id} | Message ID: ${message.id}`,
                    },
                    timestamp: new Date().toISOString(),
                    color: 0xff0000,
                },
            ],
        });
    },
});
