import { deleteUser, getGuildInfo } from '../handlers/database.js';
import { Event } from '../classes/Event.js';

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
                                name: `${member.user.username} (${member.id}) Left >~<`,
                                icon_url: member.displayAvatarURL(),
                            },
                            description: `♡ Created Account: <t:${created}:D> (<t:${created}:R>)\nLeft: <t:${left}> (<t:${left}:R>)`,
                            thumbnail: { url: member.displayAvatarURL() },
                            color: 0xff0000,
                        },
                    ],
                });
            })
            .catch(() => {});
        guild.channels
            .fetch(guildInfo.leave.messageChannel)
            .then((messageChannel) => {
                if (messageChannel?.isTextBased()) {
                    messageChannel.send(guildInfo.leave!.message.replaceAll('@{USER}', `<@${member.id}>`));
                }
            })
            .catch(() => {});
        await deleteUser(guild.id, member.user.id);
    },
});
