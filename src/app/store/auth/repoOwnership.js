import { readJSONFile } from "./readFromUserRegister.js";
import env from "../../../config.js";

const root = env.REPO_FOLDER_PATH || `${process.cwd()}/.repo`


export function getRepoRole(repo_name, username){
    return readJSONFile(`${root}/${repo_name}`)[username] // "admin" / "contributer" / "visitor"
}