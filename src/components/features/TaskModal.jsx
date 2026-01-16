import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import RichTextEditor from './RichTextEditor'
import { useOrganization } from '../../contexts/OrganizationProvider'
import { supabase } from '../../lib/supabase'
import { Check } from 'lucide-react'

export default function TaskModal({ isOpen, onClose, task, onSave, lists = [] }) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [selectedListId, setSelectedListId] = useState('none')
    const [priority, setPriority] = useState('none')

    // Organization / Participants Logic
    const { currentOrg } = useOrganization()
    const [availableMembers, setAvailableMembers] = useState([])
    const [participants, setParticipants] = useState([]) // Array of User IDs
    const [showParticipants, setShowParticipants] = useState(false)

    useEffect(() => {
        if (currentOrg && isOpen) {
            // Fetch potential participants
            const fetchMembers = async () => {
                const { data, error } = await supabase
                    .from('organization_members')
                    .select('user_id, profile:profiles(full_name, email)')
                    .eq('organization_id', currentOrg.id)

                if (error) {
                    console.error('TaskModal: Error fetching members:', error)
                } else {
                    console.log('TaskModal: Fetched members:', data)
                    if (data) {
                        setAvailableMembers(data.map(m => ({
                            id: m.user_id,
                            label: m.profile?.full_name || m.profile?.email || 'Usuário'
                        })))
                    }
                }
            }
            fetchMembers()
            setShowParticipants(true)
        } else {
            setShowParticipants(false)
            setAvailableMembers([])
        }
    }, [currentOrg, isOpen])

    const toggleParticipant = (userId) => {
        setParticipants(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    useEffect(() => {
        if (task) {
            setTitle(task.title || '')
            setDescription(task.description || '')
            setSelectedListId(task.list_id || 'none')
            setPriority(task.priority || 'none')
            setParticipants([]) // Not supporting edit participants yet for MVP
        } else {
            setTitle('')
            setDescription('')
            setSelectedListId('none')
            setPriority('none')
            setParticipants([])
        }
    }, [task, isOpen])

    const handleSave = () => {
        if (!title.trim()) return
        onSave({
            title,
            description,
            listId: selectedListId === 'none' ? null : selectedListId,
            priority,
            participants // Pass participants for Create logic
        })
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 p-6 flex flex-col">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Prioridade</label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a prioridade" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sem prioridade</SelectItem>
                                    <SelectItem value="low">Baixa</SelectItem>
                                    <SelectItem value="high">Urgente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Participants Section (Only New Tasks in Organization) */}
                    {!task && showParticipants && (
                        <div className="space-y-2 md:col-span-4 border-t pt-4">
                            <label className="text-sm font-medium block">Participantes</label>
                            <div className="flex flex-wrap gap-2">
                                {availableMembers.map(member => {
                                    const isSelected = participants.includes(member.id)
                                    return (
                                        <button
                                            key={member.id}
                                            onClick={() => toggleParticipant(member.id)}
                                            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs border transition-colors ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
                                        >
                                            <span>{member.label}</span>
                                            {isSelected && <Check className="h-3 w-3" />}
                                        </button>
                                    )
                                })}
                                {availableMembers.length === 0 && <span className="text-muted-foreground text-xs">Nenhum outro membro encontrado.</span>}
                            </div>
                        </div>
                    )}

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
        </Dialog >
    )
}
