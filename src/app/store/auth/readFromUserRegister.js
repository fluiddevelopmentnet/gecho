import fs from 'fs'
import env from '../../../config.js'

export function readJSONFile(filename){
    return JSON.parse(fs.readFileSync(filename, "utf-8"))
}

export function writeJSONFile(filename, data){
    return fs.writeFileSync(filename, JSON.stringify(data))
}

export function registerCheck(key){
    return readJSONFile(env.LOG_REGISTER_PATH)[key] || null
}

export function registerAdd(key, value){
    const data = readJSONFile(env.LOG_REGISTER_PATH)
    data[key] = value;

    writeJSONFile(env.LOG_REGISTER_PATH, data)
}

export function registerRemove(key){
    const data = readJSONFile(env.LOG_REGISTER_PATH)
    delete data[key]

    writeJSONFile(env.LOG_REGISTER_PATH, data)
}

export function registerCheckCreds(username, password){
    if (readJSONFile(env.USER_REGISTER_PATH)[username]===password) return true;

    return false;
}
