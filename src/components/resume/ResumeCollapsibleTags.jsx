import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Button } from '../ui/button';

/**
 * ResumeCollapsibleTags - A themed version of the CollapsibleTags component for resumes
 */
const ResumeCollapsibleTags = ({
  tags = [],
  onTagClick,
  initialVisibleCount = 6,
  getTagLabel = (tag) => typeof tag === 'string' ? tag : tag.name || tag.label || tag.value || tag,
  getTagValue = (tag) => typeof tag === 'string' ? tag : tag.id || tag.value || tag.name || tag,
  className = '',
  style = {},
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!tags || tags.length === 0) {
    return null;
  }

  const visibleTags = expanded ? tags : tags.slice(0, initialVisibleCount);
  const hasMoreTags = tags.length > initialVisibleCount;

  // Use provided styles or default to theme variables
  const tagStyles = {
    backgroundColor: style['--tag-bg'] || 'var(--resume-secondary)',
    color: style['--tag-text'] || 'var(--resume-text)',
    border: `1px solid ${style['--tag-border'] || 'var(--resume-border)'}`,
    fontFamily: 'var(--resume-body-font)'
  };

  const buttonStyles = {
    color: 'var(--resume-text)',
    fontFamily: 'var(--resume-body-font)'
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-xs font-medium" style={{ color: 'var(--resume-text)' }}>
          {expanded ? `All Skills (${tags.length})` : 'Skills'}
        </div>
        {hasMoreTags && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-6 text-xs px-2 py-0"
            style={buttonStyles}
          >
            {expanded ? (
              <>
                <span>Show Less</span>
                <ChevronUp size={14} className="ml-1" />
              </>
            ) : (
              <>
                <span>+{tags.length - initialVisibleCount} more</span>
                <ChevronDown size={14} className="ml-1" />
              </>
            )}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {visibleTags.map((tag, index) => (
          <span
            key={`${getTagValue(tag)}-${index}`}
            onClick={onTagClick ? (e) => onTagClick(tag, e) : undefined}
            className={`
              px-2 py-0.5 text-xs font-medium rounded-full
              ${onTagClick ? 'cursor-pointer hover:opacity-90' : ''}
            `}
            style={tagStyles}
          >
            {getTagLabel(tag)}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ResumeCollapsibleTags;
