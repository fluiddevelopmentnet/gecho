import fs from 'fs'
import env from '../../../config.js'

const LOG_REGISTER_PATH = env.LOG_REGISTER_PATH || `${process.cwd()}/log_register.json`
const USER_REGISTER_PATH = env.USER_REGISTER_PATH || `${process.cwd()}/user_register.json`

export function initializeRegisterFiles(){
    if(!fs.existsSync(LOG_REGISTER_PATH)) fs.writeFileSync(LOG_REGISTER_PATH,"{}")
    if(!fs.existsSync(USER_REGISTER_PATH)) fs.writeFileSync(USER_REGISTER_PATH,"{}")
}

export function readJSONFile(filename){
    return JSON.parse(fs.readFileSync(filename, "utf-8"))
}

export function writeJSONFile(filename, data){
    return fs.writeFileSync(filename, JSON.stringify(data))
}

export function registerCheck(key){
    return readJSONFile(LOG_REGISTER_PATH)[key] || null
}

export function registerAdd(key, value){
    const data = readJSONFile(LOG_REGISTER_PATH)
    data[key] = value;

    writeJSONFile(LOG_REGISTER_PATH, data)
}

export function registerRemove(key){
    const data = readJSONFile(LOG_REGISTER_PATH)
    delete data[key]

    writeJSONFile(LOG_REGISTER_PATH, data)
}

export function registerCheckCreds(username, password){
    if (readJSONFile(USER_REGISTER_PATH)[username]===password) return true;

    return false;
}
