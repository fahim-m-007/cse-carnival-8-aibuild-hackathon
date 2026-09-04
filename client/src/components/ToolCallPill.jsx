import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

export default function ToolCallPill({ toolCall }) {
  const [expanded, setExpanded] = useState(false);

  if (!toolCall) return null;

  const toolName = toolCall.tool || toolCall.name || 'query_database';
  const args = toolCall.args || toolCall.arguments || {};
  const result = toolCall.result || toolCall.output || 'Success';

  return (
    <div className="tool-call-pill">
      <div className="tool-call-header" onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Terminal size={13} />
          <span>tool: <strong>{toolName}()</strong></span>
          <CheckCircle2 size={12} color="#00873D" />
        </div>
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </div>

      {expanded && (
        <div className="tool-call-details">
          <div><strong>Input:</strong> {JSON.stringify(args, null, 2)}</div>
          <div style={{ marginTop: '0.25rem' }}>
            <strong>Output:</strong> {typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}
          </div>
        </div>
      )}
    </div>
  );
}
