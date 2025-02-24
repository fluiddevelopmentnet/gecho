import fs from 'fs'

import { getTimestamp } from '../util/time.js'

import env from '../../config.js';

const root = env.LOG_FOLDER_PATH || `${process.cwd()}/.log`
const logfilePath = `${root}/log-${getTimestamp()}.log`;

function createLogFolderIfNotThere(){
    if(!fs.existsSync(root)){
        fs.mkdirSync(root)
    }
}

export function initializeLogfile(){
    createLogFolderIfNotThere()

    fs.writeFileSync(logfilePath,`------------- LOG || ${getTimestamp()} -------------\n`)
}

export function logToFile(log_string){
    fs.writeFileSync(logfilePath,
        fs.readFileSync(logfilePath) + `${log_string}\n`
    )
}