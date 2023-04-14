function exists(selector) {
    return $(selector).length > 0;
}

function isBanned() {
    return [
        '[data-test-selector="banned-user-message"]',
        '[data-test-selector="request-unban-link"]',
        '[data-test-selector="cooldown-text"]',
        '.banned-chat-overlay__halt',
        '.banned-chat-overlay__circle'
    ].some(exists);
}

$(function () {
    window.setInterval(function () {
        if (isBanned() && !exists('#proxy-chat')) {
            console.log("Twitch Chat Anti-Ban: loading proxy chat");
            let channel = location.pathname.split('/').filter(segment => segment !== 'popout' && segment !== 'chat' && segment !== '').pop();
            ProxyChat.initChat();
            ProxyChat.connect(channel);
        }
    }, 3000);
})
