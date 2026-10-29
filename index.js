import express from 'express'
import { MongoClient, ObjectId } from 'mongodb'
import 'dotenv/config'
import cors from 'cors'
import { createRemoteJWKSet, jwtVerify } from 'jose'

const client = new MongoClient(process.env.MONGODB_URI)

export async function connectToMongoDB() {
  try {
    await client.connect()
    console.log('You successfully connected to MongoDB!')
    return client
  } catch (err) {
    console.dir(err)
  }
}

const mongoClient = await connectToMongoDB()

const db = mongoClient.db('wanderlast')
const destinationcollection = db.collection('destination')
const bookingcollection = db.collection('bookings')

const app = express()
const port = process.env.PORT || 5000

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://wanderlast-client-nine.vercel.app',
    ],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)
app.use(express.json())

const verifyapi = async (req, res, next) => {
  const authheader = req.headers.authorization

  if (!authheader) {
    return res.status(401).send({ msg: 'unauthorized' })
  }

  const token = authheader.split(' ')[1]
  if (!token) {
    return res.status(401).send({ msg: 'unauthorized' })
  }

  const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
  )

  try {
    await jwtVerify(token, JWKS)
    next()
  } catch (error) {
    return res.status(401).send({ msg: 'unauthorized' })
  }
}

const buildQuery = (id) =>
  /^[a-f\d]{24}$/i.test(id) ? { _id: new ObjectId(id) } : { id }

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/destinations', async (req, res) => {
  const result = await destinationcollection.find().toArray()
  res.send(result)
})

app.get('/destinations/:id', verifyapi, async (req, res) => {
  const { id } = req.params
  const result = await destinationcollection.findOne(buildQuery(id))
  res.send(result)
})

app.patch('/destinations/:id', async (req, res) => {
  const { id } = req.params
  const data = req.body
  delete data.id
  const result = await destinationcollection.updateOne(buildQuery(id), {
    $set: data,
  })
  res.send(result)
})

app.post('/add-destination', async (req, res) => {
  const data = req.body
  const result = await destinationcollection.insertOne(data)
  res.send(result)
})

app.post('/destination', async (req, res) => {
  const data = req.body
  const result = await bookingcollection.insertOne(data)
  res.send(result)
})

app.get('/my-bookings/:email', async (req, res) => {
  const { email } = req.params
  const result = await bookingcollection.find({ email }).toArray()
  res.send(result)
})

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`SERVER IS RUNNING ON ${port}`)
  })
}

export default app