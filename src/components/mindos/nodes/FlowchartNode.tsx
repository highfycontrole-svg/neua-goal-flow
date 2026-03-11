import { memo, useState, useCallback, useRef } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  Megaphone, UserPlus, Leaf, Heart, 
  Globe, FileText, ShoppingCart, CreditCard,
  Instagram, Youtube, Facebook,
  Mail, MessageCircle, Bot, Users,
  Upload, GripVertical, Trash2, Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export const flowchartIcons: Record<string, { icon: any; label: string; color: string }> = {
  ad: { icon: Megaphone, label: 'Anúncio', color: '#ef4444' },
  signup: { icon: UserPlus, label: 'Inscrição', color: '#22c55e' },
  organic: { icon: Leaf, label: 'Orgânico', color: '#84cc16' },
  engagement: { icon: Heart, label: 'Engajamento', color: '#ec4899' },
  landing: { icon: Globe, label: 'Landing Page', color: '#3b82f6' },
  capture: { icon: FileText, label: 'Captura', color: '#6366f1' },
  site: { icon: Globe, label: 'Site', color: '#8b5cf6' },
  purchase: { icon: CreditCard, label: 'Compra', color: '#10b981' },
  cart: { icon: ShoppingCart, label: 'Carrinho', color: '#f59e0b' },
  instagram: { icon: Instagram, label: 'Instagram', color: '#e1306c' },
  youtube: { icon: Youtube, label: 'YouTube', color: '#ff0000' },
  facebook: { icon: Facebook, label: 'Facebook', color: '#1877f2' },
  tiktok: { icon: Megaphone, label: 'TikTok', color: '#000000' },
  email: { icon: Mail, label: 'Email', color: '#0ea5e9' },
  whatsapp: { icon: MessageCircle, label: 'WhatsApp', color: '#25d366' },
  manychat: { icon: Bot, label: 'Manychat', color: '#0084ff' },
  crm: { icon: Users, label: 'CRM', color: '#7c3aed' },
  custom: { icon: Upload, label: 'Personalizado', color: '#6b7280' },
};

const nodeColors = [
  { name: 'Default', value: '' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
];

export interface FlowchartNodeData extends Record<string, unknown> {
  label: string;
  subtitle?: string;
  iconName: string;
  style?: {
    color?: string;
  };
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, data: any) => void;
}

function FlowchartNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as FlowchartNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(nodeData.label || '');
  const [editSubtitle, setEditSubtitle] = useState(nodeData.subtitle || '');
  const containerRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const iconConfig = flowchartIcons[nodeData.iconName] || flowchartIcons.custom;
  const Icon = iconConfig.icon;
  const color = nodeData.style?.color || iconConfig.color;

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditLabel(nodeData.label || '');
    setEditSubtitle(nodeData.subtitle || '');
  }, [nodeData.label, nodeData.subtitle]);

  const saveAndClose = useCallback(() => {
    setIsEditing(false);
    if (nodeData.onUpdate) {
      nodeData.onUpdate(id, { label: editLabel, subtitle: editSubtitle });
    }
  }, [id, editLabel, editSubtitle, nodeData]);

  // Use a delayed blur so clicking between inputs doesn't close editing
  const handleInputBlur = useCallback(() => {
    blurTimeoutRef.current = setTimeout(() => {
      // Check if focus is still within our editing container
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        saveAndClose();
      }
    }, 150);
  }, [saveAndClose]);

  const handleInputFocus = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveAndClose();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditLabel(nodeData.label || '');
      setEditSubtitle(nodeData.subtitle || '');
    }
  }, [saveAndClose, nodeData.label, nodeData.subtitle]);

  const handleDelete = useCallback(() => {
    if (nodeData.onDelete) {
      nodeData.onDelete(id);
    }
  }, [id, nodeData]);

  const updateColor = useCallback((newColor: string) => {
    if (nodeData.onUpdate) {
      nodeData.onUpdate(id, { style: { ...nodeData.style, color: newColor } });
    }
  }, [id, nodeData]);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'relative flex flex-col items-center group',
        selected && 'z-10'
      )}
    >
      {/* Handles for connections - visible for drag-to-connect */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />

      {/* Icon Container */}
      <div
        className={cn(
          'relative w-16 h-16 rounded-xl flex items-center justify-center shadow-lg transition-all',
          selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
        )}
        style={{ backgroundColor: color }}
      >
        <Icon className="h-8 w-8 text-white" />
        
        {/* Action buttons */}
        <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="secondary" 
                size="icon" 
                className="h-5 w-5 rounded-full shadow"
              >
                <Palette className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 bg-[#242424] border-border/30" align="end">
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Cor</label>
                <div className="flex gap-1 flex-wrap">
                  {nodeColors.map((c) => (
                    <button
                      key={c.name}
                      className={cn(
                        'w-6 h-6 rounded border border-border/30 transition-all',
                        (nodeData.style?.color || '') === c.value && 'ring-2 ring-primary'
                      )}
                      style={{ backgroundColor: c.value || iconConfig.color }}
                      onClick={() => updateColor(c.value)}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="destructive" 
            size="icon" 
            className="h-5 w-5 rounded-full shadow"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Drag handle */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Labels */}
      <div 
        className="mt-2 text-center max-w-[160px]"
        onDoubleClick={handleDoubleClick}
        ref={containerRef}
      >
        {isEditing ? (
          <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
            <input
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onBlur={handleInputBlur}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full bg-[#161616] border border-border/30 rounded px-2 py-1 text-sm text-center text-foreground outline-none focus:border-primary"
              placeholder="Nome..."
            />
            <input
              value={editSubtitle}
              onChange={(e) => setEditSubtitle(e.target.value)}
              onBlur={handleInputBlur}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDown}
              className="w-full bg-[#161616] border border-border/30 rounded px-2 py-0.5 text-xs text-center text-foreground outline-none focus:border-primary"
              placeholder="Descrição..."
            />
          </div>
        ) : (
          <>
            <p className="font-medium text-sm text-foreground truncate">
              {nodeData.label || iconConfig.label}
            </p>
            {nodeData.subtitle && (
              <p className="text-xs text-muted-foreground truncate">
                {nodeData.subtitle}
              </p>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

export const FlowchartNode = memo(FlowchartNodeComponent);
