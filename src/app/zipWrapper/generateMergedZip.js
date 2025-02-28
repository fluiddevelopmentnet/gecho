import { getBranchOrigin, getVersionChangeChain } from "../store/repository/versions";

export function generateMergedZip(repo_id, version_id, branch_version_id, new_version_id){

    const main_changes = getVersionChangeChain(repo_id, version_id, getBranchOrigin(version_id))

    const branch_changes = getVersionChangeChain(repo_id, branch_version_id, getBranchOrigin(branch_version_id))

    

    // void -> create merged zip file -> {repo_id}/cache/{new_version_id}.zip
}