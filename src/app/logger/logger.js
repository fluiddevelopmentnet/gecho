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