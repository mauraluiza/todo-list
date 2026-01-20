import { useRef, useEffect } from 'react'
import { Sparkles, Send, X, Minimize2, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

export default function ChatWindow({ messages, onSendMessage, isLoading, onClose }) {
    const inputRef = useRef(null)
    const scrollRef = useRef(null)

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isLoading])

    const handleSubmit = (e) => {
        e.preventDefault()
        const value = inputRef.current?.value
        if (value) {
            onSendMessage(value)
            inputRef.current.value = ''
        }
    }

    return (
        <div className="fixed bottom-0 right-4 w-80 md:w-96 flex flex-col bg-background/80 backdrop-blur-md border border-border/50 rounded-t-xl shadow-2xl overflow-hidden z-[50] animate-in slide-in-from-bottom duration-300 ring-1 ring-white/10 max-h-[70vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-primary/95 text-primary-foreground backdrop-blur-sm shadow-sm">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-200 fill-purple-200/20" />
                    <span className="font-semibold text-sm">Assistente IA</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <Minimize2 className="h-4 w-4" />
                    </button>
                    {/* Close totally could be added here if needed */}
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-background/50"
            >
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`
                                max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm
                                ${msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-br-none'
                                    : 'bg-muted/90 text-foreground border border-border/50 rounded-bl-none backdrop-blur-sm'
                                }
                            `}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-muted/50 rounded-2xl px-4 py-2 flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Pensando...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t bg-background/90 backdrop-blur-xl">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        ref={inputRef}
                        placeholder="Pergunte algo..."
                        className="flex-1 min-h-[40px] bg-background/50 border-muted-foreground/20 focus-visible:ring-primary/50"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading}
                        className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/90 shadow-sm"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    )
}
