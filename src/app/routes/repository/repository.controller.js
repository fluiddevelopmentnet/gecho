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