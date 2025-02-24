import env from "../../../config"
import fs from "fs"

const root = env.REPO_FOLDER_PATH || `${process.cwd()}/.repo`

export function readVersionFile(repo_id, version_id){
    return fs.readFileSync(`${root}/${repo_id}/history/${version_id}.version`)
}

export function readVersionFileZip(repo_id, version_id){
    return fs.readFileSync(`${root}/${repo_id}/cache/${version_id}.zip`)
}

export function createVersionFile(repo_id, version_id, data){
    return fs.writeFileSync(`${root}/${repo_id}/history/${version_id}.version`,data)
}