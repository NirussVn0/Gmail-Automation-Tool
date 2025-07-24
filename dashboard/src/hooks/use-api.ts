'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { errorHandler, retryHandler } from '@/lib/error-handler';
import { cacheManager } from '@/services/cache';

interface UseApiOptions<T> {
  immediate?: boolean;
  cache?: boolean;
  cacheTTL?: number;
  retry?: boolean;
  retryAttempts?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastFetch: Date | null;
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = [],
  options: UseApiOptions<T> = {}
) {
  const {
    immediate = true,
    cache = false,
    cacheTTL = 5 * 60 * 1000,
    retry = true,
    retryAttempts = 3,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null,
  });

  const cacheKey = cache ? `api_${JSON.stringify(dependencies)}` : null;

  const execute = useCallback(async (force = false) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      if (cache && cacheKey && !force) {
        const cached = await cacheManager.get<T>(cacheKey);
        if (cached) {
          setState({
            data: cached,
            loading: false,
            error: null,
            lastFetch: new Date(),
          });
          onSuccess?.(cached);
          return cached;
        }
      }

      const operation = retry
        ? () => retryHandler.retry(apiCall, { maxAttempts: retryAttempts })
        : apiCall;

      const result = await operation();

      if (cache && cacheKey) {
        await cacheManager.set(cacheKey, result, cacheTTL);
      }

      setState({
        data: result,
        loading: false,
        error: null,
        lastFetch: new Date(),
      });

      onSuccess?.(result);
      return result;
    } catch (error) {
      const handledError = errorHandler.handleError(error as Error, {
        component: 'useApi',
        action: 'execute',
      });

      setState(prev => ({
        ...prev,
        loading: false,
        error: handledError,
      }));

      onError?.(handledError);
      throw handledError;
    }
  }, [apiCall, cache, cacheKey, cacheTTL, retry, retryAttempts, onSuccess, onError]);

  const refresh = useCallback(() => execute(true), [execute]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      lastFetch: null,
    });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  return {
    ...state,
    execute,
    refresh,
    reset,
    isStale: state.lastFetch && Date.now() - state.lastFetch.getTime() > cacheTTL,
  };
}

export function useMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    onSettled?: (data: TData | null, error: Error | null, variables: TVariables) => void;
  } = {}
) {
  const [state, setState] = useState<{
    data: TData | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (variables: TVariables) => {
    try {
      setState({ data: null, loading: true, error: null });

      const result = await mutationFn(variables);

      setState({
        data: result,
        loading: false,
        error: null,
      });

      options.onSuccess?.(result, variables);
      options.onSettled?.(result, null, variables);

      return result;
    } catch (error) {
      const handledError = errorHandler.handleError(error as Error, {
        component: 'useMutation',
        action: 'mutate',
      });

      setState({
        data: null,
        loading: false,
        error: handledError,
      });

      options.onError?.(handledError, variables);
      options.onSettled?.(null, handledError, variables);

      throw handledError;
    }
  }, [mutationFn, options]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}

export function useInfiniteQuery<T>(
  queryFn: (page: number) => Promise<{ data: T[]; hasMore: boolean; total: number }>,
  options: {
    pageSize?: number;
    cache?: boolean;
    onSuccess?: (data: T[], page: number) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const { pageSize = 20, cache = false, onSuccess, onError } = options;

  const [state, setState] = useState<{
    data: T[];
    loading: boolean;
    error: Error | null;
    hasMore: boolean;
    page: number;
    total: number;
  }>({
    data: [],
    loading: false,
    error: null,
    hasMore: true,
    page: 0,
    total: 0,
  });

  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const nextPage = state.page + 1;
      const result = await queryFn(nextPage);

      setState(prev => ({
        data: [...prev.data, ...result.data],
        loading: false,
        error: null,
        hasMore: result.hasMore,
        page: nextPage,
        total: result.total,
      }));

      onSuccess?.(result.data, nextPage);
    } catch (error) {
      const handledError = errorHandler.handleError(error as Error, {
        component: 'useInfiniteQuery',
        action: 'loadMore',
      });

      setState(prev => ({
        ...prev,
        loading: false,
        error: handledError,
      }));

      onError?.(handledError);
    }
  }, [queryFn, state.loading, state.hasMore, state.page, onSuccess, onError]);

  const reset = useCallback(() => {
    setState({
      data: [],
      loading: false,
      error: null,
      hasMore: true,
      page: 0,
      total: 0,
    });
  }, []);

  useEffect(() => {
    loadMore();
  }, []);

  return {
    ...state,
    loadMore,
    reset,
  };
}
