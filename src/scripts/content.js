function exists(selector) {
    return $(selector).length > 0;
}

function isBanned() {
    return [
        '[data-test-selector="banned-user-message"]',
        '[data-test-selector="request-unban-link"]',
        '[data-test-selector="cooldown-text"]',
        '.banned-chat-overlay__halt',
        '.banned-chat-overlay__circle',
    ].some(exists);
}

function isStreamBanned() {
    return [
        '[data-a-target="player-overlay-content-gate"]',
        '.content-overlay-gate',
        '.content-overlay-icon',
        '.content-overlay-gate__content',
    ].some(exists);
}


function getChannel() {
    // support for embedded location
    const search = location.search.substring(1); // Remove the '?' at the start
    const params = search.split('&').reduce((acc, current) => {
        const [key, value] = current.split('=');
        acc[key] = value;
        return acc;
    }, {});

    if (params.channel) {
        return decodeURIComponent(params.channel);
    }

    // support for twitch.tv location
    return location.pathname.split('/').filter(
        segment => segment && segment !== 'popout' && segment !== 'chat' && segment !== 'embed'
    ).shift();
}


$(function () {
    window.setInterval(function () {
        if (isBanned() && !exists('#anti-ban-chat')) {
            console.log("Twitch Anti-Ban: loading proxy chat");
            ProxyChat.initChat();
            ProxyChat.connect(getChannel());
        }

        if (isStreamBanned() && !exists('#anti-ban-stream')) {
            console.log("Twitch Anti-Ban: loading proxy stream");
            ProxyStream.restoreOriginalPlayer();
            ProxyStream.initStream(getChannel());
        }

        if (ProxyStream.channel && ProxyStream.channel !== getChannel()) {
            console.log("Twitch Anti-Ban: restoring original player");
            ProxyStream.restoreOriginalPlayer();
        }
    }, 3000);
})
