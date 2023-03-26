ProxyChat = {

    socket: null,
    channel: null,
    channelId: null,
    messages: [],
    thirdPartyEmotes: {},
    thirdPartyEmoteCodesByPriority: [],
    badges: {},

    loadChannelData: async function () {
        return TwitchAPI(`/users?login=${ProxyChat.channel}`).then(async response => {
            ProxyChat.channelId = response.data[0].id;
            await ProxyChat.loadThirdPartyEmotes();
            await ProxyChat.loadTwitchBadges();
        });
    },

    loadTwitchBadges: async function () {
        const globalBadges = await fetchJson('https://badges.twitch.tv/v1/badges/global/display');
        const channelBadges = await fetchJson(`https://badges.twitch.tv/v1/badges/channels/${ProxyChat.channelId}/display`);
        ProxyChat.parseTwitchBadges(globalBadges.badge_sets);
        ProxyChat.parseTwitchBadges(channelBadges.badge_sets);
    },

    loadThirdPartyEmotes: async function () {
        ProxyChat.thirdPartyEmotes = {};
        ProxyChat.thirdPartyEmoteCodesByPriority = [];

        for (const endpoint of ['emotes/global', `users/twitch/${ProxyChat.channelId}`]) {
            const ffzEmotes = await fetchJson(`https://api.betterttv.net/3/cached/frankerfacez/${endpoint}`);
            ffzEmotes?.forEach(emote => {
                ProxyChat.thirdPartyEmotes[emote.code] = {
                    id: emote.id,
                    src: emote.images['4x'] || emote.images['2x'] || emote.images['1x']
                };
            });
        }

        for (const endpoint of ['emotes/global', `users/twitch/${ProxyChat.channelId}`]) {
            let bttvEmotes = await fetchJson(`https://api.betterttv.net/3/cached/${endpoint}`);
            if (bttvEmotes && !Array.isArray(bttvEmotes)) {
                bttvEmotes = bttvEmotes.channelEmotes.concat(bttvEmotes.sharedEmotes);
            }
            bttvEmotes?.forEach(emote => {
                ProxyChat.thirdPartyEmotes[emote.code] = {
                    id: emote.id,
                    src: `https://cdn.betterttv.net/emote/${emote.id}/3x`
                };
            });
        }

        for (const endpoint of ['emotes/global', `users/${ProxyChat.channelId}/emotes`]) {
            const stvEmotes = await fetchJson(`https://api.7tv.app/v2/${endpoint}`);
            stvEmotes?.forEach(emote => {
                ProxyChat.thirdPartyEmotes[emote.name] = {
                    id: emote.id,
                    src: emote.urls[emote.urls.length - 1][1],
                    width: `${emote.width[0] / 10}rem`,
                    height: `${emote.height[0] / 10}rem`
                };
            });
        }

        // store emotes priority by its length
        ProxyChat.thirdPartyEmoteCodesByPriority = Object.keys(ProxyChat.thirdPartyEmotes);
        ProxyChat.thirdPartyEmoteCodesByPriority.sort((a, b) => b.length - a.length);
    },

    parseTwitchBadges: function (badgeSets) {
        for (const [set, versions] of Object.entries(badgeSets)) {
            for (const [version, data] of Object.entries(versions.versions)) {
                const key = `${set}/${version}`;
                ProxyChat.badges[key] = {
                    src: data.image_url_1x
                };
            }
        }
    },

    replaceTwitchEmotes: function (message) {
        if (!message.emotes) return message.msg;
        let msg = message.msg;
        const emoteCodes = {};

        message.emotes.split("/").forEach((emote) => {
            const [emoteIndex, ranges] = emote.split(":");
            ranges.split(",").forEach((range) => {
                const [start, end] = range.split("-");
                const emoteCode = message.msg.substring(parseInt(start), parseInt(end) + 1);
                emoteCodes[emoteCode] = {
                    src: `https://static-cdn.jtvnw.net/emoticons/v2/${emoteIndex}/default/dark/3.0`
                };
            });
        });

        for (const emote of Object.keys(emoteCodes)) {
            const emoteHtml = ProxyChat.wrapEmote(emoteCodes[emote]);
            const regex = new RegExp(`(?<!\\S)(${escapeRegExp(emote)})(?!\\S)`, 'g');
            msg = msg.replace(regex, emoteHtml);
        }

        return msg;
    },

    replaceThirdPartyEmotes: function (msg) {
        for (const emoteCode of ProxyChat.thirdPartyEmoteCodesByPriority) {
            const emoteHtml = ProxyChat.wrapEmote(ProxyChat.thirdPartyEmotes[emoteCode]);
            const regex = new RegExp(`(?<!\\S)(${escapeRegExp(emoteCode)})(?!\\S)`, 'g');
            msg = msg.replace(regex, emoteHtml);
        }

        return msg;
    },

    wrapUsername: function (message) {
        const usernameElement = $('<span class="chat-author__display-name"></span>');
        const color = message.color || twitchColors[message['display-name'].charCodeAt(0) % 16];
        usernameElement.css('color', color);
        usernameElement.html(message['display-name'] ?? message.source.nickname);
        return usernameElement;
    },

    wrapMessage: function (message) {
        const messageElement = $('<span></span>');
        if (message.action) {
            const color = message.color || this.twitchColors[message['display-name'].charCodeAt(0) % 16];
            messageElement.css('color', color);
        }
        let msgWithEmotes;
        msgWithEmotes = ProxyChat.replaceTwitchEmotes(message);
        msgWithEmotes = ProxyChat.replaceThirdPartyEmotes(msgWithEmotes);
        messageElement.html(msgWithEmotes);
        return messageElement;
    },

    wrapEmote: function (emote) {
        const imgStyle = emote.width || emote.height ? `style="width: ${emote.width || 'auto'}; height: ${emote.height || 'auto'};"` : '';
        return `<div class="inline-image">
                    <div class="chat-image__container" ${imgStyle}>
                        <img class="chat-image chat-line__message--emote" src="${emote.src}"/>
                    </div>
                </div>`;
    },

    wrapBadge: function (badgeSrc) {
        return `<div class="inline-image">
                    <div class="chat-badge">
                        <img class="chat-image" src="${badgeSrc}"/>
                    </div>
                </div>`;
    },

    wrapBadges: function (message) {
        let badges = [];
        if (message.badges) {
            message.badges.split(',').forEach(badge => {
                if (badge in ProxyChat.badges) {
                    const badgeSrc = ProxyChat.badges[badge].src;
                    badges.push(ProxyChat.wrapBadge(badgeSrc));
                }
            });
        }
        return badges;
    },

    log: function (message) {
        ProxyChat.writeChat({
            'display-name': "Twitch Chat Anti-Ban",
            'msg': message
        });
        console.log(`Twitch Chat Anti-Ban: ${message}`);
    },

    clearMessage: function (messageId) {
        setTimeout(function () {
            $(`.chat-line[data-id=${messageId}]`).remove();
        }, 100);
    },

    clearAllMessages: function (userId) {
        setTimeout(function () {
            $(`.chat-line[data-user-id=${userId}]`).remove();
        }, 100);
    },

    updateChat: setInterval(function () {
        if (ProxyChat.messages.length > 0) {
            $('#proxy-chat').append(ProxyChat.messages.join(''));
            ProxyChat.messages = [];
            let linesToDelete = $('.chat-line').length - 100;
            while (linesToDelete > 0) {
                $('.chat-line').eq(0).remove();
                linesToDelete--;
            }
            // scroll down
            const chatContainer = document.querySelector('.chat-list--default');
            const scrollThreshold = 0.8; // 20% from bottom of container
            const isScrolledNearBottom = chatContainer.scrollHeight - chatContainer.clientHeight <= chatContainer.scrollTop + chatContainer.clientHeight * (1 - scrollThreshold);
            if (isScrolledNearBottom) {
                chatContainer.scrollTop = chatContainer.scrollHeight - chatContainer.clientHeight;
            }
        }
    }, 200),

    writeChat: function (message) {
        const chatLine = $('<div></div>');
        const userInfo = $('<span></span>');
        chatLine.addClass('chat-line chat-line__message');
        chatLine.attr('data-user-id', message['user-id']);
        chatLine.attr('data-id', message.id);
        ProxyChat.wrapBadges(message).forEach(badge => {
            userInfo.append(badge);
        });
        userInfo.append(ProxyChat.wrapUsername(message));
        userInfo.append(message.action ? '<span>&nbsp;</span>' : '<span class="colon">: </span>');

        chatLine.append(userInfo);
        chatLine.append(ProxyChat.wrapMessage(message));
        ProxyChat.messages.push(chatLine.wrap('<div>').parent().html());
    },

    connect: function (channel) {
        if (ProxyChat.socket) ProxyChat.disconnect();
        ProxyChat.channel = channel.toLowerCase();

        ProxyChat.loadChannelData().then(() => {
            ProxyChat.log('Connecting to chat server...');
            ProxyChat.socket = new ReconnectingWebSocket('wss://irc-ws.chat.twitch.tv', 'irc', {reconnectInterval: 2000});

            ProxyChat.socket.onopen = function () {
                ProxyChat.log(`Connected to #${ProxyChat.channel}`);
                ProxyChat.socket.send('PASS pass\r\n');
                ProxyChat.socket.send(`NICK justinfan${Math.floor(Math.random() * 999999)}\r\n`);
                ProxyChat.socket.send('CAP REQ :twitch.tv/commands twitch.tv/tags\r\n');
                ProxyChat.socket.send(`JOIN #${ProxyChat.channel}\r\n`);
            };

            ProxyChat.socket.ontimeout = function () {
                ProxyChat.log('Connection timeout, reconnecting...');
            };
            ProxyChat.socket.onclose = function () {
                ProxyChat.log('Disconnected');
            };

            ProxyChat.socket.onmessage = function (data) {
                data.data.split('\r\n').forEach(line => {
                    if (!line) return;
                    const message = parseIRCMessage(line);

                    switch (message.command) {
                        case "PING":
                            ProxyChat.socket.send(`PONG :${message.source.nickname}`);
                            return;
                        case "JOIN":
                            ProxyChat.log(`Joined channel: ${ProxyChat.channel}`);
                            return;
                        case "CLEARMSG":
                            if (message['target-msg-id']) ProxyChat.clearMessage(message['target-msg-id']);
                            return;
                        case "CLEARCHAT":
                            if (message['target-user-id']) ProxyChat.clearAllMessages(message['target-user-id']);
                            return;
                        case "PRIVMSG":
                            if (message.channel.toLowerCase() !== ProxyChat.channel || !message.msg) return;
                            ProxyChat.writeChat(message);
                            return;
                    }
                });
            };
        });
    },

    disconnect: function () {
        if (ProxyChat.socket) {
            ProxyChat.socket.close();
            ProxyChat.socket = null;
        }
    }
}