import { type APIEmbed, type APIEmbedImage, ApplicationCommandOptionType, type User } from 'discord.js';
import { Command } from '../../classes/Command.js';
import { client } from '../../index.js';
import { getQuote, getQuotes } from '../../handlers/database.js';
import { WithId } from 'mongodb';
import { Quote } from '../../types/database.type.js';

export default new Command({
    name: 'quotesearch',
    description: 'Search quote by ID or Keyword',
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'query',
            description: 'Keyword or ID you want to search',
            required: true,
        },
        {
            type: ApplicationCommandOptionType.Boolean,
            name: 'hide',
            description: 'Hide the response',
        },
    ],
    aliases: ['qs', 'qsearch'],
    category: 'quotes',
    async slashCommand({ interaction, options }) {
        if (!interaction.guildId) return;
        try {
            const query = options.getString('query', true);
            let quotes = [await getQuote(interaction.guildId, query)];
            if (!quotes[0]) quotes = await getQuotes(interaction.guildId, query);
            const parsedQuotes = [];
            for (const quote of quotes) {
                if (!quote) continue;
                parsedQuotes.push({
                    label: `ID: ${quote.id} Text:${quote.content.substring(0, 45)}`,
                    description: `${quote.content.substring(45, 145)}`,
                    value: `${quote.id}`,
                });
            }
            const quote = quotes[0];
            if (!quote) return interaction.editReply('This query has no quotes, sempai~');
            const pages = Math.floor(parsedQuotes.length / 25);
            let components = [];
            for (let index = 0; index < pages + 1; index++) {
                components.push({
                    type: 1,
                    components: [
                        {
                            type: 3,
                            custom_id: `quotesearch_${interaction.user.id}_${interaction.id}_${index}`,
                            options: parsedQuotes.slice(25 * index, 25 * (index + 1)),
                            placeholder: `Select a quote (quotes ${25 * index + 1}-${25 * (index + 1)})`,
                        },
                    ],
                });
            }
            interaction.editReply({
                embeds: [await makeEmbed(quote, interaction.user)],
                components,
            });
        } catch (err: Error | unknown) {
            client.error(err);
        }
    },
    async prefixCommand({ message, args }) {
        if (!message.guildId) return;
        if (!args[0]) return message.reply('Nyu query provided miyaaaa~!');
        let quotes = [await getQuote(message.guildId, args[0])];
        if (!quotes[0]) quotes = await getQuotes(message.guildId, args[0]);
        const parsedQuotes = [];
        for (const quote of quotes) {
            if (!quote) continue;
            parsedQuotes.push({
                label: `ID: ${quote.id} Text:${quote.content.substring(0, 45)}`,
                description: `${quote.content.substring(45, 145)}`,
                value: `${quote.id}`,
            });
        }
        const quote = quotes[0];
        if (!quote) return message.reply('This query has no quotes, sempai~');
        const pages = Math.floor(parsedQuotes.length / 25);
        let components = [];
        for (let index = 0; index < pages + 1; index++) {
            components.push({
                type: 1,
                components: [
                    {
                        type: 3,
                        custom_id: `quotesearch_${message.author.id}_${message.id}_${index}`,
                        options: parsedQuotes.slice(25 * index, 25 * (index + 1)),
                        placeholder: `Select a quote (quotes ${25 * index + 1}-${25 * (index + 1)})`,
                    },
                ],
            });
        }
        message.reply({
            embeds: [await makeEmbed(quote, message.author)],
            components,
        });
    },
    async selectMenu({ interaction }) {
        if (!interaction.guildId) return;
        interaction.deferUpdate();
        const quote = await getQuote(interaction.guildId, interaction.values[0]);
        if (!quote) return;
        interaction.message.edit({
            embeds: [await makeEmbed(quote, interaction.user)],
        });
    },
});

async function makeEmbed(quote: WithId<Quote>, user: User): Promise<APIEmbed> {
    const createdBy = await client.users.fetch(quote.createdBy);
    const contents: Array<string> = quote.content.split(/[\n\r\s]+/);
    let image: APIEmbedImage | undefined;
    for (const content of contents) {
        if (content.startsWith('https://tenor.com/view/')) {
            const gif = (await fetch(`${content}.gif`, { redirect: 'follow' }).catch((err: Error) => {})) as Response;
            image = { url: gif.url };
            break;
        } else if (content.startsWith('https://cdn.discordapp.com')) {
            image = { url: content };
            break;
        }
    }
    return {
        color: client.embedColor,
        title: `Quote ${quote.id}`,
        description: `**Keyword:** ${quote.name}\n**Content:** ${quote.content}\n**Created By:** ${createdBy.username} (${createdBy.id}) <t:${Math.floor(
            quote.createdAt.getTime() / 1_000
        )}:R>\n`,
        image,
        timestamp: new Date().toISOString(),
        footer: {
            text: `Requested by ${user.username}`,
            icon_url: user.displayAvatarURL(),
        },
    };
}
