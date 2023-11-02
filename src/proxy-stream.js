ProxyStream = {

    clientId: "%CLIENTID%",
    channel: null,

    getAccessToken: async function (channel) {
        const body = {
            operationName: "PlaybackAccessToken",
            extensions: {
                persistedQuery: {
                    version: 1,
                    sha256Hash: "0828119ded1c13477966434e15800ff57ddacf13ba1911c129dc2200705b0712"
                }
            },
            variables: {
                isLive: true,
                login: channel,
                isVod: false,
                vodID: "",
                playerType: "embed"
            }
        };

        const data = await fetchJson('https://gql.twitch.tv/gql', 'POST', {
            'Client-id': ProxyStream.clientId,
            'Content-Type': 'application/json'
        }, JSON.stringify(body));

        return data?.data?.streamPlaybackAccessToken ?? null;
    },

    getPlaylist: async function (channel, accessToken) {
        const url = `https://usher.ttvnw.net/api/channel/hls/${channel}.m3u8?client_id=${ProxyStream.clientId}&token=${accessToken.value}&sig=${accessToken.signature}&allow_source=true&allow_audio_only=true`;

        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            return await response.text();
        } catch (error) {
            console.log(`'Twitch Anti-Ban: unable to fetch from ${url}: ${error}`);
            return null;
        }
    },

    convertToPlaylistBlob: function (playlist) {
        const blob = new Blob([playlist], {type: 'application/vnd.apple.mpegurl'});
        return URL.createObjectURL(blob);
    },

    getStreamPlaylist: function (channel) {
        return ProxyStream.getAccessToken(channel)
            .then(accessToken => ProxyStream.getPlaylist(channel, accessToken))
            .then(playlist => ProxyStream.convertToPlaylistBlob(playlist));
    },

    restoreOriginalPlayer: function () {
        let streamContainer = $('[data-a-target="video-player"]');
        streamContainer.css("display", "block");
        $('#proxy-stream').remove();
        ProxyStream.channel = null;
    },

    initStream: function (channel) {
        ProxyStream.channel = channel;
        let proxyStream = $(`<div id="proxy-stream"><video id="proxy-stream-player" controls></video></div>`);
        let streamContainer = $('[data-a-target="video-player"]');
        streamContainer.css("display", "none");
        streamContainer.parent().append(proxyStream);

        if (Hls.isSupported()) {
            let video = document.getElementById('proxy-stream-player');
            let hls = new Hls();
            ProxyStream.getStreamPlaylist(channel).then(function (playlist) {
                hls.loadSource(playlist);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, function () {
                    video.play();
                });

                hls.on(Hls.Events.ERROR, function (event, data) {
                    if (event && data) {
                        console.log('Twitch Anti-Ban:', event, data);
                    }
                });
            });
        } else {
            ProxyChat.log('Unable to initialize stream player. HLS is not supported in this browser.');
        }
    },
}