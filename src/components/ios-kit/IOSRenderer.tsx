import { useState } from 'react';
import type { IOSNode, PrototypeSchema, ScreenNode } from './schema';
import {
  Screen, NavBar, LargeTitle, Section, Row, TextField, IOSButton,
  SearchBar, TabBar, SegmentedControl, IOSCard, Alert, EmptyState, Spacer,
} from './IOSComponents';

// ── Node Renderer ────────────────────────────────────────────────
function RenderNode({ node, onNavigate }: { node: IOSNode; onNavigate: (screenId: string) => void }) {
  switch (node.type) {
    case 'Screen':
      return (
        <Screen bg={node.bg}>
          {node.children.map((child, i) => (
            <RenderNode key={i} node={child} onNavigate={onNavigate} />
          ))}
          {node.tabBar && <RenderNode node={node.tabBar} onNavigate={onNavigate} />}
        </Screen>
      );
    case 'NavBar':
      return (
        <NavBar
          title={node.title}
          back={node.back}
          right={node.rightLabel ? <span style={{ color: '#007AFF', fontSize: '17px' }}>{node.rightLabel}</span> : undefined}
        />
      );
    case 'LargeTitle':
      return <LargeTitle title={node.title} />;
    case 'Section':
      return (
        <Section header={node.header} footer={node.footer}>
          {node.children.map((child, i) => (
            <RenderNode key={i} node={child} onNavigate={onNavigate} />
          ))}
        </Section>
      );
    case 'Row':
      return (
        <Row
          icon={node.icon}
          iconColor={node.iconColor}
          label={node.label}
          detail={node.detail}
          subtitle={node.subtitle}
          image={node.image}
          chevron={node.chevron}
          toggle={node.toggle}
          toggleOn={node.toggleOn}
          onTap={node.navigateTo ? () => onNavigate(node.navigateTo!) : undefined}
        />
      );
    case 'TextField':
      return <TextField placeholder={node.placeholder} value={node.value} secure={node.secure} />;
    case 'Button':
      return (
        <div style={{ padding: '8px 16px' }} onClick={node.navigateTo ? () => onNavigate(node.navigateTo!) : undefined}>
          <IOSButton label={node.label} style={node.style} destructive={node.destructive} full={node.full} />
        </div>
      );
    case 'SearchBar':
      return <SearchBar placeholder={node.placeholder} />;
    case 'TabBar':
      return (
        <TabBar
          tabs={node.tabs.map(t => ({ icon: t.icon, label: t.label }))}
          activeIndex={node.activeIndex}
        />
      );
    case 'SegmentedControl':
      return <SegmentedControl segments={node.segments} activeIndex={node.activeIndex} />;
    case 'Card':
      return (
        <IOSCard padding={node.padding}>
          {node.children.map((child, i) => (
            <RenderNode key={i} node={child} onNavigate={onNavigate} />
          ))}
        </IOSCard>
      );
    case 'Alert':
      return <Alert title={node.title} message={node.message} buttons={node.buttons} />;
    case 'EmptyState':
      return <EmptyState icon={node.icon} title={node.title} message={node.message} buttonLabel={node.buttonLabel} />;
    case 'Spacer':
      return <Spacer height={node.height} />;
    default:
      return null;
  }
}

// ── Screen Renderer with navigation ──────────────────────────────
function ScreenRenderer({ screens, entryScreen }: { screens: Record<string, ScreenNode>; entryScreen: string }) {
  const [stack, setStack] = useState<string[]>([entryScreen]);
  const currentScreenId = stack[stack.length - 1];
  const currentScreen = screens[currentScreenId];

  const navigate = (screenId: string) => {
    if (screens[screenId]) {
      setStack(prev => [...prev, screenId]);
    }
  };

  const goBack = () => {
    if (stack.length > 1) {
      setStack(prev => prev.slice(0, -1));
    }
  };

  if (!currentScreen) {
    return <EmptyState icon="?" title="Screen not found" message={`No screen with id "${currentScreenId}"`} />;
  }

  // Inject back button into NavBar if we have navigation history
  const screenWithNav: ScreenNode = {
    ...currentScreen,
    children: currentScreen.children.map(child => {
      if (child.type === 'NavBar' && stack.length > 1) {
        return { ...child, back: child.back || 'Back' };
      }
      return child;
    }),
  };

  return (
    <div
      style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}
      onClick={(e) => {
        // Handle back button clicks
        const target = e.target as HTMLElement;
        if (target.closest?.('[data-back]') || (stack.length > 1 && target.textContent === 'Back')) {
          goBack();
        }
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <RenderNode node={screenWithNav} onNavigate={navigate} />
      </div>
    </div>
  );
}

// ── Full Prototype Renderer ──────────────────────────────────────
export default function IOSRenderer({ schema }: { schema: PrototypeSchema }) {
  return <ScreenRenderer screens={schema.screens} entryScreen={schema.entryScreen} />;
}
