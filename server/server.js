import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { OpenAI } from 'openai'

// Load environment variables from the root .env file
dotenv.config({ path: './.env' })

const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

// Validate API Key
if (!process.env.OPENAI_API_KEY) {
    console.warn('WARNING: OPENAI_API_KEY is missing in .env file.')
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

const SYSTEM_PROMPT = `Você é um assistente dentro de um sistema de tarefas.
Responda de forma clara, objetiva e amigável.
Você pode ajudar a resumir e reformular textos.
Você NÃO pode executar ações no sistema.`

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body

        // Basic validation
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid format. "messages" array is required.' })
        }

        console.log(`[Chat API] Received ${messages.length} messages. Sending to OpenAI...`)

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Using 3.5-turbo for speed/cost, can be upgraded to gpt-4
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...messages
            ],
            temperature: 0.7,
            max_tokens: 500,
        })

        const reply = completion.choices[0].message.content

        console.log('[Chat API] Response received.')
        res.json({ reply })

    } catch (error) {
        console.error('[Chat API] Error:', error.message)

        // Handle specific OpenAI errors
        if (error.response) {
            console.error(error.response.status, error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: 'Internal Server Error', details: error.message })
        }
    }
})

app.listen(port, () => {
    console.log(`\n✨ AI Server running on http://localhost:${port}`)
    console.log(`➜ Endpoint: http://localhost:${port}/api/chat`)
})
