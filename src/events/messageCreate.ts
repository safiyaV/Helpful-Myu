import { Event } from '../classes/Event.js';
import prefixCommand from '../handlers/prefixCommand.js';
import { getGuildInfo, messageCreate } from '../handlers/database.js';
import { createMessage } from '../handlers/database_hidden.js';
import { Message } from 'discord.js';
import { client } from '../index.js';

export default new Event('messageCreate', {
    async fn(message) {
        if (message.author.bot || message.author.system || !message.inGuild()) return;
        if (message.type === 8) boostMessage(message);
        messageCreate(message.client, message.guildId, message.author.id);
        createMessage(message.guildId, {
            id: message.id,
            content: message.content,
            created: message.createdTimestamp,
            author: message.author.id,
            attachments: message.attachments,
        });

        let prefix = message.content.startsWith('=') ? '=' : undefined;
        if (!prefix) return;
        prefixCommand(message, prefix);
    },
});

async function boostMessage(message: Message<true>) {
    const guild = message.guild;
    const guildInfo = await getGuildInfo(guild.id);
    if (!guildInfo) return;
    if (guildInfo.boost.logChannel) {
        const logChannel = await guild.channels.fetch(guildInfo.boost.logChannel);
        if (logChannel?.isTextBased()) {
        }
    }
    if (guildInfo.boost.messageChannel) {
        const messageChannel = await guild.channels.fetch(guildInfo.boost.messageChannel);
        if (messageChannel?.isTextBased()) {
            messageChannel.send(client.formatMessage(await guild.members.fetch(message.author.id), guildInfo.boost.message));
        }
    }
}
