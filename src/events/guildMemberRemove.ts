import { deleteUser, getGuildInfo } from '../handlers/database.js';
import { Event } from '../classes/Event.js';
import { client } from '../index.js';

export default new Event('guildMemberRemove', {
    async fn(member) {
        const guild = member.guild;
        const guildInfo = await getGuildInfo(guild.id);
        if (!guildInfo) return;
        guild.channels
            .fetch(guildInfo.leave.logChannel)
            .then((logChannel) => {
                if (!logChannel?.isTextBased()) throw new Error();
                const created = Math.round(member.user.createdTimestamp / 1_000);
                const left = Math.round(Date.now() / 1000);
                logChannel.send({
                    embeds: [
                        {
                            author: {
                                name: `${member.user.username} Left >~<`,
                                icon_url: member.displayAvatarURL(),
                            },
                            description: `<@${member.id}>\n♡ ID: ${member.id}\n♡ Account Created: <t:${created}:D> (<t:${created}:R>)\n♡ Left: <t:${left}> (<t:${left}:R>)`,
                            thumbnail: { url: member.displayAvatarURL({ size: 1024 }) },
                            color: 0xff0000,
                        },
                    ],
                });
            })
            .catch(() => {});
        guild.channels
            .fetch(guildInfo.leave.messageChannel)
            .then(async (messageChannel) => {
                if (messageChannel?.isTextBased()) {
                    messageChannel.send(client.formatMessage(await member.fetch(true), guildInfo.leave.message));
                }
            })
            .catch(() => {});
        await deleteUser(guild.id, member.user.id);
    },
});
