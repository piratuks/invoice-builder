import { ExpandLess, ExpandMore } from '@mui/icons-material';
import {
  Badge,
  Box,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Switch,
  Tooltip,
  useTheme
} from '@mui/material';
import { useMemo, useState, type FC } from 'react';
import type { MenuItem, MenuItemMetadata } from '../../../types/menuItem';

interface Props {
  items: MenuItemMetadata[];
  showText: boolean;
  useTooltip: boolean;
}
export const MenuList: FC<Props> = ({ items, showText, useTooltip }) => {
  const theme = useTheme();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const meta of items) {
      if (meta.groupName) initial[meta.groupName] = meta.isOpen ?? false;
    }
    return initial;
  });

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const { groups, singles } = useMemo(() => {
    const cgroups = new Map<string, MenuItemMetadata>();
    const csingles: MenuItem[] = [];

    for (const meta of items) {
      if (meta.groupName) {
        cgroups.set(meta.groupName, meta);
      } else {
        csingles.push(...meta.items);
      }
    }

    return { groups: cgroups, singles: csingles };
  }, [items]);

  const renderItem = (item: MenuItem) => {
    const listButton = (
      <ListItemButton
        selected={typeof item.isSelected === 'function' ? item.isSelected(item) : item.isSelected}
        onClick={() => {
          if (item.isToggle && item.onChange) item.onChange(item);
          else if (item.onClick) item.onClick(item);
        }}
        sx={{ ...(item.minHeight !== undefined && { minHeight: item.minHeight }) }}
      >
        <ListItemIcon sx={{ color: theme.palette.text.primary || 'inherit' }}>{item.icon}</ListItemIcon>

        {showText && (
          <>
            <ListItemText
              primary={item.text}
              {...(item.description !== undefined && { secondary: item.description })}
            />
            {item.isToggle && <Switch edge="end" checked={item.checked} />}
          </>
        )}
      </ListItemButton>
    );

    return useTooltip ? <Tooltip title={item.text}>{listButton}</Tooltip> : listButton;
  };

  const renderGroup = (meta: MenuItemMetadata) => {
    const { groupName, groupIcon, items: children } = meta;

    if (children.length === 1) {
      return (
        <ListItem key={children[0].text} disablePadding>
          {renderItem(children[0])}
        </ListItem>
      );
    }

    const isOpen = groupName ? openGroups[groupName] : false;

    const groupButton = (
      <ListItemButton onClick={() => toggleGroup(groupName ?? '')}>
        {groupIcon && (
          <ListItemIcon>
            <Badge
              variant="dot"
              color="primary"
              invisible={!isOpen}
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
              {groupIcon}
            </Badge>
          </ListItemIcon>
        )}

        {showText && <ListItemText primary={groupName} />}
        {isOpen ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
    );

    return (
      <Box key={groupName}>
        {useTooltip ? <Tooltip title={groupName}>{groupButton}</Tooltip> : groupButton}

        <Collapse in={isOpen} timeout="auto" unmountOnExit sx={{ pl: showText ? 2 : 0, pb: showText ? 0 : 4 }}>
          <List component="div" disablePadding>
            {children.map(child => (
              <ListItem key={child.text} disablePadding>
                {renderItem(child)}
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 1 }} />
        </Collapse>
      </Box>
    );
  };

  return (
    <List sx={{ flexGrow: 1 }}>
      {[...groups.values()].map(meta => {
        return renderGroup(meta);
      })}

      {singles.map(item => (
        <ListItem key={item.text} disablePadding>
          {renderItem(item)}
        </ListItem>
      ))}
    </List>
  );
};
