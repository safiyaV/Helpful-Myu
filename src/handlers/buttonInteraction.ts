import type { ButtonInteraction } from 'discord.js';
import { client } from '../index.js';
import { Command } from '../classes/Command.js';

export default async (interaction: ButtonInteraction) => {
    const args = interaction.customId.split(';');
    if (interaction.channel?.type !== 0) return interaction.reply({ content: 'This can only be used in a guild text channel.' });
    if (args[1] !== interaction.user.id) return interaction.reply({ content: 'Only command initiator can use these buttons.', flags: ['Ephemeral'] });
    const message = args[2] === 'interaction' ? await interaction.message.fetch(true) : await interaction.channel?.messages.fetch(args[2]);
    if (args[0] === 'cancel') {
        interaction.reply({ content: 'Command canceled.', flags: ['Ephemeral'] }).catch((err: Error) => {});
        interaction.message.delete().catch((err: Error) => {});
        message?.delete().catch((err: Error) => {});
    } else {
        const command = client.allCommands.get(args[0]) as Command;
        if (!command || !command.button) return;
        command.button({ interaction, message, args }).catch((err: Error) => {});
    }
};
