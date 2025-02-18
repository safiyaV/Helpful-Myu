import { getGuildInfo } from '../handlers/database.js';
import { Event } from '../classes/Event.js';

export default new Event('guildMemberUpdate', {
    async fn(oldMember, newMember) {
        const fetchedOldMember = await oldMember.fetch(true);
        if (fetchedOldMember.premiumSince === null && newMember.premiumSince) {
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
                        messageChannel.send(guildInfo.boost!.message.replaceAll('@{USER}', `<@${newMember.id}>`));
                    }
                })
                .catch(() => {});
        }
    },
});
