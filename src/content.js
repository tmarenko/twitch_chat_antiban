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
            let url = `https://nightdev.com/hosted/obschat/?theme=bttv_dark&channel=${channel}&fade=false&bot_activity=true&prevent_clipping=true`;
            let div_data = `<iframe name="proxy-chat" id="proxy-chat" src="${url}"  style="width: 100%; height: 100%;"></iframe>`;
            let chat_el = $('.chat-room__content').children().first();
            chat_el.removeClass();
            chat_el.addClass("chat-list--default scrollable-area");
            chat_el.html(div_data);
        }
    }, 1000);
});
