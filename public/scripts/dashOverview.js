window.onload = async () => {
    const host = window.location.hostname;
    const guild = await (await fetch(host === 'localhost' ? '/api/guild/981639333549322262' : '/api/guild/632717913169854495')).json();

    document.getElementById('serverName').innerHTML = guild.name;
    document.getElementById('serverIcon').setAttribute('src', guild.info.icon || '');

    document.getElementById('memberCount').innerHTML = Number(guild.members.length).toLocaleString();
    document.getElementById('categoryCount').innerHTML = Number(guild.channels.GUILD_CATEGORY.length).toLocaleString();
    document.getElementById('channelCount').innerHTML = Number(guild.channels.GUILD_TEXT.length).toLocaleString();
    document.getElementById('vcCount').innerHTML = Number(guild.channels.GUILD_VOICE.length).toLocaleString();
    document.getElementById('roleCount').innerHTML = Number(guild.roles.length).toLocaleString();
    document.getElementById('copyServerId').onclick = () => {
        navigator.clipboard.writeText(guild.id);
        window.alert(`Copied Server ID`);
    };

    document.getElementById('nickname').setAttribute('placeholder', guild.bot.nickname || guild.bot.displayName);
    document.getElementById('prefix').value = guild.info.prefix;
    const admins = document.getElementById('admins');
    for (const role of guild.roles.sort(compare)) {
        const element = document.createElement('li');
        element.id = role.id;
        element.innerText = role.name;
        admins.append(element);
    }
};

function compare(a, b) {
    if (a.name.toLowerCase() < b.name.toLowerCase()) {
        return -1;
    }
    if (a.name.toLowerCase() > b.name.toLowerCase()) {
        return 1;
    }
    return 0;
}
