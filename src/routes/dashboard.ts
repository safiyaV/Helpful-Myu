import { FastifyInstance } from 'fastify';
import { constructPage } from '../constants.js';

async function routes(fastify: FastifyInstance) {
    fastify.all('/', (req, reply) => {
        constructPage(reply, {
            language: 'en-US',
            head: { title: 'Home', description: '', image: '/static/assets/favicon_x256.png', files: ['public/head.html'] },
            body: { files: ['public/nav.html', 'public/dashboard/index.html'] },
        });
        return reply;
    });
    fastify.all('/quotes', (req, reply) => {
        constructPage(reply, {
            language: 'en-US',
            head: { title: 'Home', description: '', image: '/static/assets/favicon_x256.png', files: ['public/head.html'] },
            body: { files: ['public/nav.html', 'public/dashboard/quotes.html'] },
        });
        return reply;
    });
}

export default routes;
