import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import RichTextEditor from './RichTextEditor'

export default function TaskModal({ isOpen, onClose, task, onSave }) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')

    useEffect(() => {
        if (task) {
            setTitle(task.title || '')
            setDescription(task.description || '')
        } else {
            setTitle('')
            setDescription('')
        }
    }, [task, isOpen])

    const handleSave = () => {
        if (!title.trim()) return
        onSave({ title, description })
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Título</label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Comprar mantimentos"
                            className="text-lg font-semibold"
                        />
                    </div>

                    <div className="space-y-2 flex-1 flex flex-col">
                        <label className="text-sm font-medium">Descrição</label>
                        <div className="flex-1 border rounded-md">
                            <RichTextEditor
                                content={description}
                                onChange={setDescription}
                            />
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
