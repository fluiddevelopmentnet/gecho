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