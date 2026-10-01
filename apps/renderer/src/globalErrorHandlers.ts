import { store } from './state/configureStore';
import { addToast } from './state/pageSlice';

window.addEventListener('unhandledrejection', event => {
  store.dispatch(addToast({ message: String(event.reason), severity: 'error' }));
});

window.addEventListener('error', event => {
  store.dispatch(addToast({ message: event.error?.message || event.message, severity: 'error' }));
});
