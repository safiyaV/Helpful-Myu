import { Event } from '../classes/Event.js';
import { client } from '../index.js';

export default new Event('error', {
    async fn(error) {
        client.error(error);
    },
});
