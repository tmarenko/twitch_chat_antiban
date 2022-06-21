const utils = require('./utils')
const locators = require('./locators')
const {Builder, Browser, By, until, Capabilities} = require('selenium-webdriver');
const chromium = require("selenium-webdriver/chrome");
const mlog = require('mocha-logger')

const SELENIUM_TIMEOUT = 60 * 1000;
const TESTS_TIMEOUT = 900 * 1000;
const EXTENSION_NAME = 'chrome.ctx';
const twitchUser = process.env.TWITCH_BANNED_USER_NAME;
const twitchPassword = process.env.TWITCH_BANNED_USER_PASSWORD;
const twitchNonBannedChannel = process.env.TWITCH_NON_BANNED_CHANNEL;
const twitchBannedChannel = process.env.TWITCH_BANNED_CHANNEL;
require('fs').mkdir('output', {recursive: true}, (err) => {
    if (err) throw err;
});


describe('Test released extension from Chrome Store', function () {
    let driver;
    this.timeout(TESTS_TIMEOUT);

    before(async () => {
        await utils.packChromeExtension('./src', EXTENSION_NAME);
        let caps = Capabilities.chrome();
        caps.set('selenoid:options', {'enableVNC': true, 'sessionTimeout': '15m'});
        let options = new chromium.Options();
        options.addExtensions(`./output/${EXTENSION_NAME}`);
        mlog.log(`Starting Chrome browser at ${process.env.SELENIUM_REMOTE_URL}`)
        driver = new Builder()
            .forBrowser(Browser.CHROME)
            .withCapabilities(caps)
            .setChromeOptions(options)
            .usingServer(process.env.SELENIUM_REMOTE_URL)
            .build();
        await driver.sleep(5000);
        await driver.manage().setTimeouts({
            implicit: 10 * 1000,
            pageLoad: SELENIUM_TIMEOUT,
            script: SELENIUM_TIMEOUT
        });
        await driver.manage().window().maximize();
        await utils.openTwitch(driver);
        await utils.loginToTwitch(driver, twitchUser, twitchPassword);
    })

    it('should be able to see non banned chat', async () => {
        await utils.openChat(driver, twitchNonBannedChannel);
        await driver.wait(until.elementIsNotPresent(By.xpath(locators.CHAT_BANNED_MSG)));
        mlog.log('Message "You are banned from Chat" is not present');
    })

    it('should be able to see usual banned chat', async () => {
        await utils.openChat(driver, twitchBannedChannel);
        await driver.wait(until.elementLocated(By.xpath(locators.CHAT_BANNED_MSG)));
        mlog.log('Located "You are banned from Chat" message');
    })

    it('should be able to see chat with extension', async () => {
        await utils.openChat(driver, twitchBannedChannel);
        await driver.wait(until.elementLocated(By.xpath(locators.PROXY_CHAT)));
        mlog.log('Located proxy chat from extension');
        let chatFrame = await driver.findElement(By.xpath(locators.PROXY_CHAT));
        await driver.switchTo().frame(chatFrame);
        await driver.wait(until.elementLocated(By.xpath(locators.PROXY_CHAT_CONNECTED)));
        mlog.log('Proxy chat successfully connected');
    })

    afterEach(async () => {
        if (this.currentTest && this.currentTest.isFailed()) {
            const fileName = encodeURIComponent(this.currentTest.title.replace(/\s+/g, '-'));
            await utils.saveScreenshot(driver, fileName);
        }
    })

    after(async () => {
        await driver.quit();
    })
})
