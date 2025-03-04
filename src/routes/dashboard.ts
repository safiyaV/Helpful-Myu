import { FastifyInstance } from 'fastify';
import { constructPage } from '../constants.js';
import { client } from '../index.js';

async function routes(fastify: FastifyInstance) {
    fastify.all('/', (req, reply) => {
        constructPage(
            reply,
            {
                language: 'en-US',
                head: { title: 'Home', description: '', image: '/static/assets/favicon_x256.png', files: ['public/head.html', 'public/dashboard/head.html'] },
                body: { files: ['public/nav.html', 'public/dashboard/index.html'] },
            },
            async function (window, document) {}
        );
        return reply;
    });
    fastify.all('/modules', (req, reply) => {
        constructPage(
            reply,
            {
                language: 'en-US',
                head: { title: 'Home', description: '', image: '/static/assets/favicon_x256.png', files: ['public/head.html', 'public/dashboard/head.html'] },
                body: { files: ['public/nav.html', 'public/dashboard/modules.html'] },
            },
            async function (window, document) {}
        );
        return reply;
    });
    fastify.all('/quotes', (req, reply) => {
        constructPage(
            reply,
            {
                language: 'en-US',
                head: { title: 'Home', description: '', image: '/static/assets/favicon_x256.png', files: ['public/head.html', 'public/dashboard/head.html'] },
                body: { files: ['public/nav.html', 'public/dashboard/quotes.html'] },
            },
            async function (window, document) {}
        );
        return reply;
    });
}

export default routes;
