import { Event } from '../classes/Event.js';
import { editGuildInfo } from '../handlers/database.js';

export default new Event('guildUpdate', {
    async fn(oldGuild, newGuild) {
        await editGuildInfo(newGuild.id, { name: newGuild.name, icon: newGuild.iconURL() });
    },
});
