import { Box, MenuItem, Select } from '@mui/material';
import { validHeaderBooleanProperties, type HeaderBlock, type LayoutSection } from '../../shared/types/layouts';
import {
  supportedHeaderBlockAlignments,
  supportedHeaderBlockGaps,
  supportedHeaderBlockJustifications,
  supportedHeaderBlockPaddingBottoms,
  supportedHeaderBlockPaddingTops,
  supportedHeaderBlockWidths,
  type LayoutBuilderBlockNode
} from '../../shared/utils/visualBuilderV1';

type Translate = (key: string) => string;

export const V1LayoutBuilderControls = ({
  node,
  expanded,
  onUpdate,
  t
}: {
  node: LayoutBuilderBlockNode;
  expanded: boolean;
  onUpdate: (change: Partial<HeaderBlock>) => void;
  t: Translate;
}) => {
  if (!expanded) return null;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, max-content))',
        gap: 0.5,
        width: '100%',
        mt: 0.5
      }}
    >
      <Select
        size="small"
        displayEmpty
        value={node.block.width ?? ''}
        onChange={event => onUpdate({ width: event.target.value || undefined })}
      >
        <MenuItem value="">{t('layouts.width')}</MenuItem>
        {supportedHeaderBlockWidths.map(value => (
          <MenuItem key={value} value={value}>
            {value}
          </MenuItem>
        ))}
      </Select>
      <Select
        size="small"
        displayEmpty
        value={node.block.align ?? ''}
        onChange={event => onUpdate({ align: event.target.value || undefined })}
      >
        <MenuItem value="">{t('layouts.align')}</MenuItem>
        {supportedHeaderBlockAlignments.map(value => (
          <MenuItem key={value} value={value}>
            {value}
          </MenuItem>
        ))}
      </Select>
      <Select
        size="small"
        displayEmpty
        value={node.block.gap ?? ''}
        onChange={event => onUpdate({ gap: event.target.value ? (Number(event.target.value) as 5 | 10) : undefined })}
      >
        <MenuItem value="">{t('layouts.gap')}</MenuItem>
        {supportedHeaderBlockGaps.map(value => (
          <MenuItem key={value} value={value}>
            {value}
          </MenuItem>
        ))}
      </Select>
      <Select
        size="small"
        displayEmpty
        value={node.block.paddingTop ?? ''}
        onChange={event =>
          onUpdate({ paddingTop: event.target.value ? (Number(event.target.value) as 10 | 20) : undefined })
        }
      >
        <MenuItem value="">{t('layouts.paddingTop')}</MenuItem>
        {supportedHeaderBlockPaddingTops.map(value => (
          <MenuItem key={value} value={value}>
            {value}
          </MenuItem>
        ))}
      </Select>
      <Select
        size="small"
        displayEmpty
        value={node.block.paddingBottom ?? ''}
        onChange={event => onUpdate({ paddingBottom: event.target.value ? 20 : undefined })}
      >
        <MenuItem value="">{t('layouts.paddingBottom')}</MenuItem>
        {supportedHeaderBlockPaddingBottoms.map(value => (
          <MenuItem key={value} value={value}>
            {value}
          </MenuItem>
        ))}
      </Select>
      <Select
        size="small"
        displayEmpty
        value={node.block.paymentSource ?? ''}
        onChange={event => onUpdate({ paymentSource: event.target.value || undefined })}
      >
        <MenuItem value="">{t('layouts.paymentSource')}</MenuItem>
        <MenuItem value="bank">bank</MenuItem>
        <MenuItem value="legacyBusiness">legacyBusiness</MenuItem>
      </Select>
      <Select
        size="small"
        displayEmpty
        value={node.block.justify ?? ''}
        onChange={event => onUpdate({ justify: event.target.value || undefined })}
      >
        <MenuItem value="">{t('layouts.justify')}</MenuItem>
        {supportedHeaderBlockJustifications.map(value => (
          <MenuItem key={value} value={value}>
            {value}
          </MenuItem>
        ))}
      </Select>
      {validHeaderBooleanProperties.map(property => (
        <Select
          key={property}
          size="small"
          displayEmpty
          value={node.block[property] === undefined ? '' : String(node.block[property])}
          onChange={event =>
            onUpdate({ [property]: event.target.value === '' ? undefined : event.target.value === 'true' })
          }
        >
          <MenuItem value="">{t(`layouts.${property}`)}</MenuItem>
          <MenuItem value="true">{t('layouts.enabled')}</MenuItem>
          <MenuItem value="false">{t('layouts.disabled')}</MenuItem>
        </Select>
      ))}
    </Box>
  );
};

export const V1LayoutBuilderSectionControls = ({
  section,
  expanded,
  onUpdate,
  t
}: {
  section: LayoutSection;
  expanded: boolean;
  onUpdate: (change: Partial<LayoutSection>) => void;
  t: Translate;
}) => {
  if (!expanded) return null;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, max-content))',
        gap: 0.5,
        mt: 0.75,
        pt: 0.75,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Select
        size="small"
        value={String(section.visible)}
        onChange={event =>
          onUpdate({ visible: event.target.value === 'auto' ? 'auto' : event.target.value === 'true' })
        }
      >
        <MenuItem value="true">{t('layouts.visible')}</MenuItem>
        <MenuItem value="false">{t('layouts.hidden')}</MenuItem>
        <MenuItem value="auto">auto</MenuItem>
      </Select>
      <Select
        size="small"
        displayEmpty
        value={section.align ?? ''}
        onChange={event =>
          onUpdate({ align: event.target.value ? (event.target.value as 'start' | 'center' | 'end') : undefined })
        }
      >
        <MenuItem value="">{t('layouts.align')}</MenuItem>
        <MenuItem value="start">start</MenuItem>
        <MenuItem value="center">center</MenuItem>
        <MenuItem value="end">end</MenuItem>
      </Select>
      <Select
        size="small"
        displayEmpty
        value={section.watermarkOrder ?? ''}
        onChange={event => onUpdate({ watermarkOrder: event.target.value || undefined })}
      >
        <MenuItem value="">{t('layouts.defaultValue')}</MenuItem>
        <MenuItem value="default">default</MenuItem>
        <MenuItem value="paidFirst">paidFirst</MenuItem>
      </Select>
      <Select
        size="small"
        displayEmpty
        value={section.columnSizing ?? ''}
        onChange={event => onUpdate({ columnSizing: event.target.value || undefined })}
      >
        <MenuItem value="">{t('layouts.tableDefault')}</MenuItem>
        <MenuItem value="fixedFlex">fixedFlex</MenuItem>
        <MenuItem value="proportional">proportional</MenuItem>
      </Select>
    </Box>
  );
};
