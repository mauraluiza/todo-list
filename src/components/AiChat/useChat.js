import { useState, useCallback } from 'react'

export const useChat = (todos = [], userToken = null, onTasksChanged = () => { }) => {
    const [messages, setMessages] = useState([
        { id: '1', role: 'assistant', content: 'Olá! Sou seu assistente virtual. Como posso ajudar com suas tarefas hoje?' }
    ])
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    const toggleChat = () => setIsOpen(prev => !prev)

    // Function: Send Message to AI
    const sendMessage = useCallback(async (content) => {
        if (!content.trim()) return

        // 1. Add User Message Locally
        const userMsg = {
            id: Date.now().toString(),
            role: 'user',
            content
        }

        // We use functional update to be safe, but for the API payload we need the current list.
        // Since 'messages' is in dependency, we can use it.
        const newHistory = [...messages, { role: 'user', content }]

        setMessages(prev => [...prev, userMsg])
        setIsLoading(true)

        // Simplify tasks for context (save tokens)
        const tasksContext = todos.map(t => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            status: t.status,
            organization_id: t.organization_id // Required for backend to infer List Scope (Personal vs Org)
        }))

        try {
            // 2. Call the Backend API
            const response = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: newHistory.map(m => ({ role: m.role, content: m.content })),
                    tasks: tasksContext, // Use tasksContext (was simplified above)
                    userToken
                })
            })

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`)
            }

            const data = await response.json()

            // 3. Add AI Response
            if (data.reply) {
                const aiMsg = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.reply
                }
                setMessages(prev => [...prev, aiMsg])

                // Trigger Refresh if Action was Successful
                if (data.success && onTasksChanged) {
                    onTasksChanged()
                }
            }
        } catch (error) {
            console.error('Chat Error:', error)
            const errorMsg = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Desculpe, não consegui conectar ao servidor de IA. Verifique se o servidor backend está rodando.'
            }
            setMessages(prev => [...prev, errorMsg])
        } finally {
            setIsLoading(false)
        }

    }, [messages, todos, userToken])

    return {
        messages,
        sendMessage,
        isLoading,
        isOpen,
        toggleChat
    }
}
