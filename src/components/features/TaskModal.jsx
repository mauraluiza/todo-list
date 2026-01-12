import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import RichTextEditor from './RichTextEditor'

export default function TaskModal({ isOpen, onClose, task, onSave, lists = [] }) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [selectedListId, setSelectedListId] = useState('none')

    useEffect(() => {
        if (task) {
            setTitle(task.title || '')
            setDescription(task.description || '')
            setSelectedListId(task.list_id || 'none')
        } else {
            setTitle('')
            setDescription('')
            // If creating a task and a list is pre-selected (passed via onSave usually in parent, but here we might want local state),
            // actually AppShell handles the default listId in 'handleCreateTask'. 
            // BUT UI should reflect it if possible. For now, let's default to 'none' or 'inbox'.
            // To make it perfect, we should accept a defaultListId prop. 
            // However, seeing as 'task' is null for new tasks, we can check if onSave logic handles it. 
            // Use 'none' as default for UI
            setSelectedListId('none')
        }
    }, [task, isOpen])

    const handleSave = () => {
        if (!title.trim()) return
        onSave({
            title,
            description,
            listId: selectedListId === 'none' ? null : selectedListId
        })
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-4 flex flex-col">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">Título</label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ex: Comprar mantimentos"
                                className="text-lg font-semibold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Pasta</label>
                            <Select value={selectedListId} onValueChange={setSelectedListId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma pasta" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Inbox (Sem pasta)</SelectItem>
                                    {lists.map(list => (
                                        <SelectItem key={list.id} value={list.id}>
                                            {list.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2 flex-1 flex flex-col min-h-0">
                        <label className="text-sm font-medium">Descrição</label>
                        <div className="flex-1 border rounded-md overflow-hidden flex flex-col">
                            <div className="flex-1 overflow-y-auto">
                                <RichTextEditor
                                    content={description}
                                    onChange={setDescription}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
