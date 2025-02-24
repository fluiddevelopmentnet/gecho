import { Router } from 'express';
import auth from './auth/auth.controller.js'
import repository from './repository/repository.controller.js'

const api = Router()
    .use(auth)
    .use(repository)


export default api;