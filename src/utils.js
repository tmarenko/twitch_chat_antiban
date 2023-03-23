const twitchColors = ["#FF0000", "#0000FF", "#008000", "#B22222", "#FF7F50", "#E05B5B", "#9ACD32", "#FF4500", "#2E8B57", "#DAA520", "#D2691E", "#5F9EA0", "#1E90FF", "#FF69B4", "#8A2BE2", "#00FF7F"];

async function fetchJson(url, headers = {}) {
    const response = await fetch(url, {headers});
    if (!response.ok) return null;
    return await response.json();
}

function TwitchAPI(path) {
    const url = `https://api.twitch.tv/helix${path}`;
    const headers = {
        "Client-Id": "%CLIENTTOKEN%",
        "Authorization": "%AUTHTOKEN%"
    };
    return fetchJson(url, headers)
        .then(data => {
            return data;
        });
}

function parseIRCMessage(message) {
    const parsedMessage = {};
    const [tags, source, command, channel, ...msg] = message.split(' ');

    if (tags.startsWith('@')) {
        const tagsString = tags.substring(1);
        const tagsArray = tagsString.split(';');
        tagsArray.forEach(tag => {
            const [key, value] = tag.split('=');
            parsedMessage[key] = value;
        });
    }

    if (source.startsWith(':')) {
        const sourceString = source.substring(1);
        const [nickname, user, host] = sourceString.split(/[!@]/);
        parsedMessage.source = {nickname, user, host};
    }

    parsedMessage.command = command;
    parsedMessage.channel = channel?.substring(1);

    parsedMessage.msg = msg.join(' ').substring(1);
    if (parsedMessage.msg.startsWith('\x01ACTION') && parsedMessage.msg.endsWith('\x01')) {
        parsedMessage.action = true;
        parsedMessage.msg = parsedMessage.msg.replace(/^\x01ACTION/, '').replace(/\x01$/, '').trim();
    } else {
        parsedMessage.action = false;
    }

    return parsedMessage;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
