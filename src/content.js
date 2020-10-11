$(document).ready(() => {
    window.setInterval(function () {
        if ($('#open-chat').length < 1 && $('#proxy_chat').length < 1) {
			let channel = (location.href.indexOf('popout') > -1) ? location.href.split('/')[4] : location.href.split('/')[3];
			let url = `https://nightdev.com/hosted/obschat/?theme=bttv_dark&channel=${channel}&fade=false&bot_activity=true&prevent_clipping=true`;
			let div_data = `<iframe name="proxy_chat" id="proxy_chat" src="${url}"  style="width: 100%;"></iframe>`;
			$('.chat-room__content .scrollable-area').html(div_data);
        }
    }, 250);
});