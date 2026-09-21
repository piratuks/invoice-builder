import { a11yProps } from '../generalFunctions';

describe('a11yProps', () => {
  it('builds MUI tab accessibility props for the given index', () => {
    expect(a11yProps(0)).toEqual({ id: 'mui-tab-0', 'aria-controls': 'mui-tabpanel-0' });
    expect(a11yProps(3)).toEqual({ id: 'mui-tab-3', 'aria-controls': 'mui-tabpanel-3' });
  });
});
