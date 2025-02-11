import type { ChatInputCommandInteraction, Collection } from 'discord.js';
import { client } from '../index.js';

export default async (interaction: ChatInputCommandInteraction) => {
    const command = client.slashCommands.get(interaction.commandName);
    if (!command || command.disabled || !command.slashCommand)
        return interaction.reply({ content: 'This command is disabled, it may be re-enabled in the future.', ephemeral: true });
    const hidden = !!interaction.options.get('hide')?.value || command.hidden || false;
    if (command.deferReply) await interaction.deferReply({ ephemeral: hidden });
    if (client.isBotOwner(interaction.user)) return command?.slashCommand({ interaction, options: interaction.options, client });

    const timestamps = client.cooldowns.get(command.name) as Collection<string, number>;
    const now = Date.now();
    if (timestamps.has(interaction.user.id)) {
        const expire = (timestamps.get(interaction.user.id) as number) + command.cooldown;
        if (now < expire) return interaction.reply(`Please wait \`${(expire - now) / 1_000}\` seconds before reusing the \`${command.name}\` command.`);
    }
    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), command.cooldown);

    if (command.permissions) {
        for (const permission of command.permissions) {
            if (interaction.memberPermissions && !interaction.memberPermissions.has(permission))
                return interaction.reply('You seem to be missing permissions to use this command.');
        }
    }

    command.slashCommand({ interaction, options: interaction.options, client }).catch((err) => client.error(err));
};
