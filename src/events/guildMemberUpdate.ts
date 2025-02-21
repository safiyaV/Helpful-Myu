import { getGuildInfo } from '../handlers/database.js';
import { Event } from '../classes/Event.js';
import { client } from '../index.js';

export default new Event('guildMemberUpdate', {
    async fn(oldMember, newMember) {
        if (oldMember.premiumSince !== newMember.premiumSince) {
            const guild = newMember.guild;
            const guildInfo = await getGuildInfo(guild.id);
            if (!guildInfo) return;
            guild.channels
                .fetch(guildInfo.boost.logChannel)
                .then((logChannel) => {
                    if (!logChannel?.isTextBased()) throw new Error();
                })
                .catch(() => {});
            guild.channels
                .fetch(guildInfo.boost.messageChannel)
                .then((messageChannel) => {
                    if (messageChannel?.isTextBased()) {
                        messageChannel.send(client.formatMessage(newMember, guildInfo.boost.message));
                    }
                })
                .catch(() => {});
        }
    },
});
