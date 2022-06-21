const locators = require('./locators')
const {until, By, Condition} = require("selenium-webdriver");
const mlog = require('mocha-logger');

module.exports = {
    openTwitch: openTwitch,
    loginToTwitch: loginToTwitch,
    openChat: openChat,
    packChromeExtension: packChromeExtension,
    saveScreenshot: saveScreenshot
}

until.elementIsNotPresent = function elementIsNotPresent(locator) {
    return new Condition('for no element to be located ' + locator, function (driver) {
        return driver.findElements(locator).then(function (elements) {
            return elements.length === 0;
        });
    });
};

function getTwoFactorCode() {
    return require('otplib').authenticator.generate(process.env.TWITCH_2FA_SECRET);
}

async function packChromeExtension(path, extensionName) {
    const NodeRSA = require('node-rsa');
    const ChromeExtension = require('crx');
    const crx = new ChromeExtension({privateKey: new NodeRSA({b: 512}).exportKey()});
    await crx.load(path);
    let crxBuffer = await crx.pack();
    mlog.log(`Exporting packed extension as "${extensionName}"`);
    await require('fs').promises.writeFile(`./output/${extensionName}`, crxBuffer);
}

async function openTwitch(driver) {
    mlog.log('Opening Twitch site');
    await driver.get('https://www.twitch.tv/');
    mlog.log('Waiting until "Log in" button is loaded');
    await driver.wait(until.elementLocated(By.xpath(locators.LOGIN_BUTTON)));
}

async function loginToTwitch(driver, username, password) {
    await driver.findElement(By.xpath(locators.LOGIN_BUTTON)).click();
    mlog.log('Waiting until "Log in" form is loaded');
    await driver.wait(until.elementLocated(By.xpath(locators.LOGIN_FORM)));
    mlog.log(`Logging in as ${username}/${password}`);
    await driver.findElement(By.xpath(locators.LOGIN_FORM_USERNAME_INPUT)).sendKeys(username);
    await driver.findElement(By.xpath(locators.LOGIN_FORM_PASSWORD_INPUT)).sendKeys(password);
    await driver.findElement(By.xpath(locators.LOGIN_SUBMIT_BUTTON)).click();
    await driver.wait(until.elementIsNotPresent(By.xpath(locators.LOGIN_SUBMIT_BUTTON)));
    await driver.wait(until.elementLocated(By.xpath(locators.TWO_FACTOR_INPUT)));
    mlog.log(`Sending 2FA code`);
    await driver.findElement(By.xpath(locators.TWO_FACTOR_INPUT)).sendKeys(getTwoFactorCode());
    await driver.findElement(By.xpath(locators.TWO_FACTOR_SUBMIT)).click();
    await driver.wait(until.elementLocated(By.xpath(locators.LOGGED_IN_AVATAR)));
    mlog.log("Logged in");
}

async function openChat(driver, channel) {
    mlog.log(`Opening chat for channel "${channel}"`)
    await driver.get(`https://www.twitch.tv/popout/${channel}/chat?popout=`);
    await driver.wait(until.elementLocated(By.xpath(locators.CHAT_SECTION)));
    await mlog.log("Chat is opened");
}

async function saveScreenshot(driver, fileName) {
    const image = await driver.takeScreenshot();
    await require('fs').promises.writeFile(`./output/${fileName}.png`, image, 'base64');
}