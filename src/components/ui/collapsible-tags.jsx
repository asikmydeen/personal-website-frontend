import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Button } from './button';

/**
 * CollapsibleTags - A reusable component for displaying tags in a space-efficient way
 *
 * @param {Object} props
 * @param {Array} props.tags - Array of tag objects or strings
 * @param {Function} props.onTagClick - Optional callback when a tag is clicked
 * @param {number} props.initialVisibleCount - Number of tags to show initially (default: 3)
 * @param {boolean} props.showFilter - Whether to show the filter button (default: false)
 * @param {Function} props.onFilterClick - Callback when filter button is clicked
 * @param {string} props.getTagLabel - Function to extract label from tag object (default: tag => tag)
 * @param {string} props.getTagValue - Function to extract value from tag object (default: tag => tag)
 */
const CollapsibleTags = ({
  tags = [],
  onTagClick,
  initialVisibleCount = 3,
  showFilter = false,
  onFilterClick,
  getTagLabel = (tag) => typeof tag === 'string' ? tag : tag.name || tag.label || tag.value || tag,
  getTagValue = (tag) => typeof tag === 'string' ? tag : tag.id || tag.value || tag.name || tag,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!tags || tags.length === 0) {
    return null;
  }

  const visibleTags = expanded ? tags : tags.slice(0, initialVisibleCount);
  const hasMoreTags = tags.length > initialVisibleCount;

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-xs text-gray-500 font-medium">
          {expanded ? `All Tags (${tags.length})` : 'Tags'}
        </div>
        <div className="flex items-center space-x-1">
          {showFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onFilterClick}
              className="h-6 w-6 p-0"
            >
              <Filter size={14} />
              <span className="sr-only">Filter by tags</span>
            </Button>
          )}
          {hasMoreTags && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-6 text-xs px-2 py-0 text-gray-500 hover:text-gray-700"
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
      </div>

      <div className="flex flex-wrap gap-1.5">
        {visibleTags.map((tag, index) => (
          <span
            key={`${getTagValue(tag)}-${index}`}
            onClick={onTagClick ? (e) => onTagClick(tag, e) : undefined}
            className={`
              px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full
              ${onTagClick ? 'cursor-pointer hover:bg-gray-200' : ''}
            `}
          >
            {getTagLabel(tag)}
          </span>
        ))}
      </div>
    </div>
  );
};

export default CollapsibleTags;