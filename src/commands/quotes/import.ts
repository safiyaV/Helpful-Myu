import axios from 'axios';
import { Command } from '../../classes/Command.js';
import { OldQuote } from '../../types/database.type.js';
import { createQuote } from '../../handlers/database.js';

export default new Command({
    name: 'importquotes',
    description: 'Imports quotes from a mongodb json file.',
    disabled: false,
    category: 'quote',
    deferReply: false,
    dm_permission: false,
    hidden: false,
    async prefixCommand({ message, args, client }) {
        if (!(await client.isBotOwner(message.author)) || !message.guildId) return message.reply('Only my owner can run that command, sowwy. >~<');
        const msg = message.reply('Starting Import...');
        const attachments = message.attachments;
        let attachment;
        let count = 0;
        for (attachment of attachments) {
            attachment = attachment[1];
            if (!attachment.contentType?.includes('application/json')) continue;
            const json = (await axios(attachment.url, { responseType: 'json' })).data;
            for (const index in json) {
                const entry = json[index] as OldQuote;
                count++;
                await createQuote(args[0] || message.guildId, {
                    id: entry.id,
                    name: entry.keyword,
                    content: entry.text,
                    createdBy: entry.createdBy,
                    createdAt: new Date(entry.createdAt.$date),
                    deleted: false,
                });
                console.log('importing quotes', +index + 1, '/', json.length);
            }
        }
        (await msg).edit(`Imported ${count} quotes.`);
    },
});
