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