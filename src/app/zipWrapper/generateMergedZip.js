import { getVersionChangeChain } from "../store/repository/versions";

export function generateMergedZip(repo_id, version_id, branch_version_id, new_version_id){

    getVersionChangeChain()

    // void -> create merged zip file -> {repo_id}/cache/{new_version_id}.zip
}