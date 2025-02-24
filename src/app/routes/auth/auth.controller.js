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