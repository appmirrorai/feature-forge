import { Card, CardContent, CardHeader, CardTitle, Input, Button } from '@appmirror/ui-kit';
import { useState } from 'react';

interface FigmaEmbedProps {
  url?: string;
  onUrlChange: (url: string) => void;
  editable?: boolean;
}

function figmaUrlToEmbed(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('figma.com')) return null;
    return `https://www.figma.com/embed?embed_host=feature-forge&url=${encodeURIComponent(url)}`;
  } catch {
    return null;
  }
}

export default function FigmaEmbed({ url, onUrlChange, editable = true }: FigmaEmbedProps) {
  const [inputUrl, setInputUrl] = useState(url || '');
  const embedUrl = url ? figmaUrlToEmbed(url) : null;

  const handleAdd = () => {
    if (inputUrl.includes('figma.com')) {
      onUrlChange(inputUrl);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 38 57" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE"/>
            <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83"/>
            <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262"/>
            <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E"/>
            <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF"/>
          </svg>
          Figma Design
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {editable && !embedUrl && (
          <div className="flex gap-2">
            <Input
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Paste Figma link..."
              className="flex-1"
            />
            <Button variant="primary" onClick={handleAdd}>
              Add
            </Button>
          </div>
        )}

        {embedUrl ? (
          <div className="relative w-full rounded-lg overflow-hidden border border-border" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              title="Figma Design"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-lg">
            <svg className="w-12 h-12 text-muted-foreground mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-muted-foreground">Drop a Figma link or screenshot</p>
            <p className="text-xs text-muted-foreground mt-1">This becomes the spec for your feature</p>
          </div>
        )}

        {editable && embedUrl && (
          <Button
            variant="secondary"
            onClick={() => { onUrlChange(''); setInputUrl(''); }}
            className="text-xs"
          >
            Remove design
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
