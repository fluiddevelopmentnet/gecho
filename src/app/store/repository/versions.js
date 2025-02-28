import env from "../../../config"
import fs from "fs"
import { getDiff } from "../../zipWrapper/getDiff"

const root = env.REPO_FOLDER_PATH || `${process.cwd()}/.repo`

export function readVersionFile(repo_id, version_id){
    return fs.readFileSync(`${root}/${repo_id}/history/${version_id}.version.json`)
}

export function readVersionFileZip(repo_id, version_id){
    return fs.readFileSync(getZipVersionPath(repo_id, version_id))
}

export function createVersionFile(repo_id, new_version_id, old_version_id, contributor){
    return fs.writeFileSync(`${root}/${repo_id}/history/${new_version_id}.version.json`,JSON.stringify({
        contributor: contributor,
        parents: [old_version_id],
        changes: getDiff(new_version_id, old_version_id)
    }))
}

export function createMergedVersionFile(repo_id, version_id, branch_version_id, new_version_id, contributor){
    return fs.writeFileSync(`${root}/${repo_id}/history/${new_version_id}.version.json`,JSON.stringify({
        contributor: contributor,
        parents: [version_id, branch_version_id],
        merged: true
    }))
}

export function getParent(repo_id, version_id){
    return JSON.parse(fs.readFileSync(`${root}/${repo_id}/history/${version_id}.version.json`))["parents"]
}

export function createInitialVersionFile(repo_id, new_version_id, contributor){
    return fs.writeFileSync(`${root}/${repo_id}/history/${new_version_id}.version.json`,JSON.stringify({
        contributor: contributor,
        changes: getDiff(new_version_id, null),
        init: true
    }))
}

export function isVersionZipAvailable(repo_id, version_id){
    return fs.existsSync(getZipVersionPath(repo_id, version_id))
}

export function removeVersionZip(repo_id, version_id){
    fs.rmSync(getZipVersionPath(repo_id, version_id))
}

export function getZipVersionPath(repo_id, version_id){
    return `${root}/${repo_id}/cache/${version_id}.zip`
}

export function getVersionChangeChain(repo_id, version_id, stop_version_id){
    let result = []

    function getVersionChanges(rec_version_id){
        const version_object = JSON.parse(fs.readFileSync(`${root}/${repo_id}/history/${rec_version_id}.version.json`))
        result.push(version_object["changes"])
        if (version_object["merged"]===true|| version_object["init"]===true||rec_version_id===stop_version_id) {
            return {changes: result, base: rec_version_id};
        } else {
            getVersionChanges(version_object["parents"][0])
        }
    }

    getVersionChanges(version_id)
}

export function getBranchOrigin(repo_id, main_version_id, branch_version_id){

    let tmp_main_version_id = main_version_id;
    let tmp_branch_version_id = branch_version_id;

    while (tmp_branch_version_id !== tmp_main_version_id) {
        tmp_branch_version_id = getParent(repo_id, tmp_branch_version_id)[0]

        tmp_main_version_id = getParent(repo_id, tmp_main_version_id)[0]
    }

    return tmp_branch_version_id;
}