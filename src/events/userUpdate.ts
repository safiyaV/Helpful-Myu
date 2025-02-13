import { Event } from '../classes/Event.js';
import { editUserAll } from '../handlers/database.js';

export default new Event('userUpdate', {
    async fn(oldUser, newUser) {
        await editUserAll(newUser.id, { username: newUser.username, avatar: newUser.avatarURL() });
    },
});
