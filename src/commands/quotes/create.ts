import { Command } from '../../classes/Command.js';
import { ApplicationCommandOptionType } from 'discord.js';
import { Quote } from '../../types/database.type.js';
import { createQuote } from '../../handlers/database.js';
import { WithId } from 'mongodb';

export default new Command({
    name: 'createquote',
    description: 'Creates a quote.',
    disabled: false,
    category: 'quote',
    deferReply: true,
    dm_permission: false,
    hidden: false,
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'keyword',
            description: 'The keyword for your quote',
            required: true,
            min_length: 1,
            max_length: 24,
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'content',
            description: 'The contents of your quote',
            required: true,
        },
        {
            type: ApplicationCommandOptionType.Boolean,
            name: 'hide',
            description: 'Hide the quote creation response',
        },
    ],
    aliases: ['qa', 'qadd', 'addquote', 'quoteadd', 'qc', 'qcreate'],
    async slashCommand({ interaction, options, client }) {
        if (!interaction.guildId) return;
        const keyword = options
            .getString('keyword', true)
            .replaceAll('_', '-')
            .replaceAll(/[\n\r\s]+/g, '-');
        const content = options.getString('content', true);
        const quote = (await createQuote(interaction.guildId, {
            id: keyword,
            name: keyword,
            content,
            createdBy: interaction.user.id,
            createdAt: new Date(),
            deleted: false,
        })) as WithId<Quote>;
        interaction.editReply(`Quote \`${quote.id}\` cweated :3`);
    },
    async prefixCommand({ message, args, client }) {
        if (!message.guildId) return;
        if (!args[0]) return message.reply('Nyu keyword or content provided miyaaaa~!');
        const keyword = args.shift() as string;
        if (keyword.length > 24) return message.reply('Nyu keyword is too long miyaaaa~!');
        if (!args[0]) return message.reply("You didn't add the content desu~!");
        const quote = (await createQuote(message.guildId, {
            id: keyword,
            name: keyword,
            content: args.join(' '),
            createdBy: message.author.id,
            createdAt: new Date(),
            deleted: false,
        })) as WithId<Quote>;
        message.reply(`Quote \`${quote.id}\` cweated :3`);
    },
});
