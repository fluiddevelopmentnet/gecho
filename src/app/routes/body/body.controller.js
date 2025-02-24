import { Router } from 'express';

import { registerCheck } from '../../store/auth/readFromUserRegister.js';
import { getRepoRole } from '../../store/auth/repoOwnership.js';

import { generateDistance } from '../../store/repository/getDistance.js';

const router = Router();


router.get("/fetch",(req,res)=>{
    if(getRepoRole(req.body.repo_id,registerCheck(req.body.key))){
        // return download zip file (if available)
        // else: return generateVersionZip
    } else {
        res.status(401).send("Not permitted")
    }
})

router.get("/push",(req,res)=>{
    const versionZip = req.files.version;

    const distance = generateDistance(req.files.version, req.body.repo_id, req.body.version_id)
    
    // generateDistance

    // add version file to history folder

    // (get branch attributes ????)

    // update version tree in meta file

    // delete old zip file (if not another branch)
    // rename new zipfile
    
})

router.get("/merge",(req,res)=>{
    // read from meta file

    // look for changed files in both branches
            // for A ++ for B
                // read meta file instance
                // push all changed files to a list
            // if A.filter(e => B.includes(E)).length() === 0
                // generate merge 
            // else
                // return error (non mergable files)

    // try
        // generate merged zip
    // catch
        // return file overlab

    // add version file to history folder

    // write updated meta file
})

export default router;