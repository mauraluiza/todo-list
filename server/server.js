import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { OpenAI } from 'openai'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: './.env' })

const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

// Configs
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) console.warn('WARNING: OPENAI_API_KEY is missing.')

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

// Rate Limiting
const userRateLimit = new Map()

// Supabase Setup helper
const getSupabase = (token) => {
    return createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        }
    )
}

const SYSTEM_PROMPT = `Você é um Agente de Organização de Tarefas (GTD).
SUA RESPOSTA DEVE SER SEMPRE UM JSON VÁLIDO.
NÃO RESPONDA COM TEXTO LIVRE, APENAS O JSON.

HABILIDADES PERMITIDAS:
1. organizar_tarefas_em_pastas
   - Use quando o usuário pedir para organizar, agrupar ou separar tarefas.
   - Analise as tarefas fornecidas no contexto.
   - Crie nomes de pastas lógicos e curtos (ex: "Trabalho", "Pessoal", "Urgente").
   - Agrupe IDs de tarefas nessas pastas.
2. sugerir_nova_pasta
   - Use quando o usuário pedir sugestão de organização mas não explicitamente para mover.
3. resumir_tarefa
   - Resuma o título/descrição.
4. reformatar_texto
   - Melhore a escrita da tarefa.

FORMATO DE RESPOSTA (JSON):
{
  "action": "NOME_DA_HABILIDADE", // ou "chat_simples" se não for ação
  "message": "Texto curto para o usuário (ex: 'Organizei suas tarefas')",
  "data": {
     // Para organizar_tarefas_em_pastas:
     "folders": [
       { "name": "Nome da Pasta", "task_ids": ["uuid1", "uuid2"] }
     ],
     // Para resumir/reformatar:
     "text": "Texto melhorado"
  }
}

Contexto das tarefas será fornecido. Use-o para decidir.
Se não puder fazer nada, retorne action: "chat_simples".`

// Intent Router & Caching
const INTENT_KEYWORDS = ['organizar', 'pasta', 'agrupar', 'resumir', 'melhorar', 'texto', 'ajuda', 'criar']
const GREETINGS = ['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'eai']

// --- ACTION HANDLER ---
async function agentActionHandler(actionPayload, userToken, contextTasks) {
    if (!actionPayload || !actionPayload.action) {
        return { success: false, message: "Ação inválida." }
    }

    const { action, data } = actionPayload
    console.log(`[ActionHandler] Executing: ${action}`)

    if (action === 'organizar_tarefas_em_pastas') {
        if (!userToken) return { success: false, message: "Login necessário para organizar tarefas." }
        if (!data || !data.folders) return { success: false, message: "Dados incompletos para organização." }

        const supabase = getSupabase(userToken)

        // Validation: Get User
        // We need the user ID for owner_id field in 'lists' table
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            console.error('[ActionHandler] Auth Error:', authError)
            return { success: false, message: "Erro de autenticação ao executar ação." }
        }

        // Context Inference (Org vs Personal) from the first task provided
        // This is critical because creating a list needs to know where it belongs.
        const referenceOrgId = contextTasks && contextTasks.length > 0 ? contextTasks[0].organization_id : null

        let movedCount = 0
        let createdLists = 0
        let errors = []

        for (const folder of data.folders) {
            // 1. Check if List Exists
            let query = supabase.from('lists').select('id').eq('title', folder.name)

            if (referenceOrgId) query = query.eq('organization_id', referenceOrgId)
            else query = query.is('organization_id', null)

            // Limit 1 to avoid data fetch overhead
            const { data: existingLists, error: searchError } = await query.limit(1)

            if (searchError) {
                console.error(`[ActionHandler] Error searching list ${folder.name}:`, searchError)
                continue
            }

            let listId
            if (existingLists && existingLists.length > 0) {
                listId = existingLists[0].id
            } else {
                // 2. Create List
                const payload = {
                    title: folder.name,
                    owner_id: user.id
                }
                if (referenceOrgId) payload.organization_id = referenceOrgId

                const { data: newList, error: createError } = await supabase
                    .from('lists')
                    .insert(payload)
                    .select()
                    .single()

                if (createError) {
                    console.error(`[ActionHandler] Error creating list ${folder.name}:`, createError)
                    errors.push(`Erro ao criar pasta: ${folder.name}`)
                    continue
                }
                listId = newList.id
                createdLists++
                console.log(`[ActionHandler] Created list: ${folder.name} (${listId})`)
            }

            // 3. Move Tasks
            if (folder.task_ids && folder.task_ids.length > 0) {
                const { error: moveError } = await supabase
                    .from('todos')
                    .update({ list_id: listId })
                    .in('id', folder.task_ids)

                if (moveError) {
                    console.error(`[ActionHandler] Error moving tasks to ${folder.name}:`, moveError)
                    errors.push(`Erro ao mover tarefas para: ${folder.name}`)
                } else {
                    movedCount += folder.task_ids.length
                }
            }
        }

        if (errors.length > 0 && movedCount === 0) {
            return { success: false, message: "Houve erros ao organizar suas tarefas." }
        }

        return {
            success: true,
            message: `Organizado! Criei ${createdLists} pastas e movi ${movedCount} tarefas.`
        }
    }

    // Default for non-executable actions (like chat_simples or read-only suggestions)
    return { success: true, message: actionPayload.message || "Processado." }
}


app.post('/api/chat', async (req, res) => {
    try {
        const { messages, tasks, userToken } = req.body

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid message format' })
        }

        // Rate Limit Check
        if (userToken) {
            const lastCall = userRateLimit.get(userToken)
            const now = Date.now()
            if (lastCall && now - lastCall < 3000) {
                return res.status(429).json({ reply: "Aguarde um momento..." })
            }
            userRateLimit.set(userToken, now)
        }

        const lastUserMessage = messages[messages.length - 1].content.toLowerCase()

        // --- Roteamento de Intenção ---
        const matchesIntent = INTENT_KEYWORDS.some(k => lastUserMessage.includes(k))
        const isGreeting = GREETINGS.some(g => lastUserMessage === g)

        if (!matchesIntent && isGreeting) {
            return res.json({ reply: "Olá! Posso ajudar a organizar suas tarefas, criar pastas ou resumir textos. O que gostaria?" })
        }

        console.log(`[Agent] Processing intent for: "${lastUserMessage.slice(0, 50)}..."`)

        let contextMsg = ""
        if (tasks && tasks.length > 0) {
            contextMsg = `\nTarefas Atuais (ID: [Prioridade] Título):\n${tasks.map(t => `- ${t.id}: [${t.priority || 'none'}] ${t.title}`).join('\n')}`
        }

        // Call OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: SYSTEM_PROMPT + contextMsg },
                ...messages
            ],
            temperature: 0.3,
            max_tokens: 300,
            response_format: { type: "json_object" }
        })

        const rawContent = completion.choices[0].message.content
        let responseJson
        try {
            responseJson = JSON.parse(rawContent)
        } catch (e) {
            console.error("Failed to parse JSON from AI", rawContent)
            return res.json({ reply: rawContent })
        }

        console.log("[Agent] Action Plan:", responseJson.action)

        // --- EXECUTE ACTION ---
        const executionResult = await agentActionHandler(responseJson, userToken, tasks)

        // Return final response (AI message + Execution confirmation if meaningful)
        // If execution provided a distinct message (like "Moved X tasks"), use it.
        // Otherwise use AI's message.
        const finalReply = (executionResult.success && executionResult.message !== "Processado.")
            ? executionResult.message
            : responseJson.message

        res.json({
            reply: finalReply,
            debug_action: responseJson.action,
            success: executionResult.success
        })

    } catch (error) {
        console.error('[Agent Error]', error)
        res.status(500).json({ reply: "Desculpe, tive um problema temporário." })
    }
})

app.listen(port, () => {
    console.log(`\n✨ Agent Server running on http://localhost:${port}`)
})
