export class Tenor {
    constructor() {}
    public async search(term: string, random: boolean, limit?: number): Promise<response> {
        if (random) limit = limit || 20;
        const raw: responseRaw = await (await fetch(`https://tenor.googleapis.com/v2/search?q=${term}&key=${process.env.TENOR_KEY}&limit=${limit || 1}`)).json();
        return {
            result: random ? raw.results[Math.floor(Math.random() * raw.results.length)] : raw.results[0],
            raw,
        };
    }
    public async posts(ids: string): Promise<response> {
        const raw: responseRaw = await (await fetch(`https://tenor.googleapis.com/v2/posts?ids=${ids}&key=${process.env.TENOR_KEY}`)).json();
        return {
            result: raw.results[0],
            raw,
        };
    }
}
type response = {
    result: responseResult;
    raw: responseRaw;
};
type responseRaw = {
    results: Array<responseResult>;
    next: string;
};
type responseResult = {
    id: string;
    title: string;
    media_formats: {
        gif: responseMediaFormat;
        tinymp4: responseMediaFormat;
        tinygif: responseMediaFormat;
        nanogifpreview: responseMediaFormat;
        gifpreview: responseMediaFormat;
        loopedmp4: responseMediaFormat;
        mediumgif: responseMediaFormat;
        mp4: responseMediaFormat;
        tinygifpreview: responseMediaFormat;
        nanogif: responseMediaFormat;
        nanowebm: responseMediaFormat;
        nanomp4: responseMediaFormat;
        tinywebm: responseMediaFormat;
        webm: responseMediaFormat;
    };
    created: number;
    content_description: string;
    itemurl: string;
    url: string;
    tags: Array<string>;
    flags: Array<unknown>;
    hasaudio: boolean;
};
type responseMediaFormat = {
    url: string;
    duration: number;
    preview: string;
    dims: Array<number>;
    size: number;
};
