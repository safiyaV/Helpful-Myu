window.addEventListener('load', async () => {
    let loginButtons = document.getElementsByClassName('login');
    const params = new URLSearchParams(window.location.hash.slice(1) + window.location.search);
    const accessToken = params.get('access_token') || window.localStorage.getItem('access_token');
    const tokenType = params.get('token_type') || window.localStorage.getItem('token_type');
    let me = JSON.parse(window.localStorage.getItem('me') ?? '{}');
    let shouldReload = 0;

    if (window.opener) {
        if (accessToken === 'null') return (document.getElementById('login').style.display = 'block');
        window.localStorage.setItem('access_token', accessToken);
        window.localStorage.setItem('token_type', tokenType);
        window.opener.postMessage('reload');
        window.close();
    }

    if (!accessToken) {
        loginButtons = document.getElementsByClassName('login');
        const discordOAuth = `https://discord.com/oauth2/authorize?client_id=${
            window.location.port === '9011' ? '996196343120928859' : '995370187626905611'
        }&response_type=token&redirect_uri=`;
        const scopes = ['identify', 'guilds'];
        for (const origin of ['https://nekord.org', 'http://localhost:9010', , 'http://localhost:9011']) {
            if (origin !== window.location.origin) continue;
            for (const btn of loginButtons) {
                btn.setAttribute('href', `${discordOAuth}${encodeURIComponent(origin)}&scope=${scopes.join('+')}`);
                btn.setAttribute('onclick', `window.open('${discordOAuth}${encodeURIComponent(origin)}&scope=${scopes.join('+')}','popup','width=600,height=820'); return false;`);
            }
        }

        if (me?.message && me.message === '401: Unauthorized') {
            window.localStorage.clear();
            window.location.reload();
        }
    }

    if ((accessToken && !me?.id) || (me && Date.now() - me.updated > 7_200_000)) {
        console.log('e');
        const user = await (await fetch('https://discord.com/api/users/@me', { headers: { authorization: `${tokenType} ${accessToken}` } })).json();
        if (user?.message && user.message === '401: Unauthorized') {
            window.localStorage.clear();
            window.location.reload();
        }
        user.updated = Date.now();
        const userGuilds = await (await fetch('https://discord.com/api/users/@me/guilds', { headers: { authorization: `${tokenType} ${accessToken}` } })).json();
        window.localStorage.setItem('me', JSON.stringify(user));
        window.localStorage.setItem('guilds', JSON.stringify(userGuilds.map((guild) => guild.id)));
        shouldReload = 1;
    }
    if (shouldReload === 1) location.reload();
    if (me.id) {
        const container = document.getElementById('user');
        document.getElementById('userAvatar').src = `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.gif?size=32`;
        document.getElementById('userAvatar').onerror = (e) => (e.target.src = `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.webp?size=32`);
        document.getElementById('username').innerText = me.global_name;
        container.addEventListener('click', () => {
            document.getElementById('nav_popout').classList.toggle('hidden');
            document.getElementById('caret').classList.toggle('rotated');
        });

        container.classList.remove('hidden');
        for (const btn of loginButtons) {
            btn.remove();
        }
        document.getElementById('logout').addEventListener('click', async () => {
            window.localStorage.clear();
            window.location.reload();
        });
    }
});
