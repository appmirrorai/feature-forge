import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@appmirror/ui-kit';
import type { Feature, FeatureMode } from '../types';
import ModeSelector from './ModeSelector';
import FigmaEmbed from './FigmaEmbed';
import ServicePicker from './ServicePicker';

interface FeatureCreatorProps {
  projectId: string;
  userId: string;
  onSubmit: (feature: Omit<Feature, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  onOrchestrate?: () => void;
}

export default function FeatureCreator({ projectId, userId, onSubmit, onCancel, onOrchestrate }: FeatureCreatorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [figmaUrl, setFigmaUrl] = useState('');
  const [targetMode, setTargetMode] = useState<FeatureMode>('prototype');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const canSubmit = name.trim() && selectedServices.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      figma: figmaUrl ? { url: figmaUrl } : undefined,
      currentMode: 'spike',
      targetMode,
      status: 'draft',
      services: selectedServices,
      impact: [],
      tasks: [],
      approvals: [],
      debtLedger: [],
      createdBy: userId,
      project_id: projectId,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">New Feature</h1>
          <p className="text-muted-foreground text-sm">Define what you want to build</p>
        </div>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>

      {/* Name & Description */}
      <Card>
        <CardHeader>
          <CardTitle>What are you building?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feature-name">Feature Name</Label>
            <Input
              id="feature-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Team member invite flow"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feature-desc">Description</Label>
            <textarea
              id="feature-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the feature — what should it do? Who is it for? Why does it matter?"
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm min-h-[100px] resize-y"
            />
          </div>
        </CardContent>
      </Card>

      {/* Figma */}
      <FigmaEmbed url={figmaUrl} onUrlChange={setFigmaUrl} editable />

      {/* Services */}
      <ServicePicker selectedIds={selectedServices} onChange={setSelectedServices} />

      {/* Mode */}
      <Card>
        <CardHeader>
          <CardTitle>How far do you want to go?</CardTitle>
        </CardHeader>
        <CardContent>
          <ModeSelector
            currentMode="spike"
            targetMode={targetMode}
            onTargetChange={setTargetMode}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center justify-between">
        {onOrchestrate ? (
          <button
            onClick={onOrchestrate}
            className="text-sm text-primary hover:underline"
          >
            Need AI task decomposition? Use the orchestration wizard
          </button>
        ) : <div />}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
            Create Feature
          </Button>
        </div>
      </div>
    </div>
  );
}
