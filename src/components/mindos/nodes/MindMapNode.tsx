import { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Lightbulb, CheckSquare, FileText, GripVertical, Trash2, Palette, Type, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const nodeTypeIcons: Record<string, any> = {
  idea: Lightbulb,
  task: CheckSquare,
  text: FileText,
};

const nodeTypeColors: Record<string, string> = {
  idea: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
  task: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
  text: 'from-gray-500/20 to-slate-500/20 border-gray-500/30',
};

const fontSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const fontSizeClasses: Record<string, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

const backgroundColors = [
  { name: 'Default', value: '' },
  { name: 'Yellow', value: '#fef3c7' },
  { name: 'Green', value: '#d1fae5' },
  { name: 'Blue', value: '#dbeafe' },
  { name: 'Purple', value: '#ede9fe' },
  { name: 'Pink', value: '#fce7f3' },
  { name: 'Red', value: '#fee2e2' },
  { name: 'Orange', value: '#ffedd5' },
];

const textColors = [
  { name: 'Default', value: '' },
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#ffffff' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Purple', value: '#a855f7' },
];

export interface MindMapNodeData extends Record<string, unknown> {
  label: string;
  nodeType: 'idea' | 'task' | 'text';
  content?: any;
  style?: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: string;
    bold?: boolean;
    italic?: boolean;
  };
  tags?: string[];
  status?: string;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, data: any) => void;
  onAddChild?: (parentId: string, direction: 'right' | 'bottom') => void;
}

function MindMapNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as MindMapNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData.label || '');
  
  const Icon = nodeTypeIcons[nodeData.nodeType] || Lightbulb;
  const colorClass = nodeTypeColors[nodeData.nodeType] || nodeTypeColors.idea;
  
  const style = nodeData.style || {};
  const fontSize = fontSizeClasses[style.fontSize || 'md'];

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(nodeData.label || '');
  }, [nodeData.label]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (nodeData.onUpdate) {
      nodeData.onUpdate(id, { label: editValue });
    }
  }, [id, editValue, nodeData]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(nodeData.label || '');
    }
  }, [handleBlur, nodeData.label]);

  const handleDelete = useCallback(() => {
    if (nodeData.onDelete) {
      nodeData.onDelete(id);
    }
  }, [id, nodeData]);

  const handleAddChild = useCallback((direction: 'right' | 'bottom') => {
    if (nodeData.onAddChild) {
      nodeData.onAddChild(id, direction);
    }
  }, [id, nodeData]);

  const updateStyle = useCallback((key: string, value: any) => {
    if (nodeData.onUpdate) {
      nodeData.onUpdate(id, { 
        style: { ...style, [key]: value } 
      });
    }
  }, [id, nodeData, style]);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'min-w-[180px] max-w-[300px] rounded-xl border bg-gradient-to-br shadow-lg transition-all group',
        colorClass,
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
      style={{
        backgroundColor: style.backgroundColor || undefined,
      }}
    >
      {/* Handles for connections - hidden in mindmap, only used programmatically */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-primary/50 !border-0 !opacity-0"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2 !h-2 !bg-primary/50 !border-0 !opacity-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-primary/50 !border-0 !opacity-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        className="!w-2 !h-2 !bg-primary/50 !border-0 !opacity-0"
      />

      {/* (+) Add Child buttons - visible on hover */}
      <button
        className="absolute -right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-10"
        onClick={() => handleAddChild('right')}
        title="Adicionar nó à direita"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-10"
        onClick={() => handleAddChild('bottom')}
        title="Adicionar nó abaixo"
      >
        <Plus className="h-4 w-4" />
      </button>

      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-1">
          {/* Style Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Palette className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 bg-surface-3 border-border/30" align="end">
              <div className="space-y-3">
                {/* Font Size */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tamanho</label>
                  <div className="flex gap-1">
                    {fontSizes.map((size) => (
                      <Button
                        key={size}
                        variant={style.fontSize === size ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => updateStyle('fontSize', size)}
                      >
                        {size.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Background Color */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Cor de Fundo</label>
                  <div className="flex gap-1 flex-wrap">
                    {backgroundColors.map((color) => (
                      <button
                        key={color.name}
                        className={cn(
                          'w-6 h-6 rounded border border-border/30 transition-all',
                          style.backgroundColor === color.value && 'ring-2 ring-primary'
                        )}
                        style={{ backgroundColor: color.value || '#242424' }}
                        onClick={() => updateStyle('backgroundColor', color.value)}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Text Color */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Cor do Texto</label>
                  <div className="flex gap-1 flex-wrap">
                    {textColors.map((color) => (
                      <button
                        key={color.name}
                        className={cn(
                          'w-6 h-6 rounded border border-border/30 transition-all flex items-center justify-center',
                          style.textColor === color.value && 'ring-2 ring-primary'
                        )}
                        style={{ backgroundColor: color.value || '#242424' }}
                        onClick={() => updateStyle('textColor', color.value)}
                        title={color.name}
                      >
                        <Type className="h-3 w-3" style={{ color: color.value ? (color.value === '#ffffff' ? '#000' : '#fff') : '#fff' }} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bold/Italic */}
                <div className="flex gap-2">
                  <Button
                    variant={style.bold ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => updateStyle('bold', !style.bold)}
                  >
                    <strong>B</strong>
                  </Button>
                  <Button
                    variant={style.italic ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => updateStyle('italic', !style.italic)}
                  >
                    <em>I</em>
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div 
        className="p-3 min-h-[40px]"
        onDoubleClick={handleDoubleClick}
      >
        {isEditing ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className={cn(
              'w-full bg-transparent border-none outline-none resize-none',
              fontSize
            )}
            style={{
              color: style.textColor || undefined,
              fontWeight: style.bold ? 'bold' : undefined,
              fontStyle: style.italic ? 'italic' : undefined,
            }}
            rows={3}
          />
        ) : (
          <p
            className={cn(
              'cursor-text',
              fontSize,
              !nodeData.label && 'text-muted-foreground italic'
            )}
            style={{
              color: style.textColor || undefined,
              fontWeight: style.bold ? 'bold' : undefined,
              fontStyle: style.italic ? 'italic' : undefined,
            }}
          >
            {nodeData.label || 'Clique duas vezes para editar...'}
          </p>
        )}
      </div>

      {/* Tags */}
      {nodeData.tags && nodeData.tags.length > 0 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {nodeData.tags.map((tag, i) => (
            <span key={i} className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export const MindMapNode = memo(MindMapNodeComponent);
