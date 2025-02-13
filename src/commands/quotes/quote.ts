import { Command } from '../../classes/Command.js';
import { ApplicationCommandOptionType } from 'discord.js';
import { Quote } from '../../types/database.type.js';
import { createQuote, getQuote, getQuotes } from '../../handlers/database.js';
import { WithId } from 'mongodb';

export default new Command({
    name: 'quote',
    description: 'Creates a quote.',
    disabled: false,
    category: 'quotes',
    deferReply: true,
    dm_permission: false,
    hidden: false,
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'query',
            description: 'Search a keyword or an ID',
            required: true,
        },
        {
            type: ApplicationCommandOptionType.Boolean,
            name: 'hide',
            description: 'Hide the response',
        },
    ],
    aliases: ['q'],
    async slashCommand({ interaction, client, options }) {
        if (!interaction.guildId) return;
        const keyword = options.getString('query', true).toLowerCase().replace(' ', '_');
        let quotes = [await getQuote(interaction.guildId, keyword)];
        if (!quotes[0]) quotes = (await getQuotes(interaction.guildId, keyword)) as [];
        if (!quotes[0]) return interaction.editReply('This query has no quotes, senpai~');
        const chosen = choose(quotes as [WithId<Quote>]);
        interaction.editReply(chosen ? `\`id: ${chosen.id}\`\n${chosen.content}` : 'This query has no quotes, senpai~');
    },
    async prefixCommand({ message, args, client }) {
        if (!message.guildId) return;
        if (!args[0]) return message.reply('You nyeed a query, desu~');
        let quotes = [await getQuote(message.guildId, args[0])];
        if (!quotes[0]) quotes = (await getQuotes(message.guildId, args[0])) as [];
        if (!quotes[0]) return message.reply('This query has no quotes, senpai~');
        const chosen = choose(quotes as [WithId<Quote>]);
        message.reply(chosen ? `\`id: ${chosen.id}\`\n${chosen.content}` : 'This query has no quotes, senpai~');
    },
});

let count = 0;
function choose(quotes: [WithId<Quote>]) {
    if (!quotes || count > 1000) return undefined;
    count++;
    const chosen = quotes[Math.floor(Math.random() * quotes.length)] as WithId<Quote>;
    if (chosen.deleted) return choose(quotes);
    return chosen;
}
