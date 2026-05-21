import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ToastProvider, useToast } from './ToastContext';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(ToastProvider, null, children);

describe('useToast', () => {
  it('lève une erreur si utilisé hors du ToastProvider', () => {
    expect(() => renderHook(() => useToast())).toThrow(
      'useToast must be used within a ToastProvider'
    );
  });

  it('expose toastSuccess, toastError, toastInfo', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    expect(typeof result.current.toastSuccess).toBe('function');
    expect(typeof result.current.toastError).toBe('function');
    expect(typeof result.current.toastInfo).toBe('function');
  });
});

describe('ToastProvider', () => {
  it('toastSuccess ne lève pas d\'exception', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    expect(() => act(() => result.current.toastSuccess('Opération réussie'))).not.toThrow();
  });

  it('toastError ne lève pas d\'exception', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    expect(() => act(() => result.current.toastError('Une erreur est survenue'))).not.toThrow();
  });

  it('toastInfo ne lève pas d\'exception', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    expect(() => act(() => result.current.toastInfo('Information'))).not.toThrow();
  });

  it('plusieurs toasts s\'accumulent sans erreur', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    expect(() =>
      act(() => {
        result.current.toastSuccess('OK 1');
        result.current.toastError('KO');
        result.current.toastInfo('Info');
      })
    ).not.toThrow();
  });
});


