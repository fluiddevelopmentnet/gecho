import env from '../../../config.js';
import fs from "fs"
import { log } from '../../logger/logger.js';

const root = env.REPO_FOLDER_PATH || `${process.cwd()}/.repo`

function createLogFolderIfNotThere(){
    if(!fs.existsSync(root)){
        fs.mkdirSync(root)
    }
}

export function initRepoFolder(){
    createLogFolderIfNotThere(root)
}

export function initRepo(repo_name, admin_user){
    try {
        fs.mkdirSync(`${root}/${repo_name}`)
        log("info",`repo: ${repo_name} was created.`)
    } catch (err) {
        log("warning","cannot create repo: "+repo_name)
    }

    fs.writeFileSync(`${root}/${repo_name}/meta.json`,JSON.stringify({
        admin: admin_user
    }))

    fs.mkdirSync(`${root}/${repo_name}/history`)
    fs.mkdirSync(`${root}/${repo_name}/cache`)
}

export function deleteRepo(repo_name){
    try {
        fs.rmSync(`${root}/${repo_name}`, { recursive: true, force: true });
        log("info","Successfully removed repo")
    } catch (err) {
        log("warning","failed to remove repo")
    }
}