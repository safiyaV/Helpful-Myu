import { Command } from '../../classes/Command.js';
import { ApplicationCommandOptionType } from 'discord.js';

export default new Command({
    name: 'createquote',
    description: 'Creates a quote.',
    disabled: false,
    category: 'quotes',
    deferReply: false,
    dm_permission: false,
    hidden: false,
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'name',
            description: 'The name of your quote',
            required: true,
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
    async slashCommand({ interaction, client }) {},
    async prefixCommand({ message, args, client }) {
        message.reply(`this command is under construction :3\n\`\`\`arguments: ${args}\`\`\``);
    },
});
