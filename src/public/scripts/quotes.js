window.onload = async () => {
    const target = await (await fetch('/api/guild/target')).json();
    const quotes = await (await fetch(`/api/guild/${target.id}/quotes${window.location.search}`)).json();
    const quoteError = document.getElementById('quoteError');
    const searchInput = document.getElementById('searchInput');
    searchInput.value = window.location.search.replace('?search=', '');
    const table = document.getElementById('quoteTable');
    if (!quotes[0]) {
        table.remove();
        quoteError.innerText += `There are no quotes matching ${window.location.search.replace('?search=', '')}`;
    }
    const users = [];
    for (const quote of quotes) {
        const row = document.createElement('tr');
        const id = document.createElement('td');
        const name = document.createElement('td');
        const creator = document.createElement('td');
        const created = document.createElement('td');
        const content = document.createElement('td');
        //const manage = document.createElement('td');
        id.innerText = quote.id;
        id.classList.add('quoteID');
        name.innerText = quote.name;
        name.classList.add('quoteName');
        let user = users.filter((user) => user.id === quote.createdBy)[0];
        if (!user) {
            try {
                user = await (await fetch(`/api/guild/${target.id}/user/${quote.createdBy}`)).json();
                users.push(user);
            } catch (error) {
                users.push({
                    id: quote.createdBy,
                });
            }
        }
        creator.innerText = user?.username || 'NOT FOUND';
        creator.setAttribute('title', quote.createdBy);
        creator.classList.add('quoteCreator');
        created.innerText = new Date(quote.createdAt).toLocaleDateString();
        created.classList.add('quoteCreated');
        content.innerText = quote.content;
        content.classList.add('quoteContent');
        // manage.innerText = quote.deleted;
        // manage.classList.add('quoteManage');
        row.append(id, name, creator, created, content);
        row.classList.add('fadeIn');
        table.append(row);
    }
};
