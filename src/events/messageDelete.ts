import { getMessage } from '../handlers/database_hidden.js';
import { Event } from '../classes/Event.js';
import { getGuildInfo } from '../handlers/database.js';

export default new Event('messageDelete', {
    async fn(oldMessage) {
        const guildId = oldMessage.guildId;
        if (!guildId) return;
        if (guildId !== '981639333549322262') return;
        const message = await getMessage(guildId, oldMessage.id);
        const guildInfo = await getGuildInfo(guildId);
        if (!message || !guildInfo) return;
        try {
            const member = await oldMessage.guild?.members.fetch(message.author);
            const channel = await oldMessage.guild?.channels.fetch(guildInfo.message.deleteLogChannel);
            if (!channel?.isTextBased() || !member) throw new Error();
            channel.send({
                embeds: [
                    {
                        author: {
                            name: `${member.user.username}`,
                            icon_url: member.displayAvatarURL(),
                        },
                        description: `**Message sent by <@${message.author}> Deleted in <#${oldMessage.channelId}>**\n${message.content}`,
                        footer: {
                            text: `Author: ${member.id} | Message ID: ${message.id}`,
                        },
                        timestamp: new Date().toISOString(),
                        color: 0xff0000,
                    },
                ],
            });
        } catch (error) {}
    },
});
