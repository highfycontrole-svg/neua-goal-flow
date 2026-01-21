import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExternalLink, Plus, Trash2, Link } from 'lucide-react';

interface TaskLinksFieldProps {
  links: string[];
  onChange: (links: string[]) => void;
  isEditing: boolean;
}

export function TaskLinksField({ links, onChange, isEditing }: TaskLinksFieldProps) {
  const [newLink, setNewLink] = useState('');

  const handleAddLink = () => {
    if (!newLink.trim()) return;
    const url = newLink.startsWith('http') ? newLink : `https://${newLink}`;
    onChange([...links, url]);
    setNewLink('');
  };

  const handleRemoveLink = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Link className="h-4 w-4" />
        Links
      </Label>

      {/* Existing links */}
      <div className="space-y-2">
        {links.length === 0 && !isEditing && (
          <p className="text-sm text-muted-foreground">Nenhum link adicionado</p>
        )}

        {links.map((link, index) => (
          <div key={index} className="flex items-center gap-2 group">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center gap-2 text-sm text-primary hover:underline truncate p-2 rounded-md bg-secondary/30"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{link}</span>
            </a>
            {isEditing && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveLink(index)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add new link */}
      {isEditing && (
        <div className="flex gap-2">
          <Input
            placeholder="Cole o link aqui..."
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLink())}
          />
          <Button type="button" size="icon" onClick={handleAddLink}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
