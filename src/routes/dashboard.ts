import { FastifyInstance } from 'fastify';
import { constructPage } from '../constants.js';
import { root } from './index.js';

async function routes(fastify: FastifyInstance) {
    fastify.all('/', (req, reply) => {
        constructPage(
            reply,
            {
                language: 'en-US',
                head: { title: 'Home', description: '', image: '/static/assets/favicon_x256.png', files: [`${root}/head.html`, `${root}/dashboard/head.html`] },
                body: { files: [`${root}/nav.html`, `${root}/dashboard/index.html`] },
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
                head: { title: 'Home', description: '', image: '/static/assets/favicon_x256.png', files: [`${root}/head.html`, `${root}/dashboard/head.html`] },
                body: { files: [`${root}/nav.html`, `${root}/dashboard/modules.html`] },
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
                head: { title: 'Home', description: '', image: '/static/assets/favicon_x256.png', files: [`${root}/head.html`, `${root}/dashboard/head.html`] },
                body: { files: [`${root}/nav.html`, `${root}/dashboard/quotes.html`] },
            },
            async function (window, document) {}
        );
        return reply;
    });
}

export default routes;
