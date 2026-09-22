import express, { Router } from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { env } from './config/env'
import { UPLOADS_DIR } from './config/upload'
import userRouter from './routes/user.routes'
import orderRouter from './routes/order.routes'
import productRouter from './routes/product.routes'
import categoryRouter from './routes/category.routes'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/uploads', express.static(UPLOADS_DIR))

mongoose.connect(env.mongoUri, { autoIndex: false })
const connection = mongoose.connection
connection.once('open', () => console.log('MongoDB connected'))
connection.on('error', (err) => console.log('MongoDB error:', err))

const router = Router()
router.get('/health', (req, res) => res.json({ status: 'ok' }))
router.use('/users', userRouter)
router.use('/orders', orderRouter)
router.use('/products', productRouter)
router.use('/categories', categoryRouter)
app.use('/', router)

app.listen(env.port, () => console.log(`Express running on port ${env.port}!`))
