import { useChat } from './useChat'
import ChatButton from './ChatButton'
import ChatWindow from './ChatWindow'

export default function AiChat({ todos, userToken, onTasksChanged }) {
    const { messages, sendMessage, isLoading, isOpen, toggleChat } = useChat(todos, userToken, onTasksChanged)

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
