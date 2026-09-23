import AddIcon from '@mui/icons-material/Add';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import {
  Box,
  Button,
  Chip,
  Fab,
  Grid,
  Pagination,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../../../i18n';
import { useAppDispatch } from '../../../../state/configureStore';
import { addToast, disableLoadingCursor, enableLoadingCursor, setAllowed } from '../../../../state/pageSlice';
import { useBeforeUnloadContext } from '../../../context/BeforeUnloadContext';
import { FilterType } from '../../../enums/filterType';
import { SortType } from '../../../enums/sortType';
import { usePersistentFilters } from '../../../hooks/persistent/usePersistentFilters';
import { usePersistentSearch } from '../../../hooks/persistent/usePersistentSearch';
import { usePersistentSort } from '../../../hooks/persistent/usePersistentSort';
import type { CustomOption } from '../../../types/customOption';
import type { Rows } from '../../../types/excel';
import type { Filter, FilterData } from '../../../types/filter';
import { exportExcel, importExcel } from '../../../utils/fileFunctions';
import { filterAndSortArray } from '../../../utils/filterSortFunctions';
import { FilterSortBar } from '../../controls/filterSortBar/FilterSortBar';
import { ImportExportButton } from '../../controls/importExportButton/ImportExportButton';
import { SearchInput } from '../../inputs/searchInput/SearchInput';
import { NoItem } from '../../lists/noItem/NoItem';
import { BottomFilterSheet } from '../../modals/bottomFilterSheet/BottomFilterSheet';
import { Confirmation } from '../../modals/confirmation';
import { Content } from '../content/Content';
import { PageAppBar } from '../pageAppBar/PageAppBar';

type SortOption<T> = CustomOption<keyof T, T>;

// RTK Query mutation-trigger shape: `[trigger, { isLoading }]`, matching the generated `useXMutation` hooks.
type MutationHook<TArg, TResult> = () => readonly [
  (arg: TArg) => Promise<{ data?: TResult; error?: unknown }>,
  { isLoading: boolean }
];

// RTK Query query-hook shape, matching the generated `useGetXQuery` hooks so they can be passed directly.
type QueryHook<TArg, TResult> = (arg: TArg) => {
  data?: TResult;
  isLoading: boolean;
  isFetching?: boolean;
  isError?: boolean;
  error?: unknown;
  refetch: () => void;
};

// Shape shared by every entity's RTK Query baseQuery error (see e.g. businessesApi's BusinessesApiError).
interface CrudMutationError {
  message?: string;
  key?: string;
}

const isCrudMutationError = (err: unknown): err is CrudMutationError =>
  typeof err === 'object' && err !== null && ('message' in err || 'key' in err);

interface Props<T, TAdd, TUpdate> {
  componentId: string;
  renderCustomButtons?: () => React.ReactNode;
  title?: string;
  useRetrieve?: QueryHook<FilterData[] | void, T[]>;
  useAdd?: MutationHook<TAdd, T>;
  useAddBatch?: MutationHook<TAdd[], T[]>;
  useUpdate?: MutationHook<TUpdate, T>;
  useDuplicate?: MutationHook<number, T>;
  useDelete?: MutationHook<number, unknown>;
  searchField: keyof T | ((item: T) => string | undefined);
  validateAndNormalize?: (data: unknown) => Promise<TAdd | TUpdate | undefined>;
  form?: (args: {
    item?: T;
    onChange: (data: { changedData: TAdd | TUpdate; isFormValid: boolean; description?: string }) => void;
    onDelete?: (id: number) => void;
    onDuplicate?: (id: number) => void;
  }) => ReactNode;
  sortOptions: SortOption<T>[];
  noItemButtonText?: string;
  noItemText: string;
  leftTitle?: string;
  renderListItem?: (
    item: T,
    selectedItem: T | undefined,
    onEdit: (item: T) => void,
    onDelete: (id: number) => void
  ) => ReactNode;

  filters?: Filter[];
  itemsPerPage?: number;
  excelData?: {
    excelColumns: string[];
    excelFileName: string;
    excelFormat: 'xlsx' | 'xls';
    excelTemplateData: Rows;
  };
  exportExcelHandler?: (data: T[]) => Promise<void>;
  showOnlyExport?: boolean;
  inlineOnAdd?: boolean;
  showRightSide?: boolean;
  showAddButton?: boolean;
  onAddClick?: (defaultOnAdd: () => void) => void;
}

export const CRUDPageRTK = <T, TAdd, TUpdate>(props: Props<T, TAdd, TUpdate>) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const {
    componentId,
    title,
    excelData,
    showOnlyExport = false,
    searchField,
    noItemButtonText,
    useRetrieve = () => ({
      data: [] as T[],
      isLoading: false,
      isFetching: false,
      refetch: () => {},
      isError: undefined,
      error: undefined
    }),
    useAdd = () => [async () => ({ data: undefined }), { isLoading: false }] as ReturnType<MutationHook<TAdd, T>>,
    useAddBatch = () =>
      [async () => ({ data: undefined }), { isLoading: false }] as ReturnType<MutationHook<TAdd[], T[]>>,
    useUpdate = () => [async () => ({ data: undefined }), { isLoading: false }] as ReturnType<MutationHook<TUpdate, T>>,
    useDelete = () =>
      [async () => ({ data: undefined }), { isLoading: false }] as ReturnType<MutationHook<number, unknown>>,
    useDuplicate = () =>
      [async () => ({ data: undefined }), { isLoading: false }] as ReturnType<MutationHook<number, T>>,
    renderListItem = () => null,
    noItemText,
    leftTitle,
    validateAndNormalize = () => {},
    sortOptions,
    form = () => null,
    itemsPerPage = 20,
    filters = [],
    exportExcelHandler,
    inlineOnAdd = false,
    showRightSide = true,
    showAddButton = true,
    renderCustomButtons = () => null,
    onAddClick
  } = props;
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | undefined>(undefined);
  const [deleteID, setDeleteID] = useState<number>(-1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { attemptNavigation } = useBeforeUnloadContext();
  const [persistentFilters, setPersistentFilters] = usePersistentFilters(
    filters.filter(item => item.initial),
    componentId
  );
  const [persistentSearch, setPersistentSearch] = usePersistentSearch('', componentId);
  const [persistentSort, setPersistentSort] = usePersistentSort<keyof T, T>(
    {
      activeSort: SortType.DEFAULT,
      activeSortBy: sortOptions[0]
    },
    componentId
  );

  const reportError = useCallback(
    (err: unknown) => {
      if (!isCrudMutationError(err)) return;
      const { message, key } = err;
      if (message) {
        dispatch(addToast({ message: i18n.exists(message) ? t(message) : message, severity: 'error' }));
      } else if (key) {
        dispatch(addToast({ message: t(key), severity: 'error' }));
      }
    },
    [dispatch, t]
  );

  const {
    data: retrievedItems,
    isLoading: isRetrieving,
    isFetching: isRefetching,
    isError: retrieveIsError,
    error: retrieveError
  } = useRetrieve(persistentFilters);
  const items = useMemo(() => retrievedItems ?? ([] as T[]), [retrievedItems]);

  useEffect(() => {
    if (retrieveIsError) reportError(retrieveError);
  }, [retrieveIsError, retrieveError, reportError]);

  const activeSortBy = sortOptions.find(option => option.value === persistentSort.activeSortBy.value) ?? sortOptions[0];

  const [addTrigger, { isLoading: isAdding }] = useAdd();
  const [addBatchTrigger, { isLoading: isAddingBatch }] = useAddBatch();
  const [updateTrigger, { isLoading: isUpdating }] = useUpdate();
  const [deleteTrigger, { isLoading: isDeleting }] = useDelete();
  const [duplicateTrigger, { isLoading: isDuplicating }] = useDuplicate();

  const isBusy = isRetrieving || isRefetching || isAdding || isAddingBatch || isUpdating || isDeleting || isDuplicating;

  useEffect(() => {
    if (!isBusy) return;
    dispatch(enableLoadingCursor());
    // Balances the increment above even if the component unmounts while still busy.
    return () => {
      dispatch(disableLoadingCursor());
    };
  }, [isBusy, dispatch]);

  const filteredItems = useMemo(() => {
    return filterAndSortArray({
      data: items,
      searchValue: persistentSearch,
      searchField,
      sortField: activeSortBy?.getValue ?? persistentSort.activeSortBy.value,
      sortType: persistentSort.activeSort
    });
  }, [activeSortBy, items, persistentSearch, searchField, persistentSort]);

  const totalPages = useMemo(() => {
    const pages = Math.ceil(filteredItems.length / itemsPerPage);
    return pages > 0 ? pages : 1;
  }, [filteredItems.length, itemsPerPage]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const handleCloseModal = useCallback(
    (skipAttempt: boolean) => {
      const doSelect = () => {
        setIsModalOpen(false);
        setSelectedItem(undefined);
        if (selectedItem === undefined) dispatch(setAllowed(true));
      };

      if (!skipAttempt && attemptNavigation && !isDesktop) {
        attemptNavigation(doSelect);
      } else {
        setIsModalOpen(false);
        if (selectedItem === undefined) dispatch(setAllowed(true));
      }
    },
    [attemptNavigation, dispatch, isDesktop, selectedItem]
  );

  const isUpdate = useCallback((item: TAdd | TUpdate): item is TUpdate => {
    return typeof item === 'object' && item !== null && 'id' in item && typeof item.id !== 'undefined';
  }, []);

  const onAdd = () => {
    setSelectedItem(undefined);
    setIsModalOpen(true);
  };

  const handleSave = useCallback(
    async (data: unknown) => {
      const normalized = await validateAndNormalize(data);
      if (!normalized) return;

      handleCloseModal(true);

      if (isUpdate(normalized)) {
        const result = await updateTrigger(normalized as TUpdate);
        if (result.error) {
          reportError(result.error);
        } else if (!isDesktop) {
          setSelectedItem(undefined);
          dispatch(setAllowed(true));
        } else {
          setSelectedItem(result.data);
        }
      } else {
        const result = await addTrigger(normalized as TAdd);
        if (result.error) {
          reportError(result.error);
        } else {
          setSelectedItem(undefined);
        }
      }
    },
    [validateAndNormalize, handleCloseModal, isUpdate, updateTrigger, addTrigger, isDesktop, dispatch, reportError]
  );

  const onSearchChanged = useCallback(
    (value: string) => {
      setPersistentSearch(value);
    },
    [setPersistentSearch]
  );

  const onFilterSortChange = useCallback(
    (data: { sortBy: CustomOption<keyof T, T>; sort: SortType }) => {
      setPersistentSort({
        activeSort: data.sort,
        activeSortBy: data.sortBy
      });
    },
    [setPersistentSort]
  );

  const onEdit = useCallback(
    (item: T) => {
      const doSelect = () =>
        setSelectedItem(prev => {
          if (prev && typeof prev === 'object' && 'id' in prev && item && typeof item === 'object' && 'id' in item) {
            return prev.id === item.id ? prev : item;
          }
          return item;
        });

      if (attemptNavigation && isDesktop) {
        attemptNavigation(doSelect);
      } else {
        doSelect();
      }
    },
    [attemptNavigation, isDesktop]
  );

  const onDelete = useCallback((id: number) => {
    setDeleteID(id);
    setShowDeleteConfirm(true);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    handleCancelDelete();
    if (deleteID === -1) return;
    const idToDelete = deleteID;
    setDeleteID(-1);
    const result = await deleteTrigger(idToDelete);
    setSelectedItem(undefined);
    setIsModalOpen(false);
    if (result.error) reportError(result.error);
  }, [deleteID, handleCancelDelete, deleteTrigger, reportError]);

  const onDuplicate = useCallback(
    async (id: number) => {
      const result = await duplicateTrigger(id);
      setIsModalOpen(false);
      if (result.error) {
        reportError(result.error);
        setSelectedItem(undefined);
      } else {
        setSelectedItem(result.data);
      }
    },
    [duplicateTrigger, reportError]
  );

  const onExportToExcel = useCallback(async () => {
    try {
      if (exportExcelHandler) {
        await exportExcelHandler(items);
        return;
      }

      if (!excelData) return;

      const { excelColumns, excelFileName, excelFormat } = excelData;
      await exportExcel(
        [{ name: excelFileName, rows: items as Rows, columns: excelColumns }],
        `${excelFileName}.${excelFormat}`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      dispatch(addToast({ message, severity: 'error' }));
    }
  }, [exportExcelHandler, excelData, items, dispatch]);

  const onImportExcel = useCallback(
    async (file: File) => {
      const result = await importExcel(t, file);
      const normalizedRows: TAdd[] = [];
      const invalidRowNumbers: number[] = [];

      for (const [index, row] of result.rows.entries()) {
        try {
          const normalized = await validateAndNormalize(row);
          if (normalized && !isUpdate(normalized)) {
            normalizedRows.push(normalized as TAdd);
          } else {
            invalidRowNumbers.push(index + 2);
          }
        } catch {
          invalidRowNumbers.push(index + 2);
        }
      }

      if (invalidRowNumbers.length > 0) {
        dispatch(
          addToast({
            message: t('error.failedNormalizeImportedRows', { rowNumber: invalidRowNumbers.join(', ') }),
            severity: 'error'
          })
        );
        return;
      }

      const batchResult = await addBatchTrigger(normalizedRows);
      setSelectedItem(undefined);
      if (batchResult.error) reportError(batchResult.error);
    },
    [t, validateAndNormalize, dispatch, isUpdate, addBatchTrigger, reportError]
  );

  const showExcelButtons = useCallback(() => {
    if (!excelData && !exportExcelHandler) return false;

    if (excelData) {
      const { excelColumns, excelFileName, excelFormat, excelTemplateData } = excelData;

      return excelColumns.length > 0 && excelTemplateData && excelFileName && excelFormat;
    }

    if (exportExcelHandler) return true;

    return false;
  }, [exportExcelHandler, excelData]);

  const onDownloadTemplate = useCallback(async () => {
    if (!excelData) return;
    const { excelColumns, excelFileName, excelFormat, excelTemplateData } = excelData;

    if (showExcelButtons())
      await exportExcel(
        [{ name: excelFileName, rows: excelTemplateData as Rows, columns: excelColumns }],
        `${excelFileName}_template.${excelFormat}`
      );
  }, [excelData, showExcelButtons]);

  const onFilter = useCallback(
    (filter: Filter[]) => {
      setPersistentFilters(filter);
    },
    [setPersistentFilters]
  );

  const onPageChange = useCallback((_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [persistentSearch, persistentSort, persistentFilters]);

  useEffect(() => {
    setCurrentPage(prev => {
      if (prev > totalPages) {
        return totalPages;
      }
      return prev;
    });
  }, [totalPages]);

  const noItemButton = noItemButtonText && (
    <Button
      variant="contained"
      color="primary"
      startIcon={<AddIcon />}
      onClick={() => {
        if (onAddClick) {
          onAddClick(onAdd);
        } else {
          onAdd();
        }
      }}
    >
      {noItemButtonText}
    </Button>
  );

  const crBusiness = (
    <PageAppBar
      title={title}
      isOpen={isModalOpen}
      isModal={inlineOnAdd ? false : typeof selectedItem === 'undefined'}
      handleClose={() => handleCloseModal(false)}
      handleSave={handleSave}
      renderCustomButtons={renderCustomButtons}
      renderForm={({ onChange }) =>
        form({
          item: selectedItem,
          onChange,
          onDelete: onDelete,
          onDuplicate: onDuplicate
        })
      }
      showBack={!isDesktop}
    />
  );

  let rightColumn: ReactNode;
  if (typeof selectedItem === 'undefined') {
    rightColumn = inlineOnAdd && isModalOpen ? crBusiness : <NoItem text={noItemText} node={noItemButton} />;
  } else {
    rightColumn = crBusiness;
  }

  const leftColumn = (
    <Grid size={{ xs: 12, md: showRightSide ? 4 : 12 }} component="div" sx={{ position: 'relative', height: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%', overflow: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {leftTitle && (
            <Typography
              variant="h5"
              noWrap
              component="div"
              sx={{
                color: theme.palette.secondary.main
              }}
            >
              {leftTitle}
            </Typography>
          )}
          <Box sx={{ flexGrow: 1 }} />
          {showExcelButtons() && (
            <ImportExportButton
              onExport={onExportToExcel}
              onImport={onImportExcel}
              onDownloadTemplate={onDownloadTemplate}
              showOnlyExport={showOnlyExport}
            />
          )}
        </Box>

        <SearchInput value={persistentSearch} onChange={onSearchChanged} />

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            justifyContent: 'space-between'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 3,
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            {filters.length > 0 && (
              <BottomFilterSheet filters={filters} selectedFilter={persistentFilters} onFilter={onFilter} />
            )}
            {filters.length <= 0 && <Box />}

            <FilterSortBar<keyof T, T>
              sortByOptions={sortOptions}
              activeSort={persistentSort.activeSort}
              activeSortBy={activeSortBy ?? persistentSort.activeSortBy}
              onChange={onFilterSortChange}
            />
          </Box>
          {persistentFilters.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                gap: 1,
                alignItems: 'center'
              }}
            >
              {persistentFilters
                .filter(filterItem => filterItem.value !== FilterType.all)
                .map(filterItem => {
                  return (
                    <Chip
                      key={filterItem.type}
                      label={filterItem.label}
                      color="primary"
                      onDelete={() => {
                        const newFilter = persistentFilters.filter(
                          newFilterItem => newFilterItem.value !== filterItem.value
                        );
                        const allFilter = filters.find(fi => fi.value === FilterType.all);
                        if (!newFilter.some(f => f.isGroup) && allFilter) {
                          newFilter.push(allFilter);
                        }

                        onFilter(newFilter);
                      }}
                    />
                  );
                })}
            </Box>
          )}
        </Box>

        {filteredItems.length <= 0 && (
          <NoItem
            text={
              persistentSearch !== '' || typeof persistentFilters !== 'undefined'
                ? t('common.noData')
                : t('common.noDataYet')
            }
            icon={<SearchOffIcon color="action" fontSize="large" />}
          />
        )}

        {paginatedItems.map(item => renderListItem(item, selectedItem, onEdit, onDelete))}

        <Box sx={{ flexGrow: 1 }} />

        {filteredItems.length > itemsPerPage && (
          <Stack sx={{ spacing: 2, alignItems: 'center' }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={onPageChange}
              color="primary"
              shape="rounded"
              variant="outlined"
              size="small"
            />
          </Stack>
        )}

        <Box sx={{ pb: 2 }} />
      </Box>
      {showAddButton && (
        <Tooltip title={t('ariaLabel.add')}>
          <Fab
            color="primary"
            aria-label={t('ariaLabel.add')}
            onClick={() => {
              if (onAddClick) {
                onAddClick(onAdd);
              } else {
                onAdd();
              }
            }}
            sx={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              zIndex: 1000
            }}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      )}
    </Grid>
  );
  return (
    <>
      {!inlineOnAdd && isModalOpen && crBusiness}
      <Confirmation
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        isOpen={showDeleteConfirm}
        text={t('common.confirmDelete')}
      />

      <Grid
        container
        component="div"
        spacing={2}
        sx={{ height: '100%', justifyContent: 'center', alignItems: 'stretch' }}
      >
        {!showRightSide && leftColumn}
        {showRightSide && (
          <>
            {isDesktop ? (
              <>
                {leftColumn}
                <Content node={rightColumn} />
              </>
            ) : (
              <>{typeof selectedItem === 'undefined' && !isModalOpen ? leftColumn : <Content node={rightColumn} />}</>
            )}
          </>
        )}
      </Grid>
    </>
  );
};
