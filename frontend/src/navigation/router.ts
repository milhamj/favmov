import { router as expoRouter } from 'expo-router';

export const router = {
  ...expoRouter,
  
  goBackSafely: (fallback: string = '/') => {
    if (expoRouter.canGoBack()) {
      expoRouter.back();
    } else {
      expoRouter.replace(fallback);
    }
  },
};