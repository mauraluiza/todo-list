import { useChat } from './useChat'
import ChatButton from './ChatButton'
import ChatWindow from './ChatWindow'

export default function AiChat() {
    const { messages, sendMessage, isLoading, isOpen, toggleChat } = useChat()

    return (
        <>
            <ChatButton onClick={toggleChat} isOpen={isOpen} />
            {isOpen && (
                <ChatWindow
                    messages={messages}
                    onSendMessage={sendMessage}
                    isLoading={isLoading}
                    onClose={toggleChat}
                />
            )}
        </>
    )
}
