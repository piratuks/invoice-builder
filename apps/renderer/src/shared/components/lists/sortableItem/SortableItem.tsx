import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box } from '@mui/material';
import type { FC, ReactElement } from 'react';
import React from 'react';

export const SortableItem: FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const attachListenersRecursively = (node: React.ReactNode): React.ReactNode => {
    if (!React.isValidElement(node)) return node;

    const element = node as ReactElement<Record<string, unknown> & { children?: React.ReactNode }>;

    if (element.props && element.props['data-drag-handle']) {
      return React.cloneElement(element, { ...listeners });
    }

    const childNodes = element.props && (element.props as { children?: React.ReactNode }).children;
    if (childNodes) {
      const newChildren = React.Children.map(childNodes, child => attachListenersRecursively(child));
      if (newChildren === childNodes) return element;
      return React.cloneElement(element, undefined, newChildren);
    }

    return element;
  };

  return (
    <Box ref={setNodeRef} style={style} {...attributes}>
      {React.Children.map(children, child => attachListenersRecursively(child))}
    </Box>
  );
};
