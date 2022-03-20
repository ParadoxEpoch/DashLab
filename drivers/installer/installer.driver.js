const {spawn} = require("child_process");
const {shellExec} = require('../../common');
const fs = require('fs-extra');

// Lists all DietPi optimised software
// Returns array of JSON objects with metadata for each app
const listApps = async function() {

    function ansiRegex({onlyFirst = false} = {}) {
        const pattern = [
            '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
            '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))'
        ].join('|');
    
        return new RegExp(pattern, onlyFirst ? undefined : 'g');
    }

    const result = await new Promise(async function(resolve, reject) {
        const script = spawn('sudo', ['/boot/dietpi/dietpi-software', 'list']);
        script.stdout.setEncoding('utf8');

        var result = '';
        script.stdout.on('data', data => result += data.toString());
        script.on('close', exitCode => resolve(result.replace(ansiRegex(), '')));
    });

    const splitResult = result.split('\n');

    const appList = [];
    splitResult.forEach(line => {

        if (!line.includes('ID ')) return;

        const lineArr = line.replace(' | | ', ' |  | ').split(' | ');

        if (lineArr.length < 2) return;

        const appMeta = {
            id: lineArr[0].replace('ID ', ''),
            name: lineArr[2].split(/: (.*)/s)[0],
            description: lineArr[2].split(/: (.*)/s)[1],
            status: lineArr[1].replace('=', ''),
            isInstalled: lineArr[1] === '=2'
            //dependencies: lineArr[3].split('+')
        }

        appList.push(appMeta);
    });

    return appList;

}
exports.listApps = listApps;

// Lists only currently installed DietPi optimised software
exports.listInstalled = async function() {

    const allApps = await listApps();

    const installedApps = allApps.filter(app => app.isInstalled);

    return installedApps;

}

// Lists only currently uninstalled DietPi optimised software
exports.listNotInstalled = async function() {

    const allApps = await listApps();

    const notInstalledApps = allApps.filter(app => !app.isInstalled);

    return notInstalledApps;

}

exports.install = async function(appId) {
    await shellExec('sudo', ['/boot/dietpi/dietpi-software', 'install', appId])
}

exports.uninstall = async function(appId) {
    await shellExec('sudo', ['/boot/dietpi/dietpi-software', 'uninstall', appId])
}

// Lists only currently installed DietPi optimised software - OLD
/* exports.listInstalled = async function() {

    const result = fs.readFileSync('/boot/dietpi/.installed', 'utf8');
    const splitResult = result.split('\n');

    const installedNums = [];
    splitResult.forEach(line => {
        if (!line.includes('aSOFTWARE_INSTALL_STATE') || !line.includes(']=2')) return;
        installedNums.push(line.replace('aSOFTWARE_INSTALL_STATE[','').replace(']=2',''));
    })

    console.log(installedNums);

    // 'aSOFTWARE_INSTALL_STATE[x]=2'

    return installedNums;

} */