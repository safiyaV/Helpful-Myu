import type { Collection, Message } from 'discord.js';
import { client } from '../index.js';

export default async (message: Message, prefix: string) => {
    const args = message.content.slice(prefix.length).split(/\s+(?=(?:[^"]*"[^"]*")*[^"]*$)/g);
    const command = client.prefixCommands.get(args.shift()?.toLowerCase() as string);
    if (!command || !command.prefixCommand || !message.channel.isTextBased() || message.channel.isDMBased() || message.channel.isThread()) return; //message.reply('Command unavailable.');
    if (await client.isBotOwner(message.author)) return command.prefixCommand({ message, args, client });
    if (command.disabled) return message.reply('This command is disabled, it may be re-enabled in the future.');
    if (command.nsfw && !message.channel.nsfw) return message.reply('This command cannot be used here.');

    const timestamps = client.cooldowns.get(command.name) as Collection<string, number>;
    const now = Date.now();
    if (timestamps.has(message.author.id)) {
        const expire = (timestamps.get(message.author.id) as number) + command.cooldown;
        if (now < expire) return message.reply(`Please wait \`${(expire - now) / 1_000}\` seconds before reusing the \`${command.name}\` command.`);
    }
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), command.cooldown);

    if (command.permissions) {
        for (const permission of command.permissions) {
            if (!message.member?.permissions.has(permission)) return message.reply('You seem to be missing permissions to use this command.');
        }
    }

    command.prefixCommand({ message, args, client }).catch((err) => client.error(err));
};
