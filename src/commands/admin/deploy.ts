import { Command } from '../../classes/Command.js';

export default new Command({
    name: 'deploy',
    description: 'Deploys commands globally.',
    category: 'admin',
    disabled: true,
    dm_permission: false,
    options: [],
    async prefixCommand({ message, args, client }) {
        client
            .registerCommands(['global'])
            .then(() => {
                message.reply('Deployed commands successfully');
            })
            .catch((err) => {
                message.reply('There was an issue deploying commands, check console.');
                client.error(err);
            });
    },
});
