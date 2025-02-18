import { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyFavicon from 'fastify-favicon';
import { constructPage } from '../constants.js';
import path from 'path';

async function routes(fastify: FastifyInstance) {
    fastify.register(fastifyStatic, { root: path.join(process.cwd(), 'public/'), prefix: '/static/' });
    fastify.register(fastifyFavicon, { path: path.join(process.cwd(), 'public/assets/'), name: 'favicon_x256.png', maxAge: 3600 });
    fastify.setNotFoundHandler({ preValidation: (req, res, done) => done(), preHandler: (req, res, done) => done() }, async function (req, res) {
        constructPage(res, {
            language: 'en-US',
            head: {
                title: 'Page Not Found',
                description: 'Error 404, Page Not Found.',
                image: '/static/assets/favicon_x256.png',
                files: ['public/head.html'],
            },
            body: { files: ['public/nav.html', 'public/404.html'] },
        });
        return res;
    });
    fastify.all('/', (req, reply) => {
        constructPage(reply, {
            language: 'en-US',
            head: { title: 'Home', description: '', image: '/static/assets/favicon_x256.png', files: ['public/head.html'] },
            body: { files: ['public/nav.html', 'public/index.html'] },
        });
        return reply;
    });

    fastify.register((await import('./dashboard.js')).default, { prefix: '/dash' });
}

export default routes;
