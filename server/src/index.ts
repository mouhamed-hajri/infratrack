import 'dotenv/config'
import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import issuesRouter from './routes/issues'
import authRouter from './routes/auth'
import municipalitiesRouter from './routes/municipalities'
import { loadBoundaries } from './geo'

const app = express()
app.use(cors())
app.use(express.json({ limit: '20mb' }))

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true })
})
app.use('/api/auth', authRouter)
app.use('/api/issues', issuesRouter)
app.use('/api/municipalities', municipalitiesRouter)

// JSON error handler (last middleware).
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'internal server error' })
})

const PORT = Number(process.env.PORT) || 4000

// Load jurisdiction boundaries before accepting requests.
loadBoundaries()
  .then(() => app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`)))
  .catch((e) => {
    console.error('Failed to load boundaries:', e)
    process.exit(1)
  })
