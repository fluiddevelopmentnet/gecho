// src/app/logger/logger.js
import { getTimestamp } from "../util/time.js";
import { logToFile } from "./logFile.js";

export function log(msgType, msg){
    if(![
        "info",
        "warning",
        "error"
    ].includes(msgType)) throw Error("Invalid message type");

    const log_string = `[${msgType}] ~ ${getTimestamp()} ~ ${msg}`

    console.log(log_string)

    logToFile(log_string)

    if(msgType=="error") process.exit(1)
}









// src/app/logger/logFile.js
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






//////////////////////////////////////////////// MAIN /////////////////////////////////////





// src/app/util/random.js
export function generateRandomKey(length){
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}









// src/app/util/time.js
export function getTimestamp(){
    return new Date().toISOString().replace(/[:.]/g, '-');
}









// src/app/util/ident.js
export function isValidIdentifier(ident){
    return !ident.includes(" ") ? true : false
}









// src/app/zipWrapper/generateVersionZip.js
import { getVersionChangeChain, getZipVersionPath } from "../store/repository/versions";

import AdmZip from "adm-zip"


function applyChangeChain(changeChain) {
    let fileSystem = {}; // In-memory file storage (filename -> content)

    for (const changeSet of changeChain) {
        for (const [file, change] of Object.entries(changeSet)) {
            if (change.type === "deleted") {
                delete fileSystem[file];
            } else if (change.type === "new") {
                fileSystem[file] = change.content;
            } else if (change.type === "modified") {
                if (fileSystem[file]) {
                    let fileLines = fileSystem[file].split("\n");

                    // Apply removals first (to avoid index shifts)
                    if (change.changes.remove) {
                        change.changes.remove.sort((a, b) => b - a); // Remove from end to start
                        change.changes.remove.forEach(lineNum => {
                            if (lineNum < fileLines.length) {
                                fileLines.splice(lineNum, 1);
                            }
                        });
                    }

                    // Apply additions
                    if (change.changes.add) {
                        change.changes.add.forEach(addition => {
                            const lineNum = parseInt(Object.keys(addition)[0]);
                            const content = Object.values(addition)[0];
                            fileLines.splice(lineNum, 0, content);
                        });
                    }

                    // Save back the modified content
                    fileSystem[file] = fileLines.join("\n");
                }
            }
        }
    }

    return fileSystem;
}


function createZipFromFileSystem(fileSystem, outputZipPath) {
    const zip = new AdmZip();

    for (const [file, content] of Object.entries(fileSystem)) {
        zip.addFile(file, Buffer.from(content, "utf8"));
    }

    zip.writeZip(outputZipPath);
}







export function generateVersionZip(repo_id, version_id){
    const finalFileSystem = applyChangeChain(getVersionChangeChain(repo_id, version_id));
    createZipFromFileSystem(finalFileSystem, getZipVersionPath(repo_id, version_id));
}









// src/app/zipWrapper/getDiff.js
import AdmZip from "adm-zip"
import { diffLines } from "diff"
import { getZipVersionPath } from "../store/repository/versions";

function extractZipContents(zipPath) {
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();
    const files = {};

    zipEntries.forEach(entry => {
        if (!entry.isDirectory) {
            files[entry.entryName] = zip.readAsText(entry);
        }
    });

    return files;
}

export function getDiff(new_version_id, old_version_id) {
    let files1;

    if(old_version_id){
        files1 = extractZipContents(getZipVersionPath(old_version_id));
    }else{
        files1 = new AdmZip(new Buffer("")) // an empty zip
    }

    const files2 = extractZipContents(new_version_id);
    const allFiles = new Set([...Object.keys(files1), ...Object.keys(files2)]);
    const result = {};

    allFiles.forEach(file => {
        if (!(file in files1)) {
            result[file] = { type: "new", content: files2[file] }; // New file with content
        } else if (!(file in files2)) {
            result[file] = { type: "deleted" }; // Deleted file
        } else if (files1[file] !== files2[file]) {
            // File is modified, compute line diffs
            const diff = diffLines(files1[file], files2[file]);
            const changes = { add: [], remove: [] };

            let lineNumber = 0;
            diff.forEach(part => {
                if (part.added) {
                    part.value.split("\n").forEach((line, index) => {
                        if (line.trim() !== "") {
                            changes.add.push({ [lineNumber + index]: line });
                        }
                    });
                } else if (part.removed) {
                    part.value.split("\n").forEach((_, index) => {
                        changes.remove.push(lineNumber + index);
                    });
                }
                if (!part.removed) {
                    lineNumber += part.count;
                }
            });

            result[file] = { type: "modified", changes };
        }
    });

    return result;
}









// src/app/zipWrapper/generateMergedZip.js
import { getBranchOrigin, getVersionChangeChain } from "../store/repository/versions";

export function generateMergedZip(repo_id, version_id, branch_version_id, new_version_id){

    const main_changes = getVersionChangeChain(repo_id, version_id, getBranchOrigin(version_id))

    const branch_changes = getVersionChangeChain(repo_id, branch_version_id, getBranchOrigin(branch_version_id))

    

    // void -> create merged zip file -> {repo_id}/cache/{new_version_id}.zip
}









// src/app/routes/repository/repository.controller.js
import { Router } from 'express';
import { log } from '../../logger/logger.js'
import { initRepo, deleteRepo } from '../../store/repository/repo.js';
import { isValidIdentifier } from '../../util/ident.js';
import { registerCheck } from '../../store/auth/readFromUserRegister.js';
import { getRepoRole } from '../../store/auth/repoOwnership.js';

const router = Router();

router.get("/new/:repo_name",(req,res)=>{
    if (isValidIdentifier(req.params.repo_name)){
        initRepo(req.params.repo_name)
        res.status(200).send("Repo initialized")
    } else {
        log("warning","could not create repo: "+repo_name)
        res.status(500).send("could not initialize repo")
    }
})

router.get("/delete/:repo_name",(req,res)=>{
    if (getRepoRole(req.params.repo_name, registerCheck(req.body.key))) {
        deleteRepo(req.params.repo_name);
        log("info",`repo: ${req.params.repo_name} deleted.`)
        res.status(200).send("Repo deleted")
    } else {
        log("warning",`repo: ${req.params.repo_name} was tried to be deleted by ${registerCheck(req.body.key)}.`)
        res.status(500).send("could not delete repo")
    }

})

export default router;









// src/app/routes/auth/auth.controller.js
import { Router } from 'express';
import {registerAdd, registerCheck, registerRemove, registerCheckCreds, writeJSONFile } from "../../store/auth/readFromUserRegister.js"
import { generateRandomKey } from '../../util/random.js';
import { log } from '../../logger/logger.js'

const router = Router();


router.get("/login", (req,res) => {

    if(req.body.username == undefined | null || req.body.password == undefined | null) {
        log("warning", "No body attributes")
        return res.status(401).send("No body attributes")
    }

    if (registerCheckCreds(
            req.body.username,
            req.body.password
        )){
        
        const randomKey = generateRandomKey(20)

        registerAdd(randomKey, req.body.username)

        log("info", `${req.body.username} logged In`)

        return res.json({
            key: randomKey
        })
    } else {
        log("warning", `${req.body.username} attempted to log in`)

        return res.status(401).send("wrong creds")
    }

    
})

router.get("/logout", (req,res) => {
    registerRemove(req.body.key)

    log("info",`Session: ${req.body.key} no longer active`)
    return res.status(200).send("logged out...")
})

router.use((req,res,next)=>{
    if(!registerCheck(req.body.key)){
        log("warning",`tried to authenticate`)
        return res.status(401).send("Not Authorized")
    }else{
        log("info",`Action over session: ${req.body.key}`)
        next()
    }
})

export default router









// src/app/routes/body/body.controller.js
import { Router } from 'express';

import { registerCheck } from '../../store/auth/readFromUserRegister.js';
import { getRepoRole } from '../../store/auth/repoOwnership.js';

import { createMergedVersionFile, createVersionFile, getZipVersionPath, isVersionZipAvailable, readVersionFileZip, removeVersionZip } from '../../store/repository/versions.js';
import { addVersionToTree } from '../../store/repository/repo.js';
import { generateRandomKey } from '../../util/random.js';
import { generateVersionZip } from '../../zipWrapper/generateVersionZip.js';
import { generateMergedZip } from '../../zipWrapper/generateMergedZip.js';

const router = Router();


router.get("/fetch",(req,res)=>{
    if(getRepoRole(req.body.repo_id,registerCheck(req.body.key))){
        if(!isVersionZipAvailable(req.body.repo_id, req.body.version_id)){
            generateVersionZip(req.body.repo_id, req.body.version_id)
        }
        res.download(readVersionFileZip(req.body.repo_id, req.body.version_id))
    } else {
        res.status(401).send("Not permitted")
    }
})

router.get("/push",(req,res)=>{

    if(getRepoRole(req.body.repo_id,registerCheck(req.body.key))){
        const new_version_id = generateRandomKey(8);

        let inputZip = req.files.zipFile
        inputZip.name = `${req.body.version_id}.zip`
        inputZip.mv(getZipVersionPath(req.body.repo_id, req.body.version_id))
        createVersionFile(req.body.repo_id, new_version_id, req.body.version_id, registerCheck(req.body.key))


        // TODO: only if not from merge
        removeVersionZip(req.body.repo_id, req.body.version_id)

        const branchTitle = req.body.branch_title || null

        addVersionToTree(req.body.repo_id, req.body.version_id, new_version_id, branchTitle, req.body.comment)
    } else {
        res.status(401).send("Not permitted")
    }
})

router.get("/merge",(req,res)=>{
    if(getRepoRole(req.body.repo_id,registerCheck(req.body.key))){
        const new_version_id = generateRandomKey(8);

        createMergedVersionFile(req.body.repo_id, req.body.version_id, req.body.branch_version_id, new_version_id, registerCheck(req.body.key))
        generateMergedZip(req.body.repo_id, req.body.version_id, req.body.branch_version_id, new_version_id)

        removeVersionZip(req.body.repo_id, req.body.version_id)
        removeVersionZip(req.body.repo_id, req.body.version_id)

        addVersionToTree(req.body.repo_id, req.body.version_id, new_version_id, null, null, req.body.branch_version_id)
    } else {
        res.status(401).send("Not permitted")
    }
})

export default router;









// src/app/routes/routes.js
import { Router } from 'express';
import auth from './auth/auth.controller.js'
import repository from './repository/repository.controller.js'

const api = Router()
    .use(auth)
    .use(repository)


export default api;









// src/app/store/repository/versions.js
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









// src/app/store/repository/repo.js
import env from '../../../config.js';
import fs from "fs"
import { log } from '../../logger/logger.js';
import { generateRandomKey } from '../../util/random.js';

const root = env.REPO_FOLDER_PATH || `${process.cwd()}/.repo`

function createLogFolderIfNotThere(){
    if(!fs.existsSync(root)){
        fs.mkdirSync(root)
    }
}

export function readJSONFile(filename){
    return JSON.parse(fs.readFileSync(filename, "utf-8"))
}

export function writeJSONFile(filename, data){
    return fs.writeFileSync(filename, JSON.stringify(data))
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

export function addVersionToTree(repo_id, old_version_id, new_version_id, branch_title, comment, second_parent){
    let META = readJSONFile(`${root}/${repo_id}/meta.json`)
    
    META["version_tree"].push({
        id: new_version_id,
        parents: [old_version_id, second_parent],
        branch_title: branch_title,
        comment: comment
    })

    writeJSONFile(`${root}/${repo_id}/meta.json`,META)
}









// src/app/store/auth/readFromUserRegister.js
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










// src/app/store/auth/repoOwnership.js
import { readJSONFile } from "./readFromUserRegister.js";
import env from "../../../config.js";

const root = env.REPO_FOLDER_PATH || `${process.cwd()}/.repo`


export function getRepoRole(repo_name, username){
    return readJSONFile(`${root}/${repo_name}`)[username] // "admin" / "contributer" / "visitor"
}









// src/test/auth/main.test.js
import { readJSONFile, registerAdd, registerCheckCreds, writeJSONFile } from "../../app/store/readFromUserRegister.js";
import env from "../../config.js";

registerAdd("finn","4555553453njoiho")










// src/test/com/script.test.js










// src/config.js
import dotenv from 'dotenv';
dotenv.config();

export default process.env;









// src/main.js
import express from 'express'
import cors from 'cors';
import routes from './app/routes/routes.js'
import { initializeLogfile } from './app/logger/logFile.js';
import { log } from './app/logger/logger.js'
import bodyParser from 'body-parser';
import env from './config.js';
import { initRepoFolder } from './app/store/repository/repo.js';
import { initializeRegisterFiles } from './app/store/auth/readFromUserRegister.js';
import fileUpload from 'express-fileupload';

initializeLogfile()
initRepoFolder()
initializeRegisterFiles()

const app = express();

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
}));

app.use(routes)

app.listen(env.PORT || 5000, log("info",`Server lsitening on ${env.PORT || 5000}`))