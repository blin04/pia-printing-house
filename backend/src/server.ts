import express, { Router } from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { env } from './config/env'
import userRouter from './routes/user.routes'

const app = express()
app.use(cors())
app.use(express.json())

mongoose.connect(env.mongoUri, { autoIndex: false })
const connection = mongoose.connection
connection.once('open', () => console.log('MongoDB connected'))
connection.on('error', (err) => console.log('MongoDB error:', err))

const router = Router()
router.get('/health', (req, res) => res.json({ status: 'ok' }))
router.use('/users', userRouter)
app.use('/', router)

app.listen(env.port, () => console.log(`Express running on port ${env.port}!`))
