import express from 'express'
import { AuctionController } from '../controllers/auction.controller'

const auctionRouter = express.Router()

auctionRouter.route('/create').post((req, res) => new AuctionController().create(req, res))
auctionRouter.route('/open').get((req, res) => new AuctionController().getOpen(req, res))
auctionRouter.route('/bid').post((req, res) => new AuctionController().bid(req, res))
auctionRouter.route('/report/:id').get((req, res) => new AuctionController().report(req, res))
auctionRouter.route('/byClient/:id').get((req, res) => new AuctionController().getByClient(req, res))

export default auctionRouter
