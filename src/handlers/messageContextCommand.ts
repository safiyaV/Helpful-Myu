import type { Collection, MessageContextMenuCommandInteraction } from 'discord.js';
import { client } from '../index.js';

export default async (interaction: MessageContextMenuCommandInteraction) => {
    const command = client.messageContextCommands.get(interaction.commandName);
    if (!command || command.disabled || !command.contextMessageCommand)
        return interaction.reply({ content: 'This command is disabled, it may be re-enabled in the future.', flags: ['Ephemeral'] });
    const hidden = !!interaction.options.get('hide')?.value || command.hidden || false;
    if (command.deferReply) await interaction.deferReply(hidden ? { flags: ['Ephemeral'] } : {});
    if (await client.isBotOwner(interaction.user)) return command?.contextMessageCommand({ interaction, options: interaction.options, client });

    const timestamps = client.cooldowns.get(command.name) as Collection<string, number>;
    const now = Date.now();
    if (timestamps.has(interaction.user.id)) {
        const expire = (timestamps.get(interaction.user.id) as number) + command.cooldown;
        if (now < expire)
            return interaction.reply({ content: `Please wait \`${(expire - now) / 1_000}\` seconds before reusing the \`${command.name}\` command.`, flags: ['Ephemeral'] });
    }
    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), command.cooldown);

    if (command.permissions) {
        for (const permission of command.permissions) {
            if (interaction.memberPermissions && !interaction.memberPermissions.has(permission))
                return interaction.reply({ content: 'You seem to be missing permissions to use this command.', flags: ['Ephemeral'] });
        }
    }

    command.contextMessageCommand({ interaction, options: interaction.options, client }).catch((err) => client.error(err));
};
