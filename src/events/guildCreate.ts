import { createCollection } from '../handlers/database.js';
import { Event } from '../classes/Event.js';

export default new Event('guildCreate', {
    async fn(guild) {
        await createCollection(guild.id);
    },
});
