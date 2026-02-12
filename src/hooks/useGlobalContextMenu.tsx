import { useEffect } from 'react';
import { useContextMenu, ContextMenuItem } from '@/contexts/ContextMenuContext';
import { 
  Edit, Trash2, Copy, Plus, FolderOpen, 
  Pencil, Palette, ArrowRightLeft, Type, 
  Lightbulb, CheckSquare, FileText, Scissors
} from 'lucide-react';

/**
 * Hook that listens to global contextmenu events and resolves
 * the appropriate menu items based on data-context-* attributes
 * on the target element (or its ancestors).
 * 
 * Components opt-in by adding data attributes:
 *   data-context-type="workspace|task|project|node|edge|block|card|empty"
 *   data-context-id="uuid"
 *   data-context-name="My Workspace"
 *   data-context-actions="edit,rename,duplicate,delete"
 * 
 * A callback registry allows pages to register custom action handlers.
 */

type ActionHandlers = Record<string, (id: string, name: string) => void>;

let globalHandlers: ActionHandlers = {};

export function registerContextActions(handlers: ActionHandlers) {
  globalHandlers = { ...globalHandlers, ...handlers };
  return () => {
    Object.keys(handlers).forEach(k => delete globalHandlers[k]);
  };
}

const iconMap: Record<string, React.ReactNode> = {
  edit: <Edit className="h-4 w-4" />,
  rename: <Pencil className="h-4 w-4" />,
  duplicate: <Copy className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
  open: <FolderOpen className="h-4 w-4" />,
  create: <Plus className="h-4 w-4" />,
  style: <Palette className="h-4 w-4" />,
  'change-type': <ArrowRightLeft className="h-4 w-4" />,
  'edit-subtitle': <Type className="h-4 w-4" />,
  'type-idea': <Lightbulb className="h-4 w-4" />,
  'type-task': <CheckSquare className="h-4 w-4" />,
  'type-text': <FileText className="h-4 w-4" />,
  'line-straight': <Scissors className="h-4 w-4" />,
  'line-curved': <ArrowRightLeft className="h-4 w-4" />,
};

const labelMap: Record<string, string> = {
  edit: 'Editar',
  rename: 'Renomear',
  duplicate: 'Duplicar',
  delete: 'Excluir',
  open: 'Abrir',
  create: 'Criar novo',
  style: 'Alterar estilo',
  'change-type': 'Alterar tipo',
  'edit-subtitle': 'Editar descrição',
  'type-idea': 'Tipo: Ideia',
  'type-task': 'Tipo: Tarefa',
  'type-text': 'Tipo: Texto',
  'line-straight': 'Linha reta',
  'line-curved': 'Linha curva',
};

function findContextElement(target: HTMLElement): HTMLElement | null {
  let el: HTMLElement | null = target;
  while (el && !el.dataset.contextType) {
    el = el.parentElement;
  }
  return el;
}

export function useGlobalContextMenu() {
  const { showMenu } = useContextMenu();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Skip if inside react-flow (MindOs has its own context menu)
      const inReactFlow = target.closest('.react-flow');
      if (inReactFlow) return;

      // Skip if inside input/textarea
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const contextEl = findContextElement(target);
      if (!contextEl) return; // No context, let browser handle

      e.preventDefault();

      const type = contextEl.dataset.contextType || '';
      const id = contextEl.dataset.contextId || '';
      const name = contextEl.dataset.contextName || '';
      const actionsStr = contextEl.dataset.contextActions || '';

      if (!actionsStr) return;

      const actions = actionsStr.split(',').map(a => a.trim()).filter(Boolean);

      const items: ContextMenuItem[] = [];
      let lastWasAction = false;

      actions.forEach((action, i) => {
        if (action === '---') {
          if (lastWasAction) items.push({ label: '', action: () => {}, separator: true });
          lastWasAction = false;
          return;
        }

        const handlerKey = `${type}:${action}`;
        const genericKey = action;
        const handler = globalHandlers[handlerKey] || globalHandlers[genericKey];

        items.push({
          label: labelMap[action] || action,
          icon: iconMap[action],
          destructive: action === 'delete',
          action: () => handler?.(id, name),
          disabled: !handler,
        });
        lastWasAction = true;
      });

      if (items.length > 0) {
        showMenu(e.clientX, e.clientY, items);
      }
    };

    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, [showMenu]);
}
