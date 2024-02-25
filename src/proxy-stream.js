ProxyStream = {

    channel: null,

    getPlaylist: async function (channel,) {
        const url = `https://%APIURL%/getTwitchPlaylist?channel=${channel}`;

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
        return ProxyStream.getPlaylist(channel)
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