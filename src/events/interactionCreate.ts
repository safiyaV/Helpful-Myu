import { Event } from '../classes/Event.js';
import slashCommand from '../handlers/slashCommand.js';
import userContextCommand from '../handlers/userContextCommand.js';
import messageContextCommand from '../handlers/messageContextCommand.js';
import buttonInteraction from '../handlers/buttonInteraction.js';
import selectMenuInteraction from '../handlers/selectMenuInteraction.js';

export default new Event('interactionCreate', {
    async fn(interaction) {
        if (!interaction.id) return;
        if (interaction.isChatInputCommand()) return slashCommand(interaction);
        if (interaction.isUserContextMenuCommand()) return userContextCommand(interaction);
        if (interaction.isMessageContextMenuCommand()) return messageContextCommand(interaction);
        if (interaction.isButton()) return buttonInteraction(interaction);
        if (interaction.isAnySelectMenu()) return selectMenuInteraction(interaction);
    },
});
