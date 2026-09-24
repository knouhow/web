"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import { createExamStore, type ExamStore } from "./exam-store";

type StoreApi = ReturnType<typeof createExamStore>;
const ExamStoreContext = createContext<StoreApi | null>(null);

export function ExamStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createExamStore());
  useEffect(() => {
    let failed = false;
    // localStorage를 사용할 수 없는 브라우저에서도 메모리 상태로 풀이할 수 있다.
    const unsubscribe = store.persist.onFinishHydration(() =>
      store.getState().finishHydration(failed),
    );
    Promise.resolve(store.persist.rehydrate())
      .catch(() => {
        failed = true;
      })
      .finally(() => {
        store
          .getState()
          .finishHydration(failed || !store.persist.hasHydrated());
      });
    return unsubscribe;
  }, [store]);
  return (
    <ExamStoreContext.Provider value={store}>
      {children}
    </ExamStoreContext.Provider>
  );
}

export function useExamStore<T>(selector: (store: ExamStore) => T): T {
  const store = useContext(ExamStoreContext);
  if (!store) throw new Error("ExamStoreProvider가 필요합니다.");
  return useStore(store, selector);
}
