import { type FC } from 'react';
import { GenericList } from '../../shared/components/lists/genericList/GenericList';
import type { Preset } from '@invoice-builder/contracts';

interface Props {
  item: Preset;
  selectedItem?: Preset;
  showDeleteButton?: boolean;
  onEdit?: (item: Preset) => void;
  onDelete?: (id: number) => void;
}
export const List: FC<Props> = ({
  item,
  selectedItem,
  onEdit = () => {},
  onDelete = () => {},
  showDeleteButton = true
}) => {
  return (
    <GenericList
      item={item}
      selectedItem={selectedItem}
      showDeleteButton={showDeleteButton}
      onEdit={onEdit}
      onDelete={onDelete}
      getName={c => c.name}
      getIsArchived={c => c.isArchived}
    />
  );
};
