import { Sparkles, MessageCircle } from 'lucide-react'
import { Button } from '../ui/button'

export default function ChatButton({ onClick, isOpen }) {
    if (isOpen) return null // Hide button when window is open

    return (
        <Button
            onClick={onClick}
            size="icon"
            className={`
                fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-[49]
                bg-purple-600 hover:bg-purple-700 text-white
                transition-all duration-300 hover:scale-105 active:scale-95
                animate-in fade-in zoom-in duration-300
                ring-2 ring-purple-400/30
            `}
        >
            <Sparkles className="h-6 w-6" />
        </Button>
    )
}
