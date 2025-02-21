import { getGuildInfo } from '../handlers/database.js';
import { Event } from '../classes/Event.js';
import { client } from '../index.js';

export default new Event('guildMemberAdd', {
    async fn(member) {
        const guild = member.guild;
        const guildInfo = await getGuildInfo(guild.id);
        if (!guildInfo) return;
        guild.channels
            .fetch(guildInfo.join.logChannel)
            .then((logChannel) => {
                if (!logChannel?.isTextBased()) throw new Error();
                const created = Math.round(member.user.createdTimestamp / 1_000);
                const joined = Math.round(Date.now() / 1_000);
                logChannel.send({
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
                    ],
                });
            })
            .catch(() => {});
        guild.channels
            .fetch(guildInfo.join.messageChannel)
            .then((messageChannel) => {
                if (messageChannel?.isTextBased()) {
                    messageChannel.send(client.formatMessage(member, guildInfo.join.message));
                }
            })
            .catch(() => {});
    },
});
