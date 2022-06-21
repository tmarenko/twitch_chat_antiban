const LOGIN_BUTTON = '//button[contains(@data-test-selector, "login-button")]';
const LOGIN_FORM = '//div[contains(@data-a-target, "passport-modal")]//form';
const LOGIN_FORM_USERNAME_INPUT = `${LOGIN_FORM}//div[contains(@data-a-target, "login-username-input")]//input`;
const LOGIN_FORM_PASSWORD_INPUT = `${LOGIN_FORM}//div[contains(@data-a-target, "login-password-input")]//input`;
const LOGIN_SUBMIT_BUTTON = `${LOGIN_FORM}//button[contains(@data-a-target, "passport-login-button")]`;
const TWO_FACTOR_INPUT = '//input[@data-a-target="tw-input" and @type="text"]';
const TWO_FACTOR_SUBMIT = '//button[@target="submit_button"]'
const LOGGED_IN_AVATAR = '//*[@data-a-target="top-nav-avatar"]';
const CHAT_SECTION = '//section[contains(@data-test-selector, "chat-room")]'
const CHAT_BANNED_MSG = '//p[@data-test-selector="current-user-banned-text"]'
const PROXY_CHAT = '//iframe[@id="proxy_chat"]'
const PROXY_CHAT_CONNECTED = '//div[@class="chat_line"]/span[contains(text(), "Joined channel")]'

module.exports = {
    LOGIN_BUTTON: LOGIN_BUTTON,
    LOGIN_FORM: LOGIN_FORM,
    LOGIN_FORM_USERNAME_INPUT: LOGIN_FORM_USERNAME_INPUT,
    LOGIN_FORM_PASSWORD_INPUT: LOGIN_FORM_PASSWORD_INPUT,
    LOGIN_SUBMIT_BUTTON: LOGIN_SUBMIT_BUTTON,
    TWO_FACTOR_INPUT: TWO_FACTOR_INPUT,
    TWO_FACTOR_SUBMIT: TWO_FACTOR_SUBMIT,
    LOGGED_IN_AVATAR: LOGGED_IN_AVATAR,
    CHAT_SECTION: CHAT_SECTION,
    CHAT_BANNED_MSG: CHAT_BANNED_MSG,
    PROXY_CHAT: PROXY_CHAT,
    PROXY_CHAT_CONNECTED: PROXY_CHAT_CONNECTED
}
