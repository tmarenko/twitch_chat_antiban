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

$(document).ready(() => {
    window.setInterval(function () {
        if (isBanned() && !exists('#proxy-chat')) {
            console.log("Loading proxy chat");
            let channel = (location.href.indexOf('popout') > -1) ? location.href.split('/')[4] : location.href.split('/')[3];
            let proxyChat = `<div id="proxy-chat"></div>`;
            let chatContainer = $('.chat-room__content').children().first();
            chatContainer.removeClass();
            chatContainer.addClass("chat-list--default");
            chatContainer.html(proxyChat);
            ProxyChat.connect(channel);
        }
    }, 3000);
});
